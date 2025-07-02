import { io } from "../../server.js";
import logger from "../../utils/logger/winston-logger.js";
import { groupConsumer, kafkaConfig, privateConsumer } from "../../config/kafka.js";
import { redisClient } from "../../config/redis.js";
import Message from "../../models/message-model.js";
import Conversation from "../../models/conversation-model.js";
import { startPrivateConsumer } from "./private-consumer.js";

// Batch config
const BATCH_LIMIT = 10;
const BATCH_TIMEOUT_MS = 5000;

// In-memory batch buffers
let messageBatch = [];
let conversationUpdateMap = new Map(); // Key: conversationId, Value: {lastMessageId, senderId}
let redisClearOperations = [];
let batchTimer = null;

async function processBatch() {
  if (messageBatch.length === 0) return;

  try {
    // 1. Insert messages in bulk
    const insertedMessages = await Message.insertMany(messageBatch);
    logger.info(`📦 Inserted ${insertedMessages.length} messages in batch.`);

    // 2. Process conversation updates
    const conversationUpdates = Array.from(conversationUpdateMap.values()).map(update => ({
      updateOne: {
        filter: { _id: update.conversationId },
        update: {
          $set: {
            lastMessage: update.lastMessageId,
            updatedAt: new Date()
          },
          $inc: {
            "participants.$[elem].unreadCount": 1
          }
        },
        arrayFilters: [{
          "elem.userId": { $ne: update.senderId }
        }]
      }
    }));

    if (conversationUpdates.length > 0) {
      await Conversation.bulkWrite(conversationUpdates);
      logger.info(`🔄 Updated ${conversationUpdates.length} conversations`);
    }

    // 3. Clear Redis message IDs using multi() (for redis@4+)
    if (redisClearOperations.length > 0) {
      const multi = redisClient.multi();
      redisClearOperations.forEach(({ key, messageId }) => {
        multi.lRem(key, 0, messageId);
      });
      await multi.exec();
      logger.info(`🧹 Cleared ${redisClearOperations.length} Redis message IDs`);
    }

    // Reset batch
    messageBatch = [];
    conversationUpdateMap.clear();
    redisClearOperations = [];

  } catch (err) {
    logger.error("❌ Batch processing failed:", err);
  } finally {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

export const startGroupConsumer = async () => {
  await groupConsumer.subscribe({ topic: 'group-messages' });
  logger.info(`✅ Subscribed to group topic: group-messages`);

  await groupConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const msg = JSON.parse(message.value.toString());
        const { chatId, sender, content, type, time,seenBy,deliveryTo,recipient,iv } = msg;

        const groupMessage = new Message({
          chatId,
          senderId: sender,
          content,
          type: type || "text",
          timestamp: time|| new Date(),
          deliveryTo: deliveryTo || [],
          seenBy: seenBy || [],
          iv,
        });

        const savedMessage = await groupMessage.save();

        await Conversation.findOneAndUpdate(
          { _id: chatId },
          {
            $set: { lastMessage: savedMessage._id, updatedAt: new Date() },
            $inc: { "participants.$[elem].unreadCount": 1 }
          },
          { arrayFilters: [{ "elem.userId": { $ne: sender } }] }
        );

        const members = await getGroupMembers(recipient);
        for (const member of members) {
          if (member.toString() === sender.toString()) continue;

          const online = await redisClient.get(`user:${member}`);
          if (online) {
            const { socketId } = JSON.parse(online);
            io.to(socketId).emit("receiveGroupMessage", {
              ...savedMessage.toObject(),
              chatId: groupId
            });
          } else {
            const redisKey = `messages:${member}:${recipient}`;
            await redisClient.lPush(redisKey, savedMessage._id.toString());
          }
        }

        logger.info("👥 Group message processed and broadcasted");
      } catch (err) {
        logger.error("❌ Error processing group message:", err);
      }
    }
  });
};

export async function startKafkaConsumers() {
  try {
    await startPrivateConsumer();
    await startGroupConsumer(); // Enable if needed
    logger.info("✅ Kafka consumers started successfully.");
  } catch (err) {
    logger.error("❌ Error starting Kafka consumers:", err);
  }
}

 const getGroupMembers = async (groupId) => {
  const conversation = await Conversation.findOne({ groupId }).populate('participants.userId');
  if (!conversation) return [];
  return conversation.participants.map(p => p.userId);
};  
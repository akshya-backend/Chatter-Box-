import { redisClient } from "../../config/redis.js";
import Message from "../../models/message-model.js";
import Conversation from "../../models/conversation-model.js";
import { kafkaConfig, privateConsumer } from "../../config/kafka.js";
import mongoose from "mongoose";

const parseKafkaTimestamp = (timestamp) => {
  return typeof timestamp === "string"
    ? new Date(parseInt(timestamp))
    : new Date(timestamp);
};

const getRecentMessagesKey = (chatId) => `recent:${chatId}`;
const getPendingMessagesKey = (recipient, chatId) =>
  `pending:${recipient}:${chatId}`;

async function handleRecipientStatus(message) {
  try {
    const recipientSocketData = await redisClient.get(
      `user:${message.recipient}`
    );
    if (!recipientSocketData)
      return { isOnline: false, isViewingChat: false };

    const parsedData = JSON.parse(recipientSocketData);
    return {
      isOnline: true,
      socketId: parsedData.socketId,
      isViewingChat: parsedData.chatStatus?.chatId === message.chatId,
    };
  } catch (error) {
    console.error("Error in handleRecipientStatus:", error);
    return { isOnline: false, isViewingChat: false };
  }
}

async function processMessageBatch(messages) {
  const now = new Date();
  const messageUpdates = [];
  const conversationUpdates = [];
  const redisCommands = [];

  for (const msg of messages) {
    try {
      if (!msg.chatId || !msg.sender || !msg.content) {
        console.warn("Invalid message format, skipping", msg);
        continue;
      }

      const timestamp = parseKafkaTimestamp(msg.time || msg.timestamp);
      const messageId = new mongoose.Types.ObjectId(msg._id);

      if (await Message.exists({ _id: messageId })) continue;

      const recipientStatus = await handleRecipientStatus(msg);
      const isNotSender = msg.sender !== msg.recipient;

      let deliveryTo = msg.deliveryTo || [];
      let seenBy = msg.seenBy || [];

      if (isNotSender && seenBy.length === 0) {
        if (!recipientStatus.isOnline) {
          deliveryTo = [];
          seenBy = [];
        } else if (!recipientStatus.isViewingChat) {
          deliveryTo = [{ userId: msg.recipient, deliveredAt: now }];
          seenBy = [];
        } else {
          deliveryTo = [{ userId: msg.recipient, deliveredAt: now }];
          seenBy = [{ userId: msg.recipient, seenAt: now }];
        }
      }
    
      
      messageUpdates.push({
        insertOne: {
          document: {
            _id: messageId,
            chatId: msg.chatId,
            senderId: msg.sender,
            recipient: msg.recipient,
            content: msg.content,
            iv: msg.iv || "",
            type: msg.type || "text",
            timestamp,
            deliveryTo,
            seenBy,
            pending: false,
          },
        },
      });

      let conversationUpdate;

      if (isNotSender && seenBy.length === 0) {
        conversationUpdate = {
          updateOne: {
            filter: { _id: msg.chatId },
            update: {
              $set: { lastMessage: messageId, updatedAt: now },
              $inc: { "participants.$[elem].unreadCount": 1 },
              $push: {
                "participants.$[elem].unreadMessages": {
                  messageId,
                  sendAt: timestamp,
                },
              },
            },
            arrayFilters: [
              {
                "elem.userId": new mongoose.Types.ObjectId(msg.recipient),
              },
            ],
          },
        };
      } else {
        conversationUpdate = {
          updateOne: {
            filter: { _id: msg.chatId },
            update: {
              $set: { lastMessage: messageId, updatedAt: now },
            },
          },
        };
      }

      conversationUpdates.push(conversationUpdate);

      redisCommands.push(
        {
          type: "zRem",
          key: getRecentMessagesKey(msg.chatId),
          value: JSON.stringify(msg),
        },
        {
          type: "lRem",
          key: getPendingMessagesKey(msg.recipient, msg.chatId),
          value: msg._id.toString(),
        }
      );
    } catch (error) {
      console.error(`Error processing message ${msg._id}:`, error);
    }
  }

  try {
    await Promise.all([
      messageUpdates.length > 0 && Message.bulkWrite(messageUpdates),
      conversationUpdates.length > 0 &&
        Conversation.bulkWrite(conversationUpdates),
      redisCommands.length > 0 && executeRedisCommands(redisCommands),
    ].filter(Boolean));
  } catch (error) {
    console.error("Error in batch processing operations:", error);
    throw error;
  }
}

async function executeRedisCommands(commands) {
  if (commands.length === 0) return;

  const multi = redisClient.multi();
  const seenKeys = new Set();

  for (const cmd of commands) {
    const compositeKey = `${cmd.type}:${cmd.key}:${cmd.value}`;
    if (!seenKeys.has(compositeKey)) {
      if (cmd.type === "zRem") {
        multi.zRem(cmd.key, cmd.value);
      } else {
        multi.lRem(cmd.key, 0, cmd.value);
      }
      seenKeys.add(compositeKey);
    }
  }

  if (multi.length > 0) {
    await multi.exec();
  }
}

export async function startPrivateConsumer(io) {
  try {
    console.log("Connecting Kafka consumer...");
    await privateConsumer.connect();
    await privateConsumer.subscribe({
      topic: kafkaConfig.privateTopic,
      fromBeginning: false,
    });

    console.log("Starting consumer run...");
    await privateConsumer.run({
      eachBatchAutoResolve: false,
      eachBatch: async ({
        batch,
        resolveOffset,
        heartbeat,
        isRunning,
        commitOffsetsIfNecessary,
      }) => {
        try {
          console.log(`Processing batch with ${batch.messages.length} messages`);

          const messages = [];
          const offsets = {};

          for (const message of batch.messages) {
            if (!isRunning()) {
              console.log("Consumer stopped, aborting batch processing");
              break;
            }

            try {
              const parsedValue = JSON.parse(message.value.toString());
              console.log(
                "Processing message from partition:",
                batch.partition,
                "offset:",
                message.offset
              );

              messages.push(parsedValue);

              const tp = `${batch.topic}-${batch.partition}`;
              if (
                !offsets[tp] ||
                parseInt(message.offset) > parseInt(offsets[tp].offset)
              ) {
                offsets[tp] = {
                  topic: batch.topic,
                  partition: batch.partition,
                  offset: message.offset,
                };
              }

              await resolveOffset(message.offset);
            } catch (parseError) {
              console.error("Message parse error:", parseError);
              await resolveOffset(message.offset);
            }

            await heartbeat();
          }

          if (messages.length > 0) {
            await processMessageBatch(messages);
          }

          if (Object.keys(offsets).length > 0) {
            const offsetsToCommit = Object.values(offsets).map(
              ({ topic, partition, offset }) => ({
                topic,
                partition,
                offset: (parseInt(offset) + 1).toString(),
              })
            );

            console.log("Committing offsets:", offsetsToCommit);
            await privateConsumer.commitOffsets(offsetsToCommit);
          }

          console.log("Batch processed successfully");
        } catch (batchError) {
          console.error("Batch processing failed:", batchError);
        }
      },
    });

    console.log("Consumer is now running");
  } catch (error) {
    console.error("Consumer startup failed:", error);
    process.exit(1);
  }
}

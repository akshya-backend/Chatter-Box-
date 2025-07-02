import mongoose from "mongoose";
import { redisClient } from "../../config/redis.js";
import { producer } from "../../config/kafka.js";

// Constants
const RECENT_MESSAGES_TTL = 3600;
const PENDING_MESSAGE_TTL = 604800;

// Helper function to convert date to Kafka-compatible timestamp
const toKafkaTimestamp = (date) => {
  return typeof date === 'string' 
    ? new Date(date).getTime().toString()
    : date.getTime().toString();
};

const getRecentMessagesKey = (chatId) => `recent:${chatId}`;
const getPendingMessagesKey = (recipient, chatId) => `pending:${recipient}:${chatId}`;

async function handleRecipientStatus(socket, message) {
  const recipientSocketData = await redisClient.get(`user:${message.recipient}`);
  console.log("Recipient socket data:", recipientSocketData);
  
  if (!recipientSocketData) return { isOnline: false };

  const parsedData = JSON.parse(recipientSocketData);
  console.log("Parsed data:", parsedData);
  
  return {
    isOnline: true,
    socketId: parsedData.socketId,
    isViewingChat: parsedData.chatStatus?.chatId === message.chatId
  };
}

async function updateRedisCaches({ chatId, message, recipient, shouldStorePending }) {
  const multi = redisClient.multi();
  
  multi.zAdd(
    getRecentMessagesKey(chatId),
    { score: message.timestamp.getTime(), value: JSON.stringify(message) }
  );
  multi.expire(getRecentMessagesKey(chatId), RECENT_MESSAGES_TTL);

  if (shouldStorePending) {
    multi.lPush(getPendingMessagesKey(recipient, chatId), message._id.toString());
    multi.expire(getPendingMessagesKey(recipient, chatId), PENDING_MESSAGE_TTL);
  }

  await multi.exec();
}

export async function personalChatEvents(io, socket) {
  socket.on("private-message", async (msg, ack) => {
    try {
      const sender = socket.user;
      const messageId = new mongoose.Types.ObjectId();
      const { recipient, chatId, content, iv, time } = msg;

      if (!recipient || !chatId || !content) {
        throw new Error("Missing required message fields");
      }

      const timestamp = time ? new Date(time) : new Date();
      const { isOnline, socketId, isViewingChat } = await handleRecipientStatus(socket, {
        recipient,
        chatId
      });
  console.log("isViewingChat:", isViewingChat, "isOnline:", isOnline, "socketId:", socketId);
  
      const message = {
        _id: messageId,
        sender,
        recipient,
        chatId,
        content,
        iv,
        timestamp,
        pending: true,
        seenBy: isViewingChat ? [{ userId: recipient, timestamp }] : [],
        deliveryTo: isOnline ? [{ userId: recipient, deliveredAt: timestamp }] : [],
        seen: isViewingChat,
        deliver: isOnline
      };

      if (isOnline) {
        io.to(socketId).emit("receive-message", {
          ...message,
          senderId: { 
            _id: sender, 
            name: socket.userName, 
            avatar: socket.userAvatar 
          }
        });
      }

      await updateRedisCaches({
        chatId,
        message: {
          ...message,
          senderId: { 
            _id: sender, 
            name: socket.userName, 
            avatar: socket.userAvatar 
          }
        },
        recipient,
        shouldStorePending: !isOnline || !isViewingChat
      });
   console.log("before sending to kafka",message);
   
      // Convert timestamp to string before sending to Kafka
      await producer.send({
        topic: process.env.KAFKA_PRIVATE_TOPIC,
        messages: [{
          value: JSON.stringify({
            ...message,
            time: toKafkaTimestamp(timestamp)
          })
        }]
      });

      ack({
        success: true,
        messageId,
        recipient,
        seen: message.seen,
        deliver: message.deliver
      });

    } catch (error) {
      console.error("Message processing error:", {
        error: error.message,
        userId: socket.user,
        input: msg
      });

      ack({
        status: false,
        error: "Failed to process message",
        details: error.message
      });
    }
  });
}
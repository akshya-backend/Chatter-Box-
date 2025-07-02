import mongoose from "mongoose";
import { redisClient } from "../../config/redis.js";
import { producer } from "../../config/kafka.js";
import Group from "../../models/group-model.js";
import User from "../../models/user-model.js";

// Constants (same as private chat)
const RECENT_MESSAGES_TTL = 3600;
const PENDING_MESSAGE_TTL = 604800;

// Helper functions (same as private chat)
const getRecentMessagesKey = (chatId) => `recent:${chatId}`;
const getPendingMessagesKey = (userId, chatId) => `pending:${userId}:${chatId}`;
const toKafkaTimestamp = (date) => {
  return typeof date === 'string' 
    ? new Date(date).getTime().toString()
    : date.getTime().toString();
};

async function updateRedisCaches({ chatId, message, members, shouldStorePendingFor }) {
  const multi = redisClient.multi();
  
  // Add to recent messages for the group
  multi.zAdd(
    getRecentMessagesKey(chatId),
    { score: message.timestamp.getTime(), value: JSON.stringify(message) }
  );
  multi.expire(getRecentMessagesKey(chatId), RECENT_MESSAGES_TTL);

  // Add pending messages for offline members
  for (const memberId of shouldStorePendingFor) {
    multi.lPush(getPendingMessagesKey(memberId, chatId), message._id.toString());
    multi.expire(getPendingMessagesKey(memberId, chatId), PENDING_MESSAGE_TTL);
  }

  await multi.exec();
}

export async function groupChatEvents(io, socket) {
  socket.on("group-message-sent", async (msg, ack) => {
    try {
      const sender = socket.user;
      const messageId = new mongoose.Types.ObjectId();
      const { chatId, groupId, content, time, iv } = msg;

      // Validate required fields
      if (!groupId || !chatId || !content) {
        throw new Error("Missing required message fields");
      }

      // Fetch group and user info
      const group = await Group.findById(groupId).select("members");
      if (!group) {
        throw new Error("Group not found");
      }

      const user = await User.findById(sender).select("name avatar");
      if (!user) {
        throw new Error("User not found");
      }

      const timestamp = time ? new Date(time) : new Date();
      const members = group.members.map(m => m.userId?.toString()).filter(Boolean);
      const otherMembers = members.filter(memberId => memberId !== sender.toString());

      // Prepare message with consistent status fields
      const message = {
        _id: messageId,
        sender,
        groupId,
        chatId,
        content,
        iv,
        timestamp,
        pending: true, // Will be updated based on member status
        seenBy: [],
        deliveryTo: [],
        seen: false,
        deliver: false,
        senderInfo: {
          _id: sender,
          name: user.name,
          avatar: user.avatar.isHidden ? "/assets/images/user.png" : user.avatar.url
        }
      };

      const offlineMembers = [];
      let hasOnlineMembers = false;

      // Check each member's status
      for (const memberId of otherMembers) {
        const redisData = await redisClient.get(`user:${memberId}`);
        if (!redisData) {
          offlineMembers.push(memberId);
          continue;
        }

        const parsedData = JSON.parse(redisData);
        const isViewingChat = parsedData.chatStatus?.chatId === chatId;

        if (isViewingChat) {
          // Member is viewing this chat
          message.seenBy.push({ userId: memberId, timestamp });
          message.seen = true;
           message.deliveryTo.push({ userId: memberId, deliveredAt: timestamp });
          message.deliver = true;
          io.to(parsedData.socketId).emit("group-message-received", message);
        }else if(parsedData){
           message.deliveryTo.push({ userId: memberId, deliveredAt: timestamp });
          message.deliver = true;
          io.to(parsedData.socketId).emit("group-message-received", message);
        
        } else {
          offlineMembers.push(memberId);
        }

        hasOnlineMembers = hasOnlineMembers || !!parsedData.socketId;
      }

      // Update pending status based on member statuses
      message.pending = offlineMembers.length > 0;

      // Update Redis caches
      await updateRedisCaches({
        chatId,
        message,
        members: otherMembers,
        shouldStorePendingFor: offlineMembers
      });

      // Push to Kafka
      await producer.send({
        topic: process.env.KAFKA_GROUP_TOPIC,
        messages: [{
          value: JSON.stringify({
            ...message,
            time: toKafkaTimestamp(timestamp)
          })
        }]
      });

      // Acknowledge sender
      ack({
        success: true,
        messageId,
        groupId,
        seen: message.seen,
        deliver: message.deliver,
        pending: message.pending
      });

    } catch (err) {
      console.error("Group message processing error:", {
        error: err.message,
        userId: socket.user,
        input: msg
      });

      ack({
        status: false,
        error: "Failed to process group message",
        details: err.message
      });
    }
  });
}
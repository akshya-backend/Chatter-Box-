import mongoose from "mongoose";
import Message from "../../models/message-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import { redisClient } from "../../config/redis.js";
import Conversation from "../../models/conversation-model.js";
import { io } from "../../server.js";

const getRecentMessagesKey = (chatId) => `recent:${chatId}`;

export const paginateChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = extractAuthenticatedUserId(req);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Validate chatId
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ status: false, message: "Invalid chatId" });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.json({ status: false, message: "Chat not found" });
    }

    // Get the friendIds in participants in conversation
    const friendIds = conversation.participants
      .filter(participant => participant.userId.toString() !== userId.toString())
      .map(participant => participant.userId);

    // ================== FIRST PAGE ONLY: CLEAR UNREAD STATE ================== //
    if (pageNumber === 1) {
      // 1. Get the participant data for the current user
      const participant = conversation.participants.find(
        p => p.userId.toString() === userId.toString()
      );

      // 2. If there are unread messages, mark them as seen (except own messages)
      if (participant && participant.unreadCount > 0) {
        const unreadMessageIds = participant.unreadMessages.map(m => m.messageId);
        
        // Update messages where:
        // - message is in unread list
        // - sender is not the current user
        // - not already seen by current user
        await Message.updateMany(
          {
            _id: { $in: unreadMessageIds },
            senderId: { $ne: userId },
            seenBy: { $not: { $elemMatch: { userId: userId } } }
          },
          {
            $push: {
              seenBy: {
                userId: userId,
                seenAt: new Date()
              }
            }
          }
        );

        // Notify friends that messages were seen
        friendIds.forEach(async (friendId) => {
          const friendRedisData = await redisClient.get(`user:${friendId}`);
          if (friendRedisData) {
            const parsedData = JSON.parse(friendRedisData);
            if (parsedData.chatStatus?.chatId === chatId) {
              io.to(parsedData.socketId).emit("message-seen", { chatId, userId });
            }
          }
        });
      }

      // 3. Update user's active chat in Redis
      const userRedisData = await redisClient.get(`user:${userId}`);
      if (userRedisData) {
        const parsedData = JSON.parse(userRedisData);
        parsedData.chatStatus = { isChatting: true, chatId };
        await redisClient.set(`user:${userId}`, JSON.stringify(parsedData));
      }

      // 4. Reset unread counts in Conversation
      await Conversation.updateOne(
        { _id: chatId, "participants.userId": userId },
        { 
          $set: { 
            "participants.$.unreadCount": 0,
            "participants.$.unreadMessages": [] 
          }
        }
      );

      // 5. Clear Redis pending messages
      const redisPendingKey = `user:${userId}:${chatId}`;
      await redisClient.del(redisPendingKey);

      // 6. Mark undelivered messages as delivered (duplicate-proof)
      await Message.updateMany(
        { 
          chatId,
          deliveryTo: { $not: { $elemMatch: { userId: userId } } }
        },
        {
          $push: {
            deliveryTo: {
              userId: userId,
              deliveredAt: new Date()
            }
          }
        }
      );
    }

    // ================== PAGINATION LOGIC ================== //
    // Get messages from MongoDB
    const mongoMessages = await Message.find({ chatId })
      .sort({ timestamp: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("senderId", "name avatar.isHidden avatar.url")
      .lean();

    // Get recent messages from Redis (only for first page)
    let recentMessages = [];
    if (pageNumber === 1) {
      const recentMessagesStr = await redisClient.zRange(
        getRecentMessagesKey(chatId),
        Date.now() - 3600000, // Last hour
        '+inf',
        { BY: 'SCORE', REV: true }
      );
      recentMessages = recentMessagesStr.map(msg => JSON.parse(msg))
        .filter(msg => !mongoMessages.some(m => m._id.toString() === msg._id.toString()));
    }

    // Combine and process messages
    const allMessages = [...recentMessages, ...mongoMessages]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const processedMessages = allMessages.map(msg => {
      const senderInfo = msg.senderId?._id 
        ? { // MongoDB message
            _id: msg.senderId._id,
            name: msg.senderId.name,
            avatar: msg.senderId.avatar?.url || '/assets/images/user.png',
            isHidden: msg.senderId.avatar?.isHidden || false
          }
        : { // Redis message
            _id: msg.sender,
            name: msg.senderId?.name || 'Unknown',
            avatar: '/assets/images/user.png',
            isHidden: false
          };

      return {
        ...msg,
        name: senderInfo.name,
        profile: senderInfo.isHidden ? '/assets/images/user.png' : senderInfo.avatar,
        senderId: { id: senderInfo._id },
        seen: msg.seenBy.length > 0 ? true:false,
        deliver: msg.deliveryTo.length > 0 ? true:false,
        pending: msg.pending || false
      };
    });

    // Pagination metadata
    const totalMessages = await Message.countDocuments({ chatId });
    const totalPages = Math.ceil(totalMessages / limitNumber);

    res.status(200).json({
      status: true,
      messages: processedMessages.reverse(),
      userId,
      chatId,
      isGroup: conversation.type === "group",
      meta: {
        totalPages,
        currentPage: pageNumber,
        totalMessages,
        isLastPage: pageNumber >= totalPages,
      },
    });
  } catch (error) {
    console.error("Error in paginateChatMessages:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
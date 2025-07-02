import mongoose from "mongoose";
import { redisClient } from "../../config/redis.js";
import Conversation from "../../models/conversation-model.js";
import Friend from "../../models/friendList-model.js";
import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

export const confirmFriendRequest = async (req, res) => {
  try {
    const userId = extractAuthenticatedUserId(req);
    const { friendId } = req.body;
     console.log("Confirming friend request for userId:", userId, "and friendId:", friendId);
     
    if (!userId || !friendId) {
      return res.status(400).json({ status: false, message: "Invalid request" });
    }

    const friendData = await User.findById(friendId);
    if (!friendData) {
      return res.status(404).json({ status: false, message: "Friend not found" });
    }

    const userFriendList = await Friend.findOne({ userId });
    const friendFriendList = await Friend.findOne({ userId: friendId });

    // Check if already friends
    const alreadyFriends = userFriendList?.friends?.some(
      (f) => f.friendId.toString() === friendId
    );

    if (alreadyFriends) {
      return res.status(400).json({ status: false, message: "Already friends" });
    }

 
  //  check and create conversation id
    const isexistingConversation = await Conversation.findOne({
  type: "private",
  $and: [
    { "participants.userId":userId },
    { "participants.userId":friendId }
  ]
});

    let conversationId;
    if (isexistingConversation) {
      conversationId = isexistingConversation._id;
    } else {
      const newConversation = await Conversation.create({
        type: "private",
        participants: [
          { userId, joinedAt: new Date(), unreadCount: 0, unreadMessages: [] },
          { userId: friendId, joinedAt: new Date(), unreadCount: 0, unreadMessages: [] }
        ],
        friendId,
        lastMessage: null
      });
      conversationId = newConversation._id;
    }

    // Update: Remove request, Add to friends, Update status
    const [updatedUserFriendList, updatedFriendFriendList] = await Promise.all([
      Friend.findOneAndUpdate(
        { userId },
        {
          $pull: { friendRequests: { requesterId: friendId } },
          $push: { friends: { friendId, isBlocked: false, isBlockedbyOther: false ,chatId:conversationId} },
        },
        { new: true }
      ).select("friends friendRequests"),
      Friend.findOneAndUpdate(
        { userId: friendId },
        {
          $push: { friends: { friendId: userId, isBlocked: false, isBlockedbyOther: false,chatId:conversationId } },
        },
        { new: true }
      ).select("friends")
    ]);

    // Clear Redis cache
    await Promise.all([
      redisClient.del(`friends:${userId}`),
      redisClient.del(`friends:${friendId}`)
    ]);

    res.status(200).json({
      status: true,
      message: "✅ Friend request confirmed",
      updatedFriends: updatedUserFriendList.friends,
      updatedFriendRequests: updatedUserFriendList.friendRequests
    });

  } catch (error) {
    console.error("🔥 Error in confirmFriendRequest:", error);
    res.status(500).json({
      status: false,
      message: "Failed to confirm friend request",
      error: error.message
    });
  }
};

  export  const rejectFriendRequest = async (req, res) => {
    try {
      const userId = extractAuthenticatedUserId(req);
      const { friendId } = req.body;

      if (!userId || !friendId) {
        return res.status(400).json({ status: false, message: "Invalid request" });
      }

      const userFriendList = await Friend.findOne({ userId });

      // Check if request exists
      const requestExists = userFriendList?.friendRequests?.some(
        (req) => req.requesterId.toString() === friendId && req.status === "pending"
      );

      if (!requestExists) {
        return res.status(400).json({ status: false, message: "No pending friend request from this user" });
      }

      // Update: Remove request
      const updatedFriendList = await Friend.findOneAndUpdate(
        { userId },
        { $pull: { friendRequests: { requesterId: friendId } } },
        { new: true }
      ).select("friends friendRequests");

      // Clear Redis cache
      await redisClient.del(`friends:${userId}`);

      res.status(200).json({
        status: true,
        message: "✅ Friend request rejected",
        updatedFriends: updatedFriendList.friends,
        updatedFriendRequests: updatedFriendList.friendRequests
      });

    } catch (error) {
      console.error("🔥 Error in rejectFriendRequest:", error);
      res.status(500).json({
        status: false,
        message: "Failed to reject friend request",
        error: error.message
      });
    }
  }
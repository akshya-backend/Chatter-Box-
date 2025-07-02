import { redisClient } from "../../config/redis.js";
import Friend from "../../models/friendList-model.js";
import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

// Utility to get userId from req
const getAuthenticatedUserId = (req) => extractAuthenticatedUserId(req); // or however you're extracting it

// Utility to find users and their friend models
const findUserAndFriends = async (userId, friendEmail) => {
  if (!friendEmail) return { error: "Please enter a valid email address" };

  const friendInfo = await User.findOne({ email: friendEmail });
  if (!friendInfo) return { error: "User not found" };

  const userFriendDoc = await Friend.findOne({ userId: friendInfo._id });
  const otherUserDoc = await Friend.findOne({ userId });

  if (!userFriendDoc || !otherUserDoc) return { error: "Friend model not found" };

  return { friendInfo, userFriendDoc, otherUserDoc };
};

// Block a friend
export const blockFriend = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { email } = req.body;

    const { error, friendInfo, userFriendDoc, otherUserDoc } = await findUserAndFriends(userId, email);
    if (error) return res.json({ status: false, message: error });

    const friendInTheirList = userFriendDoc.friends.find(f => f.friendId.toString() === userId.toString());
    const friendInYourList = otherUserDoc.friends.find(f => f.friendId.toString() === friendInfo._id.toString());

    if (!friendInTheirList || !friendInYourList)
      return res.json({ status: false, message: "Friend not found in your friend list" });

    // Mark as blocked
    friendInTheirList.isBlockedbyOther = true;
    friendInYourList.isBlocked = true;

    await Promise.all([userFriendDoc.save(), otherUserDoc.save()]);
    await Promise.all([redisClient.del(`friends:${userId}`), redisClient.del(`friends:${friendInfo._id}`)]);
    res.json({ status: true, message: "Friend blocked successfully" });

  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Unblock a friend
export const unblockFriend = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { email } = req.body;

    const { error, friendInfo, userFriendDoc, otherUserDoc } = await findUserAndFriends(userId, email);
    if (error) return res.json({ status: false, message: error });

    const friendInTheirList = userFriendDoc.friends.find(f => f.friendId.toString() === userId.toString());
    const friendInYourList = otherUserDoc.friends.find(f => f.friendId.toString() === friendInfo._id.toString());

    if (!friendInTheirList || !friendInYourList)
      return res.json({ status: false, message: "Friend not found in your friend list" });

    // Unblock
    friendInTheirList.isBlockedbyOther = false;
    friendInYourList.isBlocked = false;

    await Promise.all([userFriendDoc.save(), otherUserDoc.save()]);
    res.json({ status: true, message: "Friend unblocked successfully" });

  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Remove a friend
export const removeFriend = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { email } = req.body;

    const { error, friendInfo, userFriendDoc, otherUserDoc } = await findUserAndFriends(userId, email);
    if (error) return res.json({ status: false, message: error });

    const removeFriendFromList = (doc, targetId) => {
      const index = doc.friends.findIndex(f => f.friendId.toString() === targetId.toString());
      if (index !== -1) doc.friends.splice(index, 1);
    };

    removeFriendFromList(userFriendDoc, userId);
    removeFriendFromList(otherUserDoc, friendInfo._id);

    await Promise.all([userFriendDoc.save(), otherUserDoc.save()]);
    res.json({ status: true, message: "Friend removed successfully" });

  } catch (err) {
    console.error("Remove error:", err);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};


import { redisClient } from "../../config/redis.js";
import Friend from "../../models/friendList-model.js";
import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

  export const  sendFriendRequest =async (req,res) => {
    // Send friend request to the backend
    try {
    const userId = extractAuthenticatedUserId(req);
    const { email, message } = req.body;
     if (!email) { 
         return res.json({ status: false, message: "Please enter a valid email address" });
     }
       const friendInfo = await User.findOne({ email });
       if (!friendInfo) {
         return res.json({ status: false, message: "User not found" });
      }
      const user = await Friend.findOne({userId:friendInfo._id });
      
      if (!user) {
         return res.json({ status: false, message: " friend model not found" });
      }
      const isAlreadyFriend = user.friends.some((f) => f.friendId.toString() === userId.toString());
      if (isAlreadyFriend) {
         return res.json({ status: false, message: "User is already your friend" });
      }
      const friendRequestIndex = user.friendRequests.findIndex(request => request.requesterId.toString() === userId.toString());    
      if (friendRequestIndex!== -1) {
        return  res.json({ status: false, message: "Friend request already sent" });
      }
      user.friendRequests.push({requesterId: userId, message});
      await user.save();
      // Check and  clear  if the  both user  redis list exists
      const friendRedisKey = `friends:${friendInfo._id}`;
      const userRedisKey = `friends:${userId}`;
      await redisClient.del(friendRedisKey);
      await redisClient.del(userRedisKey);
      
    res.json({ status: true, message: "Friend request sent successfully" });
      
    }catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }

 }
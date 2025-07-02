import { redisClient } from "../../config/redis.js";
import Friend from "../../models/friendList-model.js";
import GroupList from "../../models/groupList-model.js";
import User from "../../models/user-model.js";
import logger from "../../utils/logger/winston-logger.js";

const REDIS_USER_KEY_PREFIX = "user:";

export async function handleUserConnection(io, socket) {
  try {
    const userId = socket.user;
    if (!userId) {
      logger.warn("User ID missing in socket connection.");
      throw new Error("Unauthorized access: userId is not available.");
    }

    const fetchFriendlist = await Friend.findOne({ userId }).populate("friends.friendId");
    if (fetchFriendlist) {
      const friendsList = fetchFriendlist.friends.map(friend => friend.friendId._id.toString());

      for (const friendId of friendsList) {
        const friendSession = await redisClient.get(`${REDIS_USER_KEY_PREFIX}${friendId}`);
        if (friendSession) {
          const { socketId: friendSocketId } = JSON.parse(friendSession);
          io.to(friendSocketId).emit("friend-online", { userId, socketId: socket.id });
          logger.info(`Sent 'friend-online' to ${friendId}`);
        }
      }
    }

    const result = await GroupList.findOne({ userId }).populate("groups.groupId", "chatId");
    if (result) {
      const unblocked = result.groups
        .filter(g => !g.isblocked && g.groupId?.chatId)
        .map(g => g.groupId.chatId.toString());

      unblocked.forEach(groupId => socket.join(groupId));
    }

    const redisKey = `${REDIS_USER_KEY_PREFIX}${userId}`;
    const sessionData = {
      userId,
      socketId: socket.id,
      chatStatus: {
        isChatting: false,
        chatId: null,
      },
    };

    await redisClient.set(redisKey, JSON.stringify(sessionData), {
      EX: 60 * 60,
      NX: true,
    });

    logger.info(`User ${userId} connected with socket ID ${socket.id}`);
  } catch (err) {
    logger.error(`handleUserConnection error: ${err.message}`, {
      socketId: socket?.id,
      user: socket?.user,
    });
  }
}
const REDIS_FRIENDS_KEY_PREFIX = "friends:";
const REDIS_GROUPS_KEY_PREFIX = "groups:";

export async function handleUserDisconnection(io, socket) {
  try {
    const userId = socket.user;
    const socketId = socket.id;
  console.log(`User ${userId} disconnected with socket ID ${socketId}`);
  
    if (!userId) {
      logger.warn("Disconnection attempt with missing user ID.");
      return;
    }

    const userKey = `${REDIS_USER_KEY_PREFIX}${userId}`;
    const storedSession = await redisClient.get(userKey);
    if (!storedSession) return;

    const fetchFriendlist = await Friend.findOne({ userId }).populate("friends.friendId");
    if (fetchFriendlist) {
      const friendsList = fetchFriendlist.friends.map(friend => friend.friendId._id.toString());

      for (const friendId of friendsList) {
        const friendSession = await redisClient.get(`${REDIS_USER_KEY_PREFIX}${friendId}`);
        if (friendSession) {
          const { socketId: friendSocketId } = JSON.parse(friendSession);
          io.to(friendSocketId).emit("friend-offline", { userId });
          logger.info(`Sent 'friend-offline' to ${friendId}`);
        }
      }
    }

    const pipeline = redisClient.multi();
    pipeline.del(userKey);
    pipeline.del(`${REDIS_FRIENDS_KEY_PREFIX}${userId}`);
    pipeline.del(`${REDIS_GROUPS_KEY_PREFIX}${userId}`);
    await pipeline.exec();
    // save the last seen time
     await User.updateOne({ _id: userId }, { $set: { lastSeen : { lastSeenAt: new Date() } }});
     
     socket.disconnect();

    logger.info(`User ${userId} disconnected and Redis data cleared.`);
  } catch (err) {
    logger.error(`handleUserDisconnection error: ${err.message}`, {
      socketId: socket?.id,
      userId: socket?.user,
    });
  }
}

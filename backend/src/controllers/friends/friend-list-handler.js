import { redisClient } from "../../config/redis.js";
import Friend from "../../models/friendList-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import { getLastMessage } from "../chat/recent-chats-handler.js";

export const getFriendList = async (req, res) => {
    
    const userId = extractAuthenticatedUserId(req);
    if (!userId) {
        return res.status(401).json({ 
            status: false,
            message: "Authentication required" 
        });
    }

    const redisKey = `friends:${userId}`;
    
    try {
        // 1. Check Redis cache
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            return res.status(200).json({ 
                status: true, 
                source: "cache",
                data: JSON.parse(cachedData) 
            });
        }

        // 2. Fetch from database
        const friendDoc = await Friend.findOne({ userId })
            .populate({
                path: "friends.friendId",
                select: "name email avatar lastSeen showOnlineStatus status publicKey",
                model: "User"
            })
            .populate({
                path: "friendRequests.requesterId",
                select: "name email avatar lastSeen showOnlineStatus status publicKey",
                model: "User"
            })
            .populate({
                path: "friends.chatId",
                select: "lastMessage",
                populate: {
                    path: "lastMessage",
                    select: "content type createdAt iv isdeletedBy",
                    model: "Message"
                }
            })
            .lean();
  
        if (!friendDoc) {
            return res.status(200).json({ 
                status: true,
                data: {
                    all: [],
                    requests: [],
                    blocked: [],
                    counts: {
                        friends: 0,
                        requests: 0,
                        blocked: 0
                    }
                } 
            });
        }

        // 3. Process data
        const [allFriends, blockedFriends] = await processFriendsList(friendDoc.friends || []);
        const requests = processFriendRequests(friendDoc.friendRequests || []);
   
        // 4. Prepare response
        const responseData = {
            all: allFriends,
            requests,
            blocked: blockedFriends,
            counts: {
                friends: allFriends.length,
                requests: requests.length,
                blocked: blockedFriends.length
            }
        };
          
        // 5. Cache the response
        await redisClient.setEx(redisKey,60, JSON.stringify(responseData));

        return res.status(200).json({
            status: true,
            source: "database",
            data: responseData
        });

    } catch (error) {
        console.error("Friend list error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

// Process friends list into unblocked and blocked
async function processFriendsList(friends) {
    const all = [];
    const blocked = [];
    
    const onlineChecks = friends.map(async (friend) => {
        
        if (!friend.friendId) return null;
        
        const isOnline = await checkUserOnlineStatus(friend.friendId._id);
        
        const friendData = {
            id: friend.friendId._id,
            name: friend.friendId.name,
            email: friend.friendId.email,
            avatar: friend.friendId.avatar.isHidden ? "" : friend.friendId.avatar.url,
            status: friend.friendId.status,
            isOnline,
            unread: 0,
            isGroup:false,
            chatId: friend.chatId,
            isBlocked: friend.isBlocked,
            addedAt: friend.addedAt,
            key:friend.friendId.publicKey,
            lastMessage: friend.chatId.lastMessage,
            isBlocked: friend.isBlocked,
            isRemoved: false,   
            lastUpdated: friend.friendId.showOnlineStatus ? 
                     friend.friendId.lastSeen?.lastSeenAt : undefined,
                    

        };
    
        return friendData;
    });
    const processedFriends = (await Promise.all(onlineChecks)).filter(f => f !== null);
    
    processedFriends.forEach(friend => {
        friend.isBlocked ? blocked.push(friend) : all.push(friend);
    });

    return [all, blocked];
}

// Process pending friend requests
function processFriendRequests(requests) {
    return requests
        .filter(request => 
            request.status === "pending" && 
            request.requesterId
        )
        .map(request => {
            
            return {
                id: request.requesterId._id,
                name: request.requesterId.name, 
                email: request.requesterId.email,
                avatar: request.requesterId.avatar.isHidden ? "" : request.requesterId.avatar.url ,
                status: request.requesterId.status,
                message: request.message || "",
                createdAt: request.createdAt,
            }; 
        });
}

// Check if user is online via Redis
async function checkUserOnlineStatus(userId) {
    try {
        const online = await redisClient.exists(`user:${userId}`);
         const result =Boolean(online);
         console.log(result);
         
        return  result
    } catch (error) {
        console.error("Online check error:", error);
        return false;
    }
}


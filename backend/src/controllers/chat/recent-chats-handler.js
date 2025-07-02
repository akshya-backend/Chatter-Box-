import { redisClient } from "../../config/redis.js";
import Conversation from "../../models/conversation-model.js";
import Friend from "../../models/friendList-model.js";
import GroupList from "../../models/groupList-model.js";
import Message from "../../models/message-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

const recentChats = async (req, res) => {
    try {
        const token = extractAuthenticatedUserId(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Step 1: Fetch all conversations for the user
        const recentChats = await Conversation.find({ participants: { $elemMatch: { userId: token } } })
            .sort({ updatedAt: -1 })
            .populate("participants.userId", "name avatar email lastSeen isOnline publicKey")
            .populate("groupId", "groupName picture members key")
            .populate("lastMessage", "text type createdAt content iv isdeletedBy");
   
        const recentChatsWithStatus = [];
      
        for (const chat of recentChats) {
              let isBlocked = false;
             let isRemoved=false;
            const isFriend=chat.type
            if (isFriend == "private") {
                const friendIdfromParticipant=  chat.participants.find(friend=>friend.userId._id.toString()!= token)    

                const Infriendlist =await Friend.findOne({userId:token})
                
                if(Infriendlist){
                    const findthefriend=Infriendlist.friends.find(friend=>friend.friendId.toString()===friendIdfromParticipant.userId._id.toString())    
                                    
                    if(findthefriend){
                        isBlocked=findthefriend.isBlocked
                    }else{
                        isRemoved=true
                    }
                    }
            }else{
                const findGroup=await GroupList.findOne({userId:token})
                if(findGroup){   
                     const findthegroup=findGroup.groups.find(group=>group.groupId.toString()=== chat.groupId._id.toString())
                     
                     if(findthegroup){
                        isBlocked=findthegroup.isblocked
                     }else{
                        isRemoved=true
                     }
                }
                         } 
            // Step 2: Find current participant
            const currentParticipant = chat.participants.find(p => p.userId._id == token);
            if (!currentParticipant) {
                continue;
            }

            // Step 3: Get pending messages from Redis
            const redisKey = `user:${token}:${chat._id}`;
            const pendingMessageIds = await redisClient.lRange(redisKey, 0, -1);

            // Step 4: Combine Redis + MongoDB unread message IDs
            const mongoUnreadMessageIds = currentParticipant.unreadMessages?.map(msg => msg.messageId.toString()) || [];
            const allUnreadMessageIds = [...new Set([...pendingMessageIds, ...mongoUnreadMessageIds])]; // Remove duplicates

            // Step 5: Mark undelivered messages as "delivered"
            if (allUnreadMessageIds.length > 0) {
                const undeliveredMessages = await Message.find({
                    _id: { $in: allUnreadMessageIds },
                    "deliveryTo.userId": { $ne: token } // Only messages not delivered to me
                });

                if (undeliveredMessages.length > 0) {
                    await Message.updateMany(
                        { _id: { $in: undeliveredMessages.map(msg => msg._id) } },
                        { 
                            $addToSet: { 
                                deliveryTo: { 
                                    userId: token,
                                    deliveredAt: new Date() 
                                } 
                            } 
                        }
                    );

                    // Update unread count in participant
                    await Conversation.updateOne(
                        { _id: chat._id, "participants.userId": token },
                        { $inc: { "participants.$.unreadCount": undeliveredMessages.length } }
                    );
                }
            }

            // Step 6: Calculate total unread count (Redis pending + MongoDB unread)
            const pendingCount = pendingMessageIds.length;
            const mongoUnreadCount = currentParticipant.unreadCount || 0;
            const totalUnreadCount = pendingCount + mongoUnreadCount;

            // Step 7: Prepare chat metadata
            let name = "Unknown";
            let avatar = "";
            let email = "";
            let isOnline = false;
            let friendId = null;
            let lastUpdated = null;
            let publicKey = null;

            if (chat.type === 'private') {                
                const other = chat.participants.find(p => p.userId._id.toString() !== token);
                if (!other) {
                    continue;
                }
                lastUpdated = other?.userId?.lastSeen?.lastSeenAt;
                name = other?.userId?.name || "Unknown";
                avatar = other?.userId?.avatar?.isHidden ? "" : other?.userId?.avatar?.url || "";
                email = other?.userId?.email || "";
                isOnline = Boolean(await redisClient.get(`user:${other?.userId?._id}`));
                friendId = other?.userId?._id || null;
                publicKey = other?.userId?.publicKey || null;
            } else {
                publicKey = chat.groupId?.key;
                name = chat.groupId?.groupName || "Group";
                avatar = chat.groupId?.picture || "";
            }
      
            recentChatsWithStatus.push({
                chatId: chat._id,
                isGroup: chat.type === 'group',
                id: chat.type === 'private' ? friendId : chat.groupId._id,
                email,
                name,
                avatar,
                isOnline,
                unread: totalUnreadCount,
                lastUpdated: isOnline ? "" : lastUpdated,
                lastMessage: chat.lastMessage,
                key: publicKey,
                isBlocked:isBlocked,
                isRemoved
            });        }

        res.status(200).json({ all: recentChatsWithStatus });
    } catch (error) {
        console.error("[ERROR] recentChats failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getLastMessage = (msg) => {
    
    if (!msg) return null;
    switch (msg.type) {
        case 'text':
            if (msg.isdeletedBy) {
                return "This message has been deleted.";
            }
            return "Text message ";
        case 'image':
            if (msg.isdeletedBy) {
                return "This image has been deleted.";
            }
            return "📷 Image";
        case 'video':
            if (msg.isdeletedBy) {
                return "This video has been deleted.";
            }
            return "🎥 Video";
        default:
            return "message";
    }
};


export default recentChats;

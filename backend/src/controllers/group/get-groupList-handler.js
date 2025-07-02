import { redisClient } from "../../config/redis.js";
import GroupList from "../../models/groupList-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import { getLastMessage } from "../chat/recent-chats-handler.js";

export const getGroupList = async (req, res) => {
    const userId = extractAuthenticatedUserId(req);
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const redisKey = `groups:${userId}`;

    try {
        // 1. Try to return from Redis cache
        const cached = await redisClient.get(redisKey);
        if (cached) {
            console.log("Serving group list from Redis cache");
            return res.json({ status: true, source: "redis", data: JSON.parse(cached) });
        }

        // 2. Fetch from MongoDB
        const groupList = await GroupList.findOne({ userId })
            .populate({
  path: "groups.groupId",
  select: "groupName picture _id chatId admin members key",
  populate: {
    path: "chatId", // ✅ First populate the referenced chatId
    select: "lastMessage",
    populate: {
      path: "lastMessage", // ✅ Then populate the lastMessage from Message model
      select: "content type createdAt iv isdeletedBy",
      model: "Message"
    }
  }
})

            .lean();
  
        if (!groupList || !Array.isArray(groupList.groups)) {
            return res.json({ status: true, data: { all: [], blocked: [] } });
        }

        // 3. Sort and filter the group list in one pass
        const allGroups = [];
        const blockedGroups = [];

        for (const group of groupList.groups.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))) {
            if (!group.groupId) continue; // in case the populate fails for some
           
            const groupInfo = {
                id: group.groupId._id,
                chatId:group.groupId.chatId,
                name: group.groupId.groupName,
                avatar: group.groupId.picture,
                isAdmin: group.isAdmin,
                joinedAt: group.joinedAt,
                isGroup: true,
                unread: 0,
                isBlocked: group.isblocked,
                isRemoved: false,
                key: group.groupId.key,
                lastMessage: group.groupId.chatId.lastMessage,
            };

            (group.isblocked ? blockedGroups : allGroups).push(groupInfo);
        }

        const responseData = { all: allGroups, blocked: blockedGroups };

        // 4. Cache result in Redis for 5 minutes
        await redisClient.setEx(redisKey, 60, JSON.stringify(responseData));
        console.log("Group list response data:", responseData);

        res.json({ status: true, source: "mongoDb", data: responseData });
    } catch (err) {
        console.error("Error in getGroupList:", err);
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
};


// export const getGroupInfo = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const authenticatedUserId = extractAuthenticatedUserId(req);
//          const user = await User.findById(authenticatedUserId)
//         const group = await Group.findById(groupId)
//             .populate({
//                 path: "members.userId",
//                 select: "_id name profilePicture friends"
//             })
//             .lean();

//         if (!group) {
//             return res.status(404).json({ status: false, message: "Group not found" });
//         }


//         const groupInfo = {
//             groupName: group.groupName,
//             picture: group.picture,
//             description: group.description,
//             createdBy: group.createdBy,
//             members: group.members.map(member => ({
//                 _id: member.userId?._id,
//                 name: member.userId?.name,
//                 profilePicture: member.userId?.profilePicture,
//                 isAdmin: member.isAdmin,
//                 isFriend: user.friends?.some(friend => friend.friendId.toString() === member.userId._id.toString())
//             })),
//             createdAt: group.createdAt,
//             updatedAt: group.updatedAt,
//             isAdmin: authenticatedUserId.toString() === group.createdBy.toString(),
//             myId: authenticatedUserId
//         };
//        console.log(groupInfo.members);
       
//         res.status(200).json({ status: true, data: groupInfo });
//     } catch (error) {
//         console.error("Error fetching group info:", error);
//         res.status(500).json({ status: false, message: "Internal server error" });
//     }
// };


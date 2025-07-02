import { redisClient } from "../../config/redis.js";
import GroupList from "../../models/groupList-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

const GroupService = {
  blockGroup: async (userId, groupId) => {
    if (!userId || !groupId) {
      return { success: false, message: 'User ID and Group ID are required.' };
    }
    try {
      const groupList = await GroupList.findOne({ userId });
      if (!groupList) {
        return { success: false, message: 'Group list not found for this user.' };
      }

      const groupIndex = groupList.groups.findIndex(g => g.groupId.toString() === groupId);
      if (groupIndex === -1) {
        return { success: false, message: 'Group not found in your list.' };
      }

      if (groupList.groups[groupIndex].isblocked) {
        return { success: false, message: 'Group is already blocked.' };
      }

      groupList.groups[groupIndex].isblocked = true;
      await groupList.save();
      await redisClient.del(`groups:${userId}`); // Invalidate cache
      return { success: true, message: 'Group blocked successfully.' };
    } catch (error) {
      console.error("Error in GroupService.blockGroup:", error);
      return { success: false, message: 'Failed to block group.' };
    }
  },
  unblockGroup: async (userId, groupId) => {
    if (!userId || !groupId) {
      return { success: false, message: 'User ID and Group ID are required.' };
    }
    try {
      const groupList = await GroupList.findOne({ userId });
      if (!groupList) {
        return { success: false, message: 'Group list not found for this user.' };
      }

      const groupIndex = groupList.groups.findIndex(g => g.groupId.toString() === groupId);
      if (groupIndex === -1) {
        return { success: false, message: 'Group not found in your list.' };
      }

      if (!groupList.groups[groupIndex].isblocked) {
        return { success: false, message: 'Group is not blocked.' };
      }

      groupList.groups[groupIndex].isblocked = false;
      await groupList.save();
      await redisClient.del(`groups:${userId}`); // Invalidate cache
      return { success: true, message: 'Group unblocked successfully.' };
    } catch (error) {
      console.error("Error in GroupService.unblockGroup:", error);
      return { success: false, message: 'Failed to unblock group.' };
    }
  },
};

export const handleBlockGroup = async (req, res) => {
  const userId = extractAuthenticatedUserId(req);
  const { groupId } = req.body;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized. Please log in.' });
  }
  if (!groupId) {
    return res.status(400).json({ status: false, message: 'Group ID is required.' });
  }

  const serviceResponse = await GroupService.blockGroup(userId, groupId);

  if (serviceResponse.success) {
    return res.status(200).json({ status: true, message: serviceResponse.message });
  }
  return res.status(400).json({ status: false, message: serviceResponse.message });
};

export const handleUnblockGroup = async (req, res) => {
  const userId = extractAuthenticatedUserId(req);
  const { groupId } = req.body;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized. Please log in.' });
  }
  if (!groupId) {
    return res.status(400).json({ status: false, message: 'Group ID is required.' });
  }

  const serviceResponse = await GroupService.unblockGroup(userId, groupId);

  if (serviceResponse.success) {
    return res.status(200).json({ status: true, message: serviceResponse.message });
  }
  return res.status(400).json({ status: false, message: serviceResponse.message });
};
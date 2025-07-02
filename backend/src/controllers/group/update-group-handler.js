import { redisClient } from "../../config/redis.js";
import Group from "../../models/group-model.js";
import GroupList from "../../models/groupList-model.js";
import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import mongoose from "mongoose";

// Utility to check if ObjectId is valid
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// 🔹 1. Promote New Admin (and transfer title)
export const promoteAdmin = async (req, res) => {
  try {
    const { groupId, newAdminId } = req.body;
    const userId = extractAuthenticatedUserId(req) // Assuming you’re using auth middleware

    if (!isValidId(groupId) || !isValidId(newAdminId)) {
      return res.status(400).json({ status: false, message: "Invalid IDs" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ status: false, message: "Group not found" });

    // Check if current user is admin
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ status: false, message: "Only admin can promote another admin" });
    }

    const isMember = group.members.some((m) => m.userId.toString() === newAdminId);
    if (!isMember) return res.status(400).json({ status: false, message: "User must be a member to become admin" });

    group.admin = newAdminId;
    group.members = group.members.map((m) => ({
      ...m.toObject(),
      isAdmin: m.userId.toString() === newAdminId,
    }));

    await group.save();
    return res.json({ status: true, message: "Admin updated", group });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 🔹 2. Add Member
export const addMember = async (req, res) => {
  try {
    const { groupId, email } = req.body;
    const userId = extractAuthenticatedUserId(req)
    const  user=await User.findOne({email})
    const userIdToAdd = user?._id;
    if (!userIdToAdd) return res.status(404).json({ status: false, message: "Please enter valid email Id" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ status: false, message: "Group not found" });

    const isAdmin = group.admin.toString() === userId.toString();
    if (!isAdmin) return res.status(403).json({ status: false, message: "Only admin can add members" });

    const alreadyMember = group.members.some((m) => m.userId.toString() === userIdToAdd.toString());
    if (alreadyMember) return res.status(400).json({ status: false, message: "User is already a member" });

    group.members.push({ userId: userIdToAdd });
    
    await group.save();
    await GroupList.findOneAndUpdate(
      { userId: userIdToAdd },
      { $addToSet: { groups: { groupId: groupId, isblocked: false } } },
      { new: true, upsert: true }

      );
      // clear user and meber redis cache 
      await redisClient.del(`groups:${userId}`);
      await redisClient.del(`groups:${userIdToAdd}`);

    return res.json({ status: true, message: "Member added", avatar: user.avatar.isHidden ? user.avatar.url : '/assets/images/user.png' , name: user.name, _id: user._id });  
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 🔹 3. Remove Member
export const removeMember = async (req, res) => {
  try {
    const { groupId, userIdToRemove } = req.body;
    const userId = extractAuthenticatedUserId(req)

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ status: false, message: "Group not found" });

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ status: false, message: "Only admin can remove members" });
    }

    if (userIdToRemove === group.admin.toString()) {
      return res.status(400).json({ status: false, message: "Admin cannot remove themselves" });
    }

    group.members = group.members.filter((m) => m.userId.toString() !== userIdToRemove);
    await group.save();
    // Remove group from user's group list
    await GroupList.updateOne(
      { userId: userIdToRemove },
      { $pull: { groups: { groupId } } }
    );
    const grouplist = await redisClient.get(`groups:${userIdToRemove}`);
    if (grouplist) {
      await redisClient.del(`groups:${userIdToRemove}`);
    }
    // Optionally, you can also remove the user from the GroupList of the admin

    return res.json({ status: true, message: "Member removed", _id: userIdToRemove });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 🔹 4. Leave Group
export const leaveGroup = async (req, res) => {
  try {
    const userId = extractAuthenticatedUserId(req)
    const { groupId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ status: false, message: "Group not found" });

    // If user is admin, prevent leaving unless new admin is assigned
    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ status: false, message: "Choose a new admin before leaving" });
    }
    console.log( "ja", userId);
    
    const initialLength = group.members.length;
    const latestMember = group.members.filter((m) => m.userId.toString() !== userId.toString());
    if (latestMember.length === initialLength) {
      return res.status(400).json({ status: false, message: "You are not a member of this group" });
    }
    group.members = latestMember;
    await group.save();
    // Remove group from user's group list
    await GroupList.updateOne(
      { userId },
      { $pull: { groups: { groupId } } }
    );
    
    const grouplist = await redisClient.get(`groups:${userId}`);
    if (grouplist) {
      await redisClient.del(`groups:${userId}`);
    }
    return res.json({ status: true, message: "You left the group", group });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// 🔹 5. Update Group Info (Only Admin)
export const updateGroupInfo = async (req, res) => {
  try {
    const { groupId, name, description } = req.body;
    const userId = extractAuthenticatedUserId(req)

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ status: false, message: "Group not found" });

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ status: false, message: "Only admin can update group info" });
    }

    if (name) group.groupName = name;
    if (description) group.description = description;

    await group.save();
   // remove from redis cache
    const grouplist = await redisClient.get(`groups:${userId}`);
    if (grouplist) {
      await redisClient.del(`groups:${userId}`);
    }

    return res.json({ status: true, message: "Group updated", group });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

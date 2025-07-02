import mongoose from "mongoose";
import { redisClient } from "../../config/redis.js";
import conversationModel from "../../models/conversation-model.js";
import Group from "../../models/group-model.js";
import GroupList from "../../models/groupList-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

export const createGroup = async (req, res) => {
  try {
    const { groupName, description, members,groupKey } = req.body;
    const userId = extractAuthenticatedUserId(req);

    if (!groupName || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ 
        status: false,
        message: "Invalid group data." 
      });
    }

    // Validate each member
    const invalidMembers = members.filter(m => 
      !m.userId || !m.encryptedKey || !m.iv
    );
    
    if (invalidMembers.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Each member must include userId, encryptedKey, and iv."
      });
    }

    // Ensure creator is included
    const creatorIsMember = members.some(m => m.userId === userId);
    if (!creatorIsMember) {
      return res.status(400).json({
        status: false,
        message: "Creator must be included in members."
      });
    }

    // Process members
    const processedMembers = members.map(member => ({
      userId: member.userId,
      encryptedKey: member.encryptedKey,
      iv: member.iv,
      isAdmin: member.userId === userId,
    }));

    // Create group
    const newGroup = await Group.create({
      groupName,
      description: description || "",
      picture: "/assets/images/group.png",
      createdBy: userId,
      admin: userId,
      members: processedMembers,
            key:groupKey

    });

    // Create conversation
    const conversation = await conversationModel.create({
      type: "group",
      participants: processedMembers.map(member => ({
        userId: member.userId,
        joinedAt: new Date(),
        unreadCount: 0,
        unreadMessages: []
      })),
      groupId: newGroup._id,
      lastMessage: null
    });

    // Link conversation to group
    newGroup.chatId = conversation._id;
    const updatedGroup = await newGroup.save();

    // Update GroupList for each member
    const memberIds = processedMembers.map(m => m.userId);
    await GroupList.updateMany(
      { userId: { $in: memberIds } },
      { $push: { groups: { groupId: newGroup._id } } },
      { upsert: true }
    );

    // Clear cache
    await Promise.all(
      memberIds.map(id => redisClient.del(`groups:${id}`))
    );

    return res.status(201).json({
      status: true,
      message: "Group created successfully",
      data: updatedGroup
    });

  } catch (err) {
    console.error("Group creation error:", err);
    return res.status(500).json({
      status: false,
      message: "Server error during group creation",
      error: err.message
    });
  }
};
import { defineScript } from "redis";
import Friend from "../../models/friendList-model.js";
import Group from "../../models/group-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

const getGroupInfo = async (req, res) => {
  try {
    const userId = extractAuthenticatedUserId(req);
    const { groupID } = req.body;
    
    // Find friend list of the current user
    const friendListDoc = await Friend.findOne({ userId });
    if (!friendListDoc) {
      return res.status(404).json({ status: false, message: "Friend list not found" });
    }

    // Get group with members populated
    const group = await Group.findById(groupID).populate("members.userId", "name email avatar");
    if (!group) {
      return res.status(404).json({ status: false, message: "Group not found" });
    }

    // Check if current user is group admin
    const isAdmin = group.admin.toString() === userId;

    // Extract friend IDs from user's friend list
    const friendIds = friendListDoc.friends.map(friend => friend.friendId .toString());

    console.log(friendIds);
    
    // Map members to include friendship info
    const membersInfo = group.members.map(member => {
      const memberId = member.userId._id.toString();
      return {
        _id: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
        avatar: member.userId.avatar.isHidden ?  "/assets/images/user.png" : member.userId.avatar.url,
        isAdmin: member.isAdmin,
        joinedAt: member.joinedAt,
        isFriend: friendIds.includes(memberId),
      };
    });

    return res.status(200).json({
      status: true,
      message: "Group info fetched successfully",
      group: {
        userId,
        _id: group._id,
        name: group.groupName,
        avatar: group.picture ? group.picture : "",
        description: group.description,
        createdBy: group.createdBy,
        admin: group.admin,
        members: membersInfo,
        isAdmin,
        totalMembers: group.members.length,
        
      }
    });

  } catch (error) {
    console.error("Error in getGroupInfo:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

export default getGroupInfo;

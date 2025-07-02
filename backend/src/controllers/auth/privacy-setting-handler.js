import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

export const updatePrivacySettings = async (req, res) => {
    try {
        const userId = extractAuthenticatedUserId(req);
        const { settingType, value } = req.body;

        // Validate input
        if (!settingType || typeof value !== 'boolean') {
            return res.status(400).json({
                status: false,
                message: 'Invalid request parameters'
            });
        }

        // Map frontend setting names to actual schema fields
        const settingMap = {
            'showOnlineStatus': 'showOnlineStatus',
            'showlastSeen': 'lastSeen.enabled',
            'showProfilePic': 'avatar.isHidden' // Note: isHidden is inverse of showProfilePic
        };

        // Check if settingType is valid
        if (!Object.keys(settingMap).includes(settingType)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid setting type'
            });
        }

        // Prepare update object
        const update = {};
        const schemaField = settingMap[settingType];
        
        // Handle inverse logic for profile picture
        if (settingType === 'showProfilePic') {
            update[schemaField] = !value; // If showProfilePic=true, then isHidden=false
        } else {
            update[schemaField] = value;
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: update },
            { new: true, runValidators: true }
        ).select('showOnlineStatus lastSeen.enabled avatar.isHidden');

        if (!updatedUser) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }

        // Prepare response that matches frontend expectations
        const responseData = {
            showOnlineStatus: updatedUser.showOnlineStatus,
            showlastSeen: updatedUser.lastSeen.enabled,
            showProfilePic: !updatedUser.avatar.isHidden // Convert back to showProfilePic
        };

        res.json({
            status: true,
            message: 'Privacy setting updated successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to update privacy settings',
            error: error.message
        });
    }
};
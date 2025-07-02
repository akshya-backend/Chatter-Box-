import User from '../../models/user-model.js';
import { extractAuthenticatedUserId } from '../../utils/helper/JsonWebToken-handler.js';
import logger from '../../utils/logger/winston-logger.js';

export const updateProfileInfo = async (req, res) => {
    console.log("Updating profile info in user-routes.js controller: ", req.body);
    
    try {
        const userId =extractAuthenticatedUserId(req)
        const { name, gender, dob, bio } = req.body
        logger.info(`Updating profile for user: ${userId}`);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access" });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                 
              name,
              gender,
              dob,
              bio
                
            },
            { new: true, }
        );
        

        if (!updatedUser) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        res.status(200).json({
            status: true,
            message: "Profile updated successfully",
          
        });

    } catch (error) {
      console.log(error);
      
        console.error('Error updating profile:', error);
        res.status(500).json({ status: false, message: "An error occurred while updating profile" });
    }
};
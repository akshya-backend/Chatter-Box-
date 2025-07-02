import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";

const getProfileInfo = async (req, res) => {
  
  try {
    const userId = extractAuthenticatedUserId(req);
   
    // Fetch from MongoDB if not found in Redis
    const user = await User.findById(userId).select( "-privateKey  -appLock.pin ");
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
  
    // Convert Mongoose object to plain JSON
    const profileData = {
      personal:{
        name: user.name,
        email: user.email,
        bio: user.bio,
        dob: user.dob,
        avatar: user.avatar.url,
        gender: user.gender || "Not specified",
      },
      security: {
        appLock: user.appLock.enabled,
        loginAlert:user.loginAlert,
      
      },
      privacy: {
         showlastSeen: user.lastSeen.enabled,
         showProfilePic:user.avatar.isHidden,
         showOnlineStatus:user.showOnlineStatus,

      },
    };
 
    return res.status(200).json({
      status: true,
      data: profileData,
    });
  } catch (error) {
    console.log(error);
    
    console.log("Error fetching profile info:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

export default getProfileInfo;
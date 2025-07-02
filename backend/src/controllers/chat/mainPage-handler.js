import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import logger from "../../utils/logger/winston-logger.js";

const IndexController = async (req, res) => {
  try {
    // Extract token from cookie
    const token = extractAuthenticatedUserId(req);
    if (!token) {
      logger.warn("No token provided");
      return res.redirect("/");
    }

    // Fetch user details with populated fields
    const user = await User.findById(token).select("name email avatar");

    if (!user) {
      logger.warn("User not found for token: " + token);
      return res.redirect("/");
    }
   
    // Render response with updated user data
    res.render("chat-Page", {
      user: { ...user.toObject() },
      isChatting: false,
      isVideoCall: false,
      isfriend: false,
    });
  } catch (error) {
    console.error(error);
    logger.error("Error in IndexController:", error);
    res.redirect("/");
  }
};

export default IndexController;

import bcrypt from "bcryptjs";
import User from "../../models/user-model.js";
import { clearJwtCookie, extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import logger from "../../utils/logger/winston-logger.js";

const isAppLocked = async (req, res, next) => {
  try {
    const userId = extractAuthenticatedUserId(req);
    if (!userId) {
      clearJwtCookie(req, res);
      return res.status(401).render("error-page", {
        errorCode: 401,
        errorMessage: "Unauthorized",
        errorDescription: "Invalid session. Please log in again.",
      });
    }

    const user = await User.findById(userId).select("avatar name appLock");
    if (!user) {
      clearJwtCookie(req, res);
      return res.status(404).render("error-page", {
        errorCode: 404,
        errorMessage: "User Not Found",
        errorDescription: "The requested user does not exist.",
      });
    }

    if (!user.appLock.enabled) {
      
      req.session.verified = true;
      return res.redirect("/api/v1/chat/index");
    }

    return res.render("pin-Page", {
      pic: user.avatar?.url || "",
      name: user.name,
    });
  } catch (error) {
    logger.error(`App Lock Verification Error: ${error.message}`);
    return res.status(500).render("error-page", {
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An error occurred while verifying access.",
    });
  }
};

const passwordVerification = async (req, res) => {
  try {
    const pin = String(req.body.pin).trim();
    const userId = extractAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access" });
    }

    const user = await User.findById(userId).select("name appLock.pin");
    
    if (!user) {
      res.clearCookie("chatterbox");
      return res.status(404).json({ status: false, message: "User not found" });
    }


    const isMatch = await  bcrypt.compare(pin, user.appLock.pin);
    if (!isMatch) {
      return res.status(400).json({ status: false, message: "Incorrect PIN" });
    }

    req.session.verified = true;
    return res.json({ status: true, message: `Welcome back, ${user.name}` });
  } catch (error) {
    console.error("Password Verification Error:", error.message);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

export { isAppLocked, passwordVerification, };

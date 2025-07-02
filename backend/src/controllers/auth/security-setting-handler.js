import bcrypt from "bcryptjs";
import User from "../../models/user-model.js";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import logger from "../../utils/logger/winston-logger.js";
import { redisClient } from "../../config/redis.js";
import emailQueue from "../../services/email/node-mailer.js";
import crypto from "crypto";

const requestPinChange = async (req, res) => {
  try {
    const userId = extractAuthenticatedUserId(req);
    const user = await User.findById(userId).select("email");
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    await redisClient.set(`pin-change-otp:${user.email}`, otp, "EX", 600);
    await emailQueue.add({ email: user.email, otp, isNew: false });

    return res.status(200).json({ status: true, message: "OTP sent successfully" });
  } catch (error) {
    logger.error(`Failed to send OTP: ${error.message}`);
    return res.status(500).json({ status: false, message: "Failed to send OTP" });
  }
};

const verifyOtpAndGenerateToken = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId= extractAuthenticatedUserId(req);

    const info= await User.findById(userId).select("email");
    const email = info.email;
    if (!email) return res.status(400).json({ status: false, message: "Invalid email" });
    const storedOtp = await redisClient.get(`pin-change-otp:${email}`);
    if (!storedOtp || storedOtp !== otp) return res.status(400).json({ status: false, message: "Invalid OTP" });

    await redisClient.del(`pin-change-otp:${email}`);
    const token = crypto.randomBytes(32).toString("hex");
    await redisClient.set(`pin-change-token:${token}`, email, "EX", 300);

    return res.status(200).json({ status: true, token });
  } catch (error) {
    logger.error(`Failed to verify OTP: ${error.message}`);
    return res.status(500).json({ status: false, message: "Verification failed" });
  }
};

const changePin = async (req, res) => {
  try {
    const {  newPin } = req.body;
    const userId = extractAuthenticatedUserId(req);
    const user = await User.findById(userId).select("email");
    user.appLock.pin = newPin
    await user.save();
    return res.status(200).json({ status: true, message: "PIN changed successfully" });
  } catch (error) {
    logger.error(`Failed to change PIN: ${error.message}`);
    return res.status(500).json({ status: false, message: "PIN change failed" });
  }
};


 const updatePin=async(req,res)=>{
  try {
     const userId = extractAuthenticatedUserId(req); // Get user ID from params
    const { currentPin, newPin } = req.body; 
    // Validate input
    if (!currentPin ||!newPin) {
      return res.status(400).json({ status: false, message: "Current PIN and new PIN are required." });
    }
    // Find user by ID
    const user = await User.findById(userId).select("appLock ");
    if (!user.appLock.enabled) {
      return res.status(404).json({ status: false, message: "User Not enabled the App Lock" });
    }
    // Validate current PIN
    const isMatch = await bcrypt.compare(currentPin, user.appLock.pin);
    if (!isMatch) {
      return res.status(400).json({ status: false, message: "Current PIN is incorrect." });
    }
    // Hash new PIN
    // Update user's PIN
    user.appLock.pin = newPin;
    await user.save();
    return res.status(200).json({ status: true, message: "PIN updated successfully." });

  } catch (error) {
    
  }
 }
// Enable or Disable App Lock
const toggleAppLockStatus = async (req, res) => {
  try {
    const  userId  = extractAuthenticatedUserId(req); // Get user ID from params
    const { pin, enable } = req.body; // Get PIN and enable flag from request body
    
    if (enable && (!pin || pin.length < 4)) {
      return res.status(400).json({  status:false,message: "PIN must be at least 4 digits." });
    }

    // Find user by ID
    const user = await User.findById(userId).select("appLock");
    if (!user) {
      return res.status(404).json({  status:false,message: "User not found." });
    }

    if (enable) {
     
      user.appLock.enabled = true;
      user.appLock.pin = pin;
      user.appLock.failedAttempts = 0;
      user.appLock.blockedUntil = null;
      await user.save();
      const redisKey = `profile-info:${userId}`;
     const cachedProfile = await redisClient.get(redisKey);
      if (cachedProfile) await redisClient.del(redisKey);
      return res.status(200).json({ status:true,message: "App lock enabled successfully." });
    } else {
      // Disable App Lock (PIN Confirmation Required)
      if (!pin) {
        return res.status(400).json({ status:false,message: "PIN is required to disable app lock." });
      }

      const isMatch = await bcrypt.compare(pin, user.appLock.pin);
      if (!isMatch) {
        return res.status(400).json({  status:false,message: "Incorrect PIN. Cannot disable app lock." });
      }

      user.appLock.enabled = false;
      user.appLock.pin = '';
      user.appLock.failedAttempts = 0;
      user.appLock.blockedUntil = null;
      await user.save();
       const redisKey = `profile-info:${userId}`;
     const cachedProfile = await redisClient.get(redisKey);
      if (cachedProfile) await redisClient.del(redisKey);
      return res.status(200).json({  status:true,message: "App lock disabled successfully." });
    }
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ status:false, message: "Server error", error: error.message });
  }
};

const verifyAppLockRequest = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = extractAuthenticatedUserId(req);
    
    const user = await User.findById(userId).select("appLock");
    
    if (!user.appLock.enabled) {
      return res.status(400).json({ 
        status: false, 
        message: "AppLock is not enabled" 
      });
    }

    const isMatch = await bcrypt.compare(pin, user.appLock.pin);
    if (!isMatch) {
      return res.status(401).json({  
        status: false,
        message: "Incorrect PIN" 
      });
    }

    return res.status(200).json({
      status: true,
      message: "App Lock verification successful"
    });
  } catch (error) {
    logger.error(`Failed to verify App Lock: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred during App Lock verification",
    });
  }
};

const changeAppLockPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = extractAuthenticatedUserId(req);
    
    const user = await User.findById(userId).select("appLock");
    
    if (!user.appLock.enabled) {
      return res.status(400).json({ 
        status: false, 
        message: "Cannot change PIN - AppLock is not enabled" 
      });
    }

    // Consider hashing the new pin before saving
    const hashedPin = await bcrypt.hash(pin, 10);
    user.appLock.pin = hashedPin;
    
    await user.save();
    
    return res.status(200).json({
      status: true,
      message: "App Lock PIN changed successfully"
    });
  } catch (error) {
    logger.error(`Failed to change App Lock PIN: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while changing App Lock PIN",
    });
  }
};


const  isAlreadySetAppLock=async (req,res) => {

  try {
    const userId = extractAuthenticatedUserId(req);
    const user = await User.findById(userId).select("appLock");
    if(!user.appLock.enabled && user.appLock.pin.length > 0  ){
       user.appLock.enabled = true;
        await user.save();
       return res.status(200).json({ status: true})
      }
    return res.status(200).json({ status: false});
  } catch (error) {
    logger.error(`Failed to check App Lock status: ${error.message}`);
    return res.status(500).json({ status: false, message: "An error occurred while checking App Lock status" });
  }
};


const disableAppLock = async (req, res) => {
  try {
    const userId = extractAuthenticatedUserId(req);
    const user = await User.findById(userId).select("appLock");
    if(!user.appLock.enabled) return res.status(400).json({ status: false, message: "App Lock is already disabled" });
    user.appLock.enabled = false;
    await user.save();
    return res.status(200).json({ status: true, message: "App Lock disabled successfully" });
  } catch (error) {
    logger.error(`Failed to disable App Lock: ${error.message}`);
    return res.status(500).json({ status: false, message: "An error occurred while disabling App Lock" });
  }
};


const setNewApplock=async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = extractAuthenticatedUserId(req);
    const user = await User.findById(userId).select("appLock");
    if(user.appLock.enabled) return res.status(400).json({ status: false, message: "App Lock is already enabled" });
    user.appLock.enabled = true;
    user.appLock.pin = pin
    await user.save();
    return res.status(200).json({ status: true, message: "App Lock enabled successfully" });
  } catch (error) {
    logger.error(`Failed to enable App Lock: ${error.message}`);
    return res.status(500).json({ status: false, message: "An error occurred while enabling App Lock" });
  }
};

const setLoginAlert= async (req,res)=>{
  try {
    const userId = extractAuthenticatedUserId(req);
    const {enabled } = req.body;
    const user = await User.findByIdAndUpdate(userId, { loginAlert: enabled }, { new: true });
    return res.status(200).json({ status: true, message: "Login alert type updated successfully" });
  } catch (error) {
    logger.error(`Failed to update login alert type: ${error.message}`);
    return res.status(500).json({ status: false, message: "An error occurred while updating login alert type" });
  }
}
 const logoutUser = async (req, res) => {
  try {
    res.clearCookie('chatterbox');
    req.session.destroy();

    return res.status(200).json({ status: true, message: "User logged out successfully" });
  } catch (error) {
    logger.error(`Failed to logout user: ${error.message}`);
    return res.status(500).json({ status: false, message: "An error occurred while logging out user" });
  }
};

export { requestPinChange, 
   verifyOtpAndGenerateToken,
   changePin,
   toggleAppLockStatus,
   verifyAppLockRequest,
   changeAppLockPin,
   isAlreadySetAppLock ,
   disableAppLock ,
   setNewApplock,
   setLoginAlert,
   updatePin,
   logoutUser 
};

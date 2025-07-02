import { redisClient } from "../../config/redis.js";
import Friend from "../../models/friendList-model.js";
import GroupList from "../../models/groupList-model.js";
import User from "../../models/user-model.js";
import emailQueue from "../../services/email/node-mailer.js";
import { generateAuthTokenAndSetCookie } from "../../utils/helper/JsonWebToken-handler.js";
import logger from "../../utils/logger/winston-logger.js";


const sendVerificationOTP= async (req, res) => {
  try {
    const { email } = req.body;

   if (!email) res.status(400).json({ status: false, message: 'Email is required' });
      // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpData = JSON.stringify({ otp, timestamp: Date.now() });
  
    // Store OTP in Redis with a 10-minute expiration
    await redisClient.set(email, otpData, 'EX', 600);
    console.log('OTP:', otp);
    
    await emailQueue.add({ email, otp, isNew: true });
   console.log('OTP stored in Redis');
   
    logger.info(`OTP email sent successfully to: ${email}`);
    return res.status(200).json({
      status: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.log(error);
    
    logger.error(`Failed to send OTP: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      status: false,
      message: 'Failed to send OTP. Please try again later.',
    });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    logger.warn("Email or OTP missing in request");
    return res.status(400).json({ status: false, message: "Invalid request" });
  }

  try {
    // Retrieve OTP from Redis
    const otpData = await redisClient.get(email);
    if (!otpData) {
      logger.warn(`OTP not found or expired for email: ${email}`);
      return res.status(400).json({ status: false, message: "OTP expired or invalid" });
    }

    const { otp: storedOtp, timestamp } = JSON.parse(otpData);

    // Check if OTP is expired
    if (isOTPExpired(timestamp)) {
      await redisClient.del(email); // Cleanup expired OTP
      logger.warn(`OTP expired for email: ${email}`);
      return res.status(400).json({ status: false, message: "OTP expired" });
    }

    // Check if OTP is correct
    if (!isOTPCorrect(storedOtp, otp)) {
      logger.warn(`Incorrect OTP entered for email: ${email}`);
      return res.status(400).json({ status: false, message: "Incorrect OTP" });
    }

    // Check if user exists, otherwise create a new one
    let user = await User.findOne({ email }) || await createNewUser(email, req);

    // Generate auth token and set cookie
    generateAuthTokenAndSetCookie(req, res, user._id);

    logger.info(`OTP verified successfully for email: ${email}`);
    return res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      isUser: true,
      email,
      keys:{
        publicKey: user.publicKey,
        privateKey: user.privateKey
      }
    });

  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`, { error });
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};



// Helper function to create a new user
const createNewUser = async (email, req) => {
   const {pub64, priv64}= await generateECDHKeyPair()

  const newUser = new User({
    email,  
    publicKey: pub64,
    privateKey: priv64,  
  });

    const res= await newUser.save();
    const newfriendId = new Friend({
      userId: newUser._id,
      friends: [],
      friendRequests: [],
    })
    const newgroupId = new GroupList({
      userId: newUser._id,
      groups:[]
    })

    await newgroupId.save();
    await newfriendId.save();
    return res;
};




// Helper function to check if OTP is expired
const isOTPExpired = (timestamp) => {
  const isExpired = Date.now() - timestamp > 600000; // 10 min expiration
  return isExpired;
};

// Helper function to check if OTP is correct
const isOTPCorrect = (storedOtp, enteredOtp) => {
  return parseInt(enteredOtp) === storedOtp;
};

import { generateKeyPair } from 'crypto';
import { promisify } from 'util';

const generateKeyPairAsync = promisify(generateKeyPair);

export async function generateECDHKeyPair() {
  const { publicKey, privateKey } = await generateKeyPairAsync('ec', {
    namedCurve: 'prime256v1', // Same as "P-256"
    publicKeyEncoding: {
      type: 'spki', // same as browser
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8', // same as browser
      format: 'der',
    },
  });

  const pub64 = publicKey.toString('base64');
  const priv64 = privateKey.toString('base64');

  return { pub64, priv64 };
}

export {
  sendVerificationOTP,
  verifyOTP
};

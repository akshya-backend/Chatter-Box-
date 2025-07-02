import { OAuth2Client } from "google-auth-library";
import User from "../../models/user-model.js";
import { generateAuthTokenAndSetCookie } from "../../utils/helper/JsonWebToken-handler.js";
import cloudinaryUpload from "../../config/cloudinary.js";
import { customError } from "../../middlewares/Global-error-handler.js";
import Friend from "../../models/friendList-model.js";
import GroupList from "../../models/groupList-model.js";
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
// Initialize OAuth2Client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

// Initialize Google Auth
const initializeGoogleAuth = async (req, res, next) => {
  try {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"], 
      prompt: "consent", 
    });    
    
    return res.redirect(authUrl);
  } catch (error) {
    
    return next(
      customError(
        "Failed to initialize Google authentication",
        500,
        "An error occurred while generating the Google authentication URL."
      )
    );
  }
};

// Handle Google Callback
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return next(
        customError(
          "Authorization Code Missing",
          400,
          "The authorization code is required to complete the authentication process."
        )
      );
    }

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Verify ID token
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Check if user already exists
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Upload profile picture to Cloudinary if available
      const profilePictureUrl = payload.picture
        ? await cloudinaryUpload(payload.picture)
        : '/assets/images/user.png';
  const {pub64,priv64}= await generateECDHKeyPair()
      // Create new user
      user = await User.create({
        email: payload.email,
        name: payload.name,
        avatar: { url: profilePictureUrl },
        publicKey: pub64,
        privateKey: priv64,
      });
    
    const newfriendId = new Friend({
      userId: user._id,
      friends: [],
      friendRequests: [],
    })
    const newgroupId = new GroupList({
      userId: user._id,
      groups:[]
    })
    await newgroupId.save();
    await newfriendId.save();
  }
    // Generate auth token and set cookie
    generateAuthTokenAndSetCookie(req, res, user._id);
    if(user.appLock.enabled) {
      return res.redirect("/")
    }else{
    return res.redirect("/api/v1/chat/index");}
  } catch (error) {
    console.log(error);
    
    return customError(
        "Google Authentication Failed",
        500,
        "An error occurred during the Google authentication process.",
        next
      )
  
  }
};



const generateKeyPairAsync = promisify(generateKeyPair);

export async function generateECDHKeyPair() {
  const { publicKey, privateKey } = await generateKeyPairAsync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  });

  const pub64 = publicKey.toString('base64');
  const priv64 = privateKey.toString('base64');

  return { pub64, priv64 };
}

export { initializeGoogleAuth, handleGoogleCallback };
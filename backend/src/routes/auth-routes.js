 import { Router } from "express";
import { preventAccessToSignup } from "../middlewares/Session-middleware.js";
import { handleGoogleCallback, initializeGoogleAuth } from "../controllers/auth/google-Oauth-handler.js";
import {  changeAppLockPin, changePin, disableAppLock, isAlreadySetAppLock, requestPinChange, setLoginAlert, setNewApplock, toggleAppLockStatus, updatePin, verifyAppLockRequest, verifyOtpAndGenerateToken } from "../controllers/auth/security-setting-handler.js";
import { emailRateLimiter, resetPinLimiter } from "../middlewares/Rate-limiter-middleware.js";
import { passwordVerification, } from "../controllers/auth/access-control-handler.js";
import validateBody from "../middlewares/Joi-bodyValidator.js";
import { sendVerificationOTP, verifyOTP } from "../controllers/auth/email-authentication-handler.js";
import { updatePrivacySettings } from "../controllers/auth/privacy-setting-handler.js";
import { EncryptionKeys } from "../controllers/auth/set-EncryptionKey.js";



// Initialize router
const router = Router();
// new -user 
router.get("/sign-new-user",preventAccessToSignup,(req,res)=>{res.render("signup-Page")})
router.get("/google-authentication", preventAccessToSignup,initializeGoogleAuth)
router.get("/google/callback",preventAccessToSignup,handleGoogleCallback)
router.post("/email-authentication",validateBody,emailRateLimiter,sendVerificationOTP);
router.post("/email-otp-verification",validateBody,verifyOTP);
router.get("/check-app-lock",isAlreadySetAppLock);
router.post("/set-app-lock",setNewApplock);
router.get("/disable-app-lock", disableAppLock);
router.post('/privacy-settings', updatePrivacySettings);
router.post("/set-login-alerts",setLoginAlert);
router.post("/verify-app-lock",passwordVerification);
router.post("/update-pin", updatePin);
router.post("/key",EncryptionKeys)
router.post("/set-encryption-keys",requestPinChange);
router.post("/forget-pin",requestPinChange);
router.post("/pin-otp-verification", verifyOtpAndGenerateToken);
router.post("/new-pin", changePin);
// router.post("/verify-app-lock-request",resetPinLimiter,verifyAppLockRequest);
// router.put("/change-app-lock-request",changeAppLockPin);
// router.post("/toggle-app-lock",toggleAppLockStatus)
// router.put("/update-last-seen", updateLastSeen);
// router.put("/update-profile-picture-visibility", updateProfilePicturePrivacy)


export default router;

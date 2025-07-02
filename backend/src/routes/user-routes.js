import { Router } from  "express"
import getProfileInfo from "../controllers/user/visit-profile-handler.js"
import { multerMiddleware, upload } from "../config/multer.js"
import changeProfileImage from "../controllers/user/profile-Image-handler.js"
import validateBody from "../middlewares/Joi-bodyValidator.js"
 import {updateProfileInfo} from '../controllers/user/profile-info-handler.js'
import { logoutUser } from "../controllers/auth/security-setting-handler.js"
import { sendFriendRequest } from "../controllers/friends/send-friend-request.js"
import { confirmFriendRequest, rejectFriendRequest } from "../controllers/friends/confirm-friendRequest.js"
import { blockFriend, removeFriend, unblockFriend } from "../controllers/friends/block-remove-friend.js"
const router=Router()

 router.route("/user-profile").get(getProfileInfo)
 router.route("/upload-profile-image").post(multerMiddleware,upload.single("profileImage"),changeProfileImage)
 router.route("/update-profile").put(validateBody,updateProfileInfo)
 router.route("/send-friend-request").post(sendFriendRequest)
 router.route("/accept-friend-request").post(confirmFriendRequest)
 router.route("/reject-friend-request").post(rejectFriendRequest)
 
 router.route("/friend/block").post(blockFriend)
router.route("/friend/unblock").post(unblockFriend)
router.route("/friend/removed/").post(removeFriend)
router.route("/logout").post(logoutUser)
// router.route("/user-info").get( clearSessionCache, getProfileInfo)







export default router

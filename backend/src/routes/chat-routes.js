import { Router } from  "express"
import IndexController from "../controllers/chat/mainPage-handler.js"
import { getFriendList } from "../controllers/friends/friend-list-handler.js"
import { getGroupList } from "../controllers/group/get-groupList-handler.js"
import { createGroup } from "../controllers/group/create-group.js"
import getGroupInfo from "../controllers/group/group-profile.js"
import { multerMiddleware, upload } from "../config/multer.js"
import changeGroupImage from "../controllers/group/update-group-avatar.js"
import { addMember, leaveGroup, promoteAdmin, removeMember, updateGroupInfo } from "../controllers/group/update-group-handler.js"
import recentChats from "../controllers/chat/recent-chats-handler.js"
import { paginateChatMessages } from "../controllers/chat/pagination-handler.js"
import { handleBlockGroup, handleUnblockGroup } from "../controllers/group/block-unblock-group.js"
import { messageDelete } from "../controllers/chat/message-delete.js"

const router=Router()



router.route("/index").get(IndexController)


router.route("/friend-list").get(getFriendList)
router.route("/group-list").get(getGroupList)
router.route("/create-group").post(createGroup)
router.route("/group-info").post(getGroupInfo)
router.route("/group-update-avatar").post(multerMiddleware,upload.single("picture"),changeGroupImage)
 router.route("/group-update").put(updateGroupInfo)
 router.route("/group-promote").put(promoteAdmin)
router.route("/group-remove-member").put(removeMember) 
router.route("/group-leave").post(leaveGroup)
router.route("/group-add-member").post(addMember)
router.route("/block-group").post(handleBlockGroup)
router.route("/unblock-group").post(handleUnblockGroup)
router.route("/recent-chats").get(recentChats)
router.route("/messages/:chatId").get(paginateChatMessages)
 router.route("/delete-message").delete(messageDelete)








export default router

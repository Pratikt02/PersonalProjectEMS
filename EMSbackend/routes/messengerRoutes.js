import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../utils/upload.js";
import {
  getMessengerUsers,
  getConversations,
  createPrivateConversation,
  createBroadcast,
  createGroup,
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  deleteConversation,
  addParticipant,
  removeParticipant,
  updateGroupProfileImage,
  addAdmin,
  removeAdmin,
  updateGroupName,
} from "../controllers/messengerController.js";

const router = express.Router();

router.use(protect);

router.get("/users", getMessengerUsers);
router.get("/conversations", getConversations);
router.post("/conversations/private", createPrivateConversation);
router.post("/conversations/broadcast", createBroadcast);
router.post("/conversations/group", createGroup);
router.post("/conversations/:conversationId/participants", addParticipant);
router.delete("/conversations/:conversationId/participants/:participantId", removeParticipant);
router.post("/conversations/:conversationId/profile-image", upload.single('profileImage'), updateGroupProfileImage);
router.post('/conversations/:conversationId/admins', addAdmin);
router.delete('/conversations/:conversationId/admins/:adminId', removeAdmin);
router.patch('/conversations/:conversationId', updateGroupName);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", upload.array('attachments', 5), sendMessage);
router.delete("/messages/:messageId", deleteMessage);
router.patch("/messages/:messageId", editMessage);
router.delete("/conversations/:conversationId", deleteConversation);

export default router;

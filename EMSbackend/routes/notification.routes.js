import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  createNotification,
  broadcastNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

/* ============================
   ✅ NOTIFICATION ROUTES
============================ */

// ✅ My notifications
router.get("/my", protect, getMyNotifications);

// ✅ Unread count
router.get("/unread-count", protect, getUnreadCount);

// ✅ Mark one read
router.put("/read/:id", protect, markAsRead);

// ✅ Mark all read
router.put("/read-all", protect, markAllAsRead);

// ✅ Delete one notification
router.delete("/:id", protect, deleteNotification);

// ✅ Create notification (single)
router.post("/create", protect, createNotification);

// ✅ Broadcast notification (all users)
router.post("/broadcast", protect, broadcastNotification);

export default router;

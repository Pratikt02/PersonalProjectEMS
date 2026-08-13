import express from "express";
import {
  loginUser,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  upload,
  getManagers
} from "../controllers/userController.js";

import protect, { authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", loginUser);
router.post("/register", upload.single("profileImage"), createUser);

// Protected routes
router.get("/", protect, getUsers);
router.get("/managers", protect, getManagers);
router.get("/:id", protect, getUserById);

// IMPORTANT: Fixed - Added upload middleware to the update route
router.put("/:id", protect, upload.single("profileImage"), updateUser);

router.delete("/:id", protect, deleteUser);

export default router;
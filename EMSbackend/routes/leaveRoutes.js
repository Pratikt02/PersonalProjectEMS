import express from "express";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const router = express.Router();

router.post("/", createLeave);
router.get("/", getLeaves);
router.patch("/:id", updateLeaveStatus);

export default router;
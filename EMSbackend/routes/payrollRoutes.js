import express from "express";
import protect, { authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAllPayroll,
  getMyPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  markAsPaid,
  deletePayroll,
} from "../controllers/payrollController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee — own pay slips
router.get("/my", getMyPayroll);

// Admin / HR — manage all payroll
router.get("/", authorizeRoles("admin", "hr"), getAllPayroll);
router.post("/", authorizeRoles("admin", "hr"), createPayroll);
router.get("/:id", getPayrollById);
router.put("/:id", authorizeRoles("admin", "hr"), updatePayroll);
router.patch("/:id/pay", authorizeRoles("admin", "hr"), markAsPaid);
router.delete("/:id", authorizeRoles("admin", "hr"), deletePayroll);

export default router;

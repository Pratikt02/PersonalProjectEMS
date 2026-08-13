import express from "express";
import { getDashboardStats, getAdminOverview } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/admin/overview
router.get("/admin/overview", getAdminOverview);

// GET /api/dashboard/:employeeId
router.get("/:employeeId", getDashboardStats);

export default router;

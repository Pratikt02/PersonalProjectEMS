import express from "express";
import protect, { authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadOnboardingDocs } from "../middleware/documentUpload.js";

import {
  upsertEmployeeDocuments,
  getEmployeeDocuments,
  verifyDocuments,
  listDocuments,
  getEmployeesMissingDocuments,
} from "../controllers/documentController.js";

const router = express.Router();

/* ✅ IMPORTANT: Static routes FIRST */

// ✅ Missing/Empty Documents Employees (Admin/HR)
router.get("/missing", protect, authorizeRoles("admin", "hr"), getEmployeesMissingDocuments);

// ✅ Admin/HR list (pending/verified/rejected)
router.get("/", protect, authorizeRoles("admin", "hr"), listDocuments);

// ✅ Verify / Reject (Admin/HR)
router.patch("/:employeeId/verify", protect, authorizeRoles("admin", "hr"), verifyDocuments);

// ✅ Employee/Admin Save Documents
router.post("/:employeeId", protect, uploadOnboardingDocs, upsertEmployeeDocuments);

// ✅ Get single employee Documents (KEEP LAST)
router.get("/:employeeId", protect, getEmployeeDocuments);

export default router;



import express from "express";
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from "../controllers/projectController.js";
import protect, { authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Projects CRUD
router.post("/", protect, authorizeRoles("admin", "manager"), createProject);
router.get("/", protect, getProjects);
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, authorizeRoles("admin", "manager"), updateProject);
router.delete("/:id", protect, authorizeRoles("admin", "manager"), deleteProject);

export default router;


















// import express from "express";
// import { createProject, getProjects, getProjectById, updateProject, deleteProject } from "../controllers/projectController.js";
// import protect, { authorizeRoles } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // Projects CRUD
// router.post("/", protect, authorizeRoles("admin", "manager"), createProject);
// router.get("/", protect, getProjects);
// router.get("/:id", protect, getProjectById);
// router.put("/:id", protect, authorizeRoles("admin", "manager"), updateProject);
// router.delete("/:id", protect, authorizeRoles("admin", "manager"), deleteProject);

// export default router;

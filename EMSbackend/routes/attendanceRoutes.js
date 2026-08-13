import express from "express";
import {
  createAttendance,      // POST /
  logoutAttendance,      // PUT /logout
  getAllAttendance,      // GET /
  getAttendanceByEmployee,// GET /employee/:id
  markAttendance,        // PUT /mark
  updateAttendance,      // PUT /:id
  deleteAttendance,      // DELETE /:id
} from "../controllers/attendanceController.js";

// Assuming you have an auth middleware to verify tokens
// import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// -----------------------------------------------------
// ATTENDANCE ROUTES
// -----------------------------------------------------

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Private (Admin/HR)
router.get("/", getAllAttendance); 

// @route   GET /api/attendance/employee/:employeeId
// @desc    Get attendance for a specific employee
// @access  Private
router.get("/employee/:employeeId", getAttendanceByEmployee);

// @route   POST /api/attendance
// @desc    Punch In (Create new record)
// @access  Private (Employee)
router.post("/", createAttendance);

// @route   PUT /api/attendance/logout
// @desc    Punch Out (Update record with out time)
// @access  Private (Employee)
router.put("/logout", logoutAttendance);

// @route   PUT /api/attendance/mark
// @desc    Manually mark attendance (e.g., Admin marking someone Absent or on Leave)
// @access  Private (Admin/HR)
router.put("/mark", markAttendance);

// @route   PUT /api/attendance/:id
// @desc    Update a specific record (Edit details)
// @access  Private (Admin/HR)
// NOTE: This route is placed last to avoid overriding specific routes like /logout or /mark
router.put("/:id", updateAttendance);

// @route   DELETE /api/attendance/:id
// @desc    Delete a specific record
// @access  Private (Admin/HR)
router.delete("/:id", deleteAttendance);

export default router;
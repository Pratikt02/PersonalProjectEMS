import Leave from "../models/Leave.js";

/* ==============================
   CREATE LEAVE
================================ */
export const createLeave = async (req, res) => {
  try {
    const {
      leave_id,
      employee_id,
      employee_name,
      type,
      from,
      to,
      reason,
    } = req.body;

    if (!leave_id || !employee_id || !employee_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* ✅ DATE VALIDATION */
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      return res.status(400).json({ message: "Leave cannot start in the past" });
    }

    if (toDate < fromDate) {
      return res.status(400).json({ message: "To date cannot be before From date" });
    }

    const leave = await Leave.create({
      leave_id,
      employee_id,
      employee_name,
      type,
      from,
      to,
      reason,
      status: "Pending",
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error("Create Leave Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   GET LEAVES
================================ */
export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   UPDATE STATUS
================================ */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};










// import Leave from "../models/Leave.js";

// // ==============================
// // CREATE LEAVE (EMPLOYEE / ADMIN)
// // ==============================
// export const createLeave = async (req, res) => {
//   try {
//     const {
//       employee_id,
//       employee_name,
//       type,
//       from,
//       to,
//       reason,
//     } = req.body;

//     // 🔴 REQUIRED VALIDATION
//     if (!employee_id || !employee_name) {
//       return res.status(400).json({
//         message: "employee_id and employee_name are required",
//       });
//     }

//     const leave = await Leave.create({
//       employee_id,
//       employee_name,
//       type,
//       from,
//       to,
//       reason,
//       status: "Pending", // 🔐 FORCE PENDING
//     });

//     res.status(201).json(leave);
//   } catch (error) {
//     console.error("Create Leave Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ==============================
// // GET LEAVES (ROLE-BASED)
// // ==============================
// export const getLeaves = async (req, res) => {
//   try {
//     const { role, employee_id } = req.query;

//     let query = {};

//     // 🔐 EMPLOYEE → ONLY OWN LEAVES
//     if (role === "employee") {
//       if (!employee_id) {
//         return res.status(400).json({
//           message: "employee_id is required for employee role",
//         });
//       }

//       query = { employee_id };
//     }

//     // 🔓 ADMIN / HR / MANAGER → ALL LEAVES (NO FILTER)

//     const leaves = await Leave.find(query).sort({ createdAt: -1 });
//     res.json(leaves);
//   } catch (error) {
//     console.error("Get Leaves Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ==============================
// // UPDATE STATUS (ADMIN / HR / MANAGER)
// // ==============================
// export const updateLeaveStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["Pending", "Approved", "Rejected"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status value" });
//     }

//     const updated = await Leave.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (error) {
//     console.error("Update Leave Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

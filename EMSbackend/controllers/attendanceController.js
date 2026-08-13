import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/* ================================
   ✅ Helper: Send Notification (DB + Socket)
================================ */
const sendNotification = async ({
  receiverIds,
  senderId,
  title,
  message,
  type = "attendance",
  priority = "normal",
  link = "/attendance",
}) => {
  const targets = Array.isArray(receiverIds) ? receiverIds : [receiverIds];

  targets.forEach(async (id) => {
    if (!id) return;
    try {
      const notif = await Notification.create({
        receiverId: id,
        senderId: senderId,
        title,
        message,
        type,
        priority,
        link,
      });


    } catch (err) {
      console.error("Notification Error:", err);
    }
  });
};

/* ================================
   TIME HELPERS (IST ONLY)
================================ */

const PRESENT_START_HOUR = 9;
const PRESENT_START_MINUTE = 30;

const LATE_START_HOUR = 11;
const LATE_START_MINUTE = 0;

const MANUAL_PUNCH_OUT_HOUR = 16;
const MANUAL_PUNCH_OUT_MINUTE = 30;

const AUTO_PUNCH_OUT_HOUR = 19;
const AUTO_PUNCH_OUT_MINUTE = 0;

// Current IST Date (YYYY-MM-DD)
const getISTDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// Current IST Time (hh:mm:ss AM/PM)
const getISTTime = () =>
  new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

// Convert "10:30:00 AM" → 24h hour number
const getHoursFromTime = (timeStr) => {
  if (!timeStr) return 25;
  const [time, period] = timeStr.split(" ");
  if (!time || !period) return 25;

  let [hours] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours;
};

// Convert time string → Date object (IST base)
const parseTimeToDate = (timeStr) => {
  const [time, period] = timeStr.split(" ");
  let [h, m, s] = time.split(":").map(Number);

  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return new Date(2000, 0, 1, h, m, s || 0);
};

const calculateWorkingMinutes = (punchIn, punchOut) => {
  if (!punchIn || !punchOut) return 0;
  const diffMs = parseTimeToDate(punchOut) - parseTimeToDate(punchIn);
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60));
};

// Calculate working hours safely
const calculateWorkingHours = (punchIn, punchOut) => {
  const totalMinutes = calculateWorkingMinutes(punchIn, punchOut);
  if (totalMinutes <= 0) return "0h";

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h}h ${m}m`;
};

/* ================================
   STATUS RULE ENGINE (STRICT)
================================ */

// Punch-in based status
const calculateStatusFromPunchIn = (punchIn) => {
  if (!punchIn) return "Absent";

  const [time, period] = punchIn.split(" ");
  let [hour, minute] = time.split(":").map(Number);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const totalMinutes = hour * 60 + minute;

  const presentStart =
    PRESENT_START_HOUR * 60 + PRESENT_START_MINUTE;

  const lateStart =
    LATE_START_HOUR * 60 + LATE_START_MINUTE;

  // Before 9:30 AM
  if (totalMinutes < presentStart) {
    return "Early Punch In";
  }

  // 9:30 AM to before 11:00 AM
  if (totalMinutes < lateStart) {
    return "Present";
  }

  // 11:00 AM onwards
  return "Late";
};

// Punch-out is allowed, but Present is counted only after 8 worked hours.
const applyPunchOutRule = (punchIn, punchOut, currentStatus) => {
  return currentStatus;
};

/* ================================
   PUNCH IN
================================ */
// POST /api/attendance
export const createAttendance = async (req, res) => {
  try {
    const { employeeId, name } = req.body;
    if (!employeeId || !name) {
      return res.status(400).json({ message: "employeeId & name required" });
    }

    const date = getISTDate();
    const punch_in = getISTTime();

    // Prevent double punch-in
    const existing = await Attendance.findOne({ employeeId, date });
    if (existing) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    const status = calculateStatusFromPunchIn(punch_in);

    const record = await Attendance.create({
      employeeId,
      name,
      date,
      punch_in,
      status,
    });

    try {
      const supervisorIds = [];
      if (req.user && req.user.reportingTo) {
        supervisorIds.push(req.user.reportingTo);
      } else {
        // Fallback: Notify admins if no direct supervisor
        const admins = await User.find({ role: "admin" }).select("_id");
        supervisorIds.push(...admins.map(a => a._id));
      }

      await sendNotification({
        receiverIds: supervisorIds,
        senderId: req.user ? req.user._id : null,
        title: "Punch In 🟢",
        message: `${name} has punched in at ${punch_in}.`,
        type: "attendance",
      });
    } catch (err) {
      console.error("Error notifying supervisor:", err);
    }

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   PUNCH OUT
================================ */
// PUT /api/attendance/logout
export const logoutAttendance = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const date = getISTDate();
    const punch_out = getISTTime();

    const [time, period] = punch_out.split(" ");
      let [hour, minute] = time.split(":").map(Number);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const currentMinutes = hour * 60 + minute;

      const manualPunchOutTime =
        MANUAL_PUNCH_OUT_HOUR * 60 + MANUAL_PUNCH_OUT_MINUTE;

      if (currentMinutes < manualPunchOutTime) {
        return res.status(400).json({
          message: "Manual punch out is allowed only after 4:30 PM.",
        });
      }

    const record = await Attendance.findOne({ employeeId, date });
    if (!record || record.punch_out) {
      return res.status(404).json({ message: "No active session found" });
    }

    const workingHours = calculateWorkingHours(record.punch_in, punch_out);
    const finalStatus = applyPunchOutRule(record.punch_in, punch_out, record.status);

    record.punch_out = punch_out;
    record.workingHours = workingHours;
    record.status = finalStatus;

    await record.save();

    try {
      const supervisorIds = [];
      if (req.user && req.user.reportingTo) {
        supervisorIds.push(req.user.reportingTo);
      } else {
        const admins = await User.find({ role: "admin" }).select("_id");
        supervisorIds.push(...admins.map(a => a._id));
      }

      await sendNotification({
        receiverIds: supervisorIds,
        senderId: req.user ? req.user._id : null,
        title: "Punch Out 🔴",
        message: `${record.name} has punched out at ${punch_out}. Duration: ${workingHours}`,
        type: "attendance",
      });
    } catch (err) {
      console.error("Error notifying supervisor:", err);
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   GET RECORDS
================================ */

export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAttendanceByEmployee = async (req, res) => {
  try {
    const records = await Attendance.find({
      employeeId: req.params.employeeId,
    }).sort({ date: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   ADMIN / HR MANUAL MARK
================================ */
// PUT /api/attendance/mark
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, name } = req.body;

    let record = await Attendance.findOne({ employeeId, date });

    if (!record) {
      record = new Attendance({ employeeId, name, date });
    }

    record.status = status;

    if (status === "Absent" || status === "Leave") {
      record.punch_in = null;
      record.punch_out = null;
      record.workingHours = null;
    }

    await record.save();

    try {
      // Find user Mongo ID from string employeeId
      const user = await User.findOne({ employeeId: employeeId });
      if (user) {
        await sendNotification({
          receiverIds: user._id,
          senderId: req.user._id,
          title: "Attendance Updated 📅",
          message: `Admin marked your attendance for ${date} as: ${status}.`,
          type: "attendance",
        });
      }
    } catch (err) {
      console.error("Error notifying user:", err);
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   ADMIN EDIT RECORD
================================ */
// PUT /api/attendance/:id
export const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    Object.assign(record, req.body);

    // Recalculate if times changed
    if (record.punch_in) {
      record.status = calculateStatusFromPunchIn(record.punch_in);
    }
    if (record.punch_in && record.punch_out) {
      record.workingHours = calculateWorkingHours(
        record.punch_in,
        record.punch_out
      );
      record.status = applyPunchOutRule(record.punch_in, record.punch_out, record.status);
    }

    await record.save();

    try {
      const user = await User.findOne({ employeeId: record.employeeId });
      if (user) {
        await sendNotification({
          receiverIds: user._id,
          senderId: req.user._id,
          title: "Attendance Record Modified ✏️",
          message: `Your attendance for ${record.date} has been updated.`,
          type: "attendance",
        });
      }
    } catch (err) {
      console.error("Error notifying user:", err);
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================================
   DELETE RECORD
================================ */
// DELETE /api/attendance/:id
export const deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    try {
      const admins = await User.find({ role: { $in: ["admin", "hr", "manager"] } }).select("_id");
      const adminIds = admins.map((a) => a._id).filter((id) => id.toString() !== req.user._id.toString());

      if (adminIds.length > 0) {
        await sendNotification({
          receiverIds: adminIds,
          senderId: req.user._id,
          title: "Attendance Record Deleted 🗑️",
          message: `Attendance for ${deleted.name} (${deleted.date}) was deleted.`,
          priority: "high",
          type: "attendance",
        });
      }
    } catch (err) {
      console.error("Error notifying admins:", err);
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ================================
   AUTO PUNCH-OUT CRON (Disabled)
================================ */
  export const autoPunchOutCron = async () => {
    try {
      const date = getISTDate();
      const punch_out = "07:00:00 PM";

      const records = await Attendance.find({
        date,
        punch_in: { $ne: null },
        punch_out: null,
      });

      for (const record of records) {
        const workingHours = calculateWorkingHours(
          record.punch_in,
          punch_out
        );

        record.punch_out = punch_out;
        record.workingHours = workingHours;
        record.autoPunchOut = true;
        record.status = "Auto Punch Out";

        await record.save();

        console.log(
          `Auto punch-out for ${record.name}: ${workingHours} - Status: Auto Punch Out`
        );
      }

      console.log(
        `Auto punch-out completed for ${records.length} users`
      );
    } catch (error) {
      console.error("Auto punch-out error:", error);
    }
  };

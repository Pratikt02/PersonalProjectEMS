import User from "../models/User.js";
import Task from "../models/Task.js";
import EmployeeDocuments from "../models/EmployeeDocuments.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Fetch real task data
    const tasks = await Task.find({ assignedTo: user._id })
      .populate("assignedTo", "name email")
      .populate("team", "team_name")
      .populate("createdBy", "name email");

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    const inProgressTasks = tasks.filter(task => task.status === "In Progress").length;
    const pendingTasks = totalTasks - (completedTasks + inProgressTasks);
    const performance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Fetch real document (KYC) status
    const docStatus = await EmployeeDocuments.findOne({ employeeId: user._id });
    
    // 3. Mocked Activities for now (could be from a log collection later)
    const activities = [
      { id: 1, activity: "Synchronized workspace profile", time: "Just now" },
      { id: 2, activity: `Updated status for ${totalTasks} tasks`, time: "2 hrs ago" },
      { id: 3, activity: "ERP Uplink Secured", time: "4 hrs ago" },
    ];

    res.status(200).json({
      employeeId: user.employeeId,
      role: user.role,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      performance,
      activities,
      kycStatus: docStatus ? docStatus.status : "unstarted",
      // Include tasks for frontend
      recentTasks: tasks.slice(0, 5).map(task => ({
        _id: task._id,
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        assignedTo: task.assignedTo,
        team: task.team,
        dueDate: task.dueDate,
        createdAt: task.createdAt
      }))
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getAdminOverview = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalTasks = await Task.countDocuments();
    
    // KYC Stats
    const kycApproved = await EmployeeDocuments.countDocuments({ status: "verified" });
    const kycPending = await EmployeeDocuments.countDocuments({ status: "pending" });
    const kycRejected = await EmployeeDocuments.countDocuments({ status: "rejected" });
    const totalKyc = await EmployeeDocuments.countDocuments();

    res.status(200).json({
      totalEmployees,
      totalTasks,
      kycApproved,
      kycPending,
      kycRejected,
      totalKyc,
      systemHealth: "Stable",
      uptime: "99.9%"
    });
  } catch (error) {
    console.error("Admin Overview error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};












// import User from "../models/User.js";
// import Task from "../models/Task.js";

// export const getDashboardStats = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     const user = await User.findOne({ employeeId });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Fetch real task data
//     const totalTasks = await Task.countDocuments({ assignedTo: employeeId });
//     const completedTasks = await Task.countDocuments({ assignedTo: employeeId, status: "completed" });
//     const pendingTasks = totalTasks - completedTasks;
//     const performance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

//     // Admin can see total users
//     let totalUsers = 0;
//     if (user.role === "admin") {
//       totalUsers = await User.countDocuments();
//     }

//     // Fetch recent activities (optional: from separate Activity collection later)
//     const activities = [
//       { id: 1, activity: "Checked dashboard", time: "Just now" },
//       { id: 2, activity: "Updated task status", time: "2 hrs ago" },
//     ];

//     res.status(200).json({
//       employeeId: user.employeeId,
//       role: user.role,
//       totalTasks,
//       completedTasks,
//       pendingTasks,
//       performance,
//       totalUsers,
//       activities,
//     });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

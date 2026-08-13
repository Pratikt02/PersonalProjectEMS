import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  activity: { type: String, required: true },
  time: { type: String, required: true },
});

const dashboardSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: {type:String, required: ture},
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  pendingTasks: { type: Number, default: 0 },
  performance: { type: Number, default: 0 },
  activities: [activitySchema],
});

export default mongoose.model("Dashboard", dashboardSchema);

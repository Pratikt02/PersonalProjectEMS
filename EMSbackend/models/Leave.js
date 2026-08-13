import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    leave_id: {
      type: String,
      required: true,
      unique: true,
    },

    employee_id: {
      type: String,
      required: true,
    },

    employee_name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Sick Leave", "Casual Leave", "Paid Leave", "Other"],
      required: true,
    },

    from: {
      type: Date,
      required: true,
    },

    to: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);









// import mongoose from "mongoose";

// const leaveSchema = new mongoose.Schema(
//   {
//     // 🔑 UNIQUE EMPLOYEE IDENTIFIER (VERY IMPORTANT)
//     employee_id: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     // 👤 EMPLOYEE NAME (DISPLAY PURPOSE)
//     employee_name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     // 📌 LEAVE TYPE
//     type: {
//       type: String,
//       enum: ["Sick Leave", "Casual Leave", "Paid Leave", "Other"],
//       required: true,
//       trim: true,
//     },

//     // 📅 FROM DATE
//     from: {
//       type: Date,
//       required: true,
//     },

//     // 📅 TO DATE
//     to: {
//       type: Date,
//       required: true,
//     },

//     // 📝 REASON
//     reason: {
//       type: String,
//       trim: true,
//     },

//     // ⏳ STATUS (ONLY ADMIN / HR / MANAGER CAN CHANGE)
//     status: {
//       type: String,
//       enum: ["Pending", "Approved", "Rejected"],
//       default: "Pending",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// export default mongoose.model("Leave", leaveSchema);









// import mongoose from "mongoose";

// const leaveSchema = new mongoose.Schema({
//   employeeName: {
//     type: String,
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ["Sick leave", "Casual leave", "Paid leave", "Other"],
//     default: "Sick leave"
//   },
//   from: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(value) {
//         return !this.to || value <= this.to;
//       },
//       message: "From date must be before or equal to To date"
//     }
//   },
//   to: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(value) {
//         return !this.from || value >= this.from;
//       },
//       message: "To date must be after or equal to From date"
//     }
//   },
//   reason: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ["Pending", "Approved", "Rejected"],
//     default: "Pending"
//   }
// }, {
//   timestamps: true
// });

// export default mongoose.model("Leave", leaveSchema);
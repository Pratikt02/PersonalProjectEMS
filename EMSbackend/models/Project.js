import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    project_name: { type: String, required: true },
    project_id: { type: String, unique: true, required: true }, // Added for frontend compatibility
    description: { type: String },
    start_date: { type: Date },
    end_date: { type: Date },
    deadline: { type: Date }, // Added for frontend compatibility

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed", "On Hold"],
      default: "In Progress",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);













// import mongoose from "mongoose";

// const projectSchema = new mongoose.Schema(
//   {
//     project_name: { type: String, required: true },
//     project_id: { type: String, unique: true, required: true },//added for id.
//     description: { type: String },
//     start_date: { type: Date },
//     end_date: { type: Date },

//     manager: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",  // Make sure this points to your User model
//       required: true,
//     },

//     team: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Team",
//       default: null,
//     },

//     status: {
//       type: String,
//       enum: ["In Progress", "Completed", "On Hold"],
//       default: "In Progress",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Project", projectSchema);

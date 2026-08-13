import mongoose from "mongoose";

const employeeDocumentsSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    panNumber: { type: String, default: "" },
    aadhaarNumber: { type: String, default: "" },

    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountNumber: { type: String, default: "" },

    presentAddress: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },

    documents: {
      aadhaarFront: { type: String, default: "" },
      aadhaarBack: { type: String, default: "" },
      panCard: { type: String, default: "" },
      passbook: { type: String, default: "" },
      photo: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    remarks: { type: String, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeDocuments", employeeDocumentsSchema);

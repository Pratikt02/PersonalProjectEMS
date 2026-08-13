import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    month: {
      type: Number, // 1–12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },

    // --- Earnings ---
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },

    // --- Deductions ---
    pf: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    lateDeductions: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },

    // --- Computed (auto-set by pre-save hook) ---
    grossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },

    // --- Status ---
    status: {
      type: String,
      enum: ["Draft", "Processed", "Paid"],
      default: "Draft",
    },
    paidOn: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// --- Auto-calculate gross, deductions, net before save ---
payrollSchema.pre("save", function (next) {
  this.grossPay = this.basicSalary + this.hra + this.allowances + this.bonus;
  this.totalDeductions =
    this.pf + this.tax + this.lateDeductions + this.otherDeductions;
  this.netPay = this.grossPay - this.totalDeductions;
  next();
});

// Also recalculate on findOneAndUpdate
payrollSchema.pre("findOneAndUpdate", function (next) {
  const u = this.getUpdate();
  if (u) {
    const basic = u.basicSalary ?? 0;
    const hra = u.hra ?? 0;
    const allowances = u.allowances ?? 0;
    const bonus = u.bonus ?? 0;
    const pf = u.pf ?? 0;
    const tax = u.tax ?? 0;
    const late = u.lateDeductions ?? 0;
    const other = u.otherDeductions ?? 0;
    u.grossPay = basic + hra + allowances + bonus;
    u.totalDeductions = pf + tax + late + other;
    u.netPay = u.grossPay - u.totalDeductions;
  }
  next();
});

export default mongoose.model("Payroll", payrollSchema);

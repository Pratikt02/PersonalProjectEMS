import Payroll from "../models/Payroll.js";
import User from "../models/User.js";

// ─── GET ALL (Admin / HR) ────────────────────────────────────────────────────
export const getAllPayroll = async (req, res) => {
  try {
    const { month, year, status, search } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (status) filter.status = status;
    if (search) filter.employeeName = { $regex: search, $options: "i" };

    const records = await Payroll.find(filter).sort({ year: -1, month: -1, createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payroll records", error: err.message });
  }
};

// ─── GET MY PAY SLIPS (Employee) ─────────────────────────────────────────────
export const getMyPayroll = async (req, res) => {
  try {
    const { employeeId } = req.user; // set by auth middleware
    const records = await Payroll.find({ employeeId }).sort({ year: -1, month: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your payroll", error: err.message });
  }
};

// ─── GET ONE ─────────────────────────────────────────────────────────────────
export const getPayrollById = async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Employees can only see their own
    if (req.user.role === "employee" && record.employeeId !== req.user.employeeId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch record", error: err.message });
  }
};

// ─── CREATE (Admin / HR) ─────────────────────────────────────────────────────
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Prevent duplicate for same employee + period
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      return res.status(400).json({
        message: `A payroll record for this employee for ${month}/${year} already exists.`,
      });
    }

    // Pull employee info to auto-fill name / department / designation
    const employee = await User.findOne({ employeeId });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const payroll = new Payroll({
      ...req.body,
      employeeName: employee.name,
      department: employee.department,
      designation: employee.designation,
    });

    await payroll.save();
    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ message: "Failed to create payroll", error: err.message });
  }
};

// ─── UPDATE (Admin / HR) ─────────────────────────────────────────────────────
export const updatePayroll = async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.status === "Paid")
      return res.status(400).json({ message: "Cannot edit a paid payroll record" });

    // Recompute on update
    const body = req.body;
    const grossPay =
      (body.basicSalary ?? record.basicSalary) +
      (body.hra ?? record.hra) +
      (body.allowances ?? record.allowances) +
      (body.bonus ?? record.bonus);
    const totalDeductions =
      (body.pf ?? record.pf) +
      (body.tax ?? record.tax) +
      (body.lateDeductions ?? record.lateDeductions) +
      (body.otherDeductions ?? record.otherDeductions);
    const netPay = grossPay - totalDeductions;

    const updated = await Payroll.findByIdAndUpdate(
      req.params.id,
      { ...body, grossPay, totalDeductions, netPay },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update payroll", error: err.message });
  }
};

// ─── MARK AS PAID (Admin / HR) ───────────────────────────────────────────────
export const markAsPaid = async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.status = "Paid";
    record.paidOn = new Date();
    await record.save();

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as paid", error: err.message });
  }
};

// ─── DELETE (Admin / HR) ─────────────────────────────────────────────────────
export const deletePayroll = async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.status === "Paid")
      return res.status(400).json({ message: "Cannot delete a paid payroll record" });

    await Payroll.findByIdAndDelete(req.params.id);
    res.json({ message: "Payroll record deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete payroll", error: err.message });
  }
};

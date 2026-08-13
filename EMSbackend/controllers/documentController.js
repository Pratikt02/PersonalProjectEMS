import mongoose from "mongoose";
import EmployeeDocuments from "../models/EmployeeDocuments.js";
import User from "../models/User.js";

/**
 * ✅ Create / Update Employee Documents
 * POST /api/documents/:employeeId
 */
export const upsertEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: "Invalid employeeId" });
    }

    const data = req.body;

    // ✅ Upload docs paths
    const docs = {};
    if (req.files?.aadhaarFront)
      docs.aadhaarFront = `/uploads/documents/${req.files.aadhaarFront[0].filename}`;
    if (req.files?.aadhaarBack)
      docs.aadhaarBack = `/uploads/documents/${req.files.aadhaarBack[0].filename}`;
    if (req.files?.panCard)
      docs.panCard = `/uploads/documents/${req.files.panCard[0].filename}`;
    if (req.files?.passbook)
      docs.passbook = `/uploads/documents/${req.files.passbook[0].filename}`;
    if (req.files?.photo)
      docs.photo = `/uploads/documents/${req.files.photo[0].filename}`;

    // ✅ Keep old docs safe
    const existing = await EmployeeDocuments.findOne({ employeeId });

    const documents = await EmployeeDocuments.findOneAndUpdate(
      { employeeId },
      {
        ...data,
        employeeId,
        documents: {
          ...(existing?.documents || {}),
          ...docs,
        },
        // ✅ if employee re-uploads after verified -> set pending again
        status: existing?.status === "verified" ? "pending" : existing?.status || "pending",
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Documents saved successfully",
      documents,
    });
  } catch (err) {
    console.error("upsertEmployeeDocuments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Get Single Employee Documents
 * GET /api/documents/:employeeId
 */
export const getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: "Invalid employeeId" });
    }

    const documents = await EmployeeDocuments.findOne({ employeeId }).populate(
      "employeeId",
      "name email phone role employeeId profileImage department designation"
    );

    return res.json({ success: true, kyc: documents }); // Keeping 'kyc' key for potential mini-frontend compatibility if not all files updated, but better to be consistent. Let's use 'data' or 'kyc' to be safe. Actually, the frontend expected 'kyc' in some places.
  } catch (err) {
    console.error("getEmployeeDocuments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ List Documents (Admin/HR)
 * GET /api/documents?status=pending
 */
export const listDocuments = async (req, res) => {
  try {
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const list = await EmployeeDocuments.find(filter)
      .populate("employeeId", "name email phone role employeeId profileImage")
      .sort({ updatedAt: -1 });

    return res.json({ success: true, kycList: list }); // Keeping 'kycList' for frontend compatibility
  } catch (err) {
    console.error("listDocuments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Verify / Reject Documents (Admin/HR only)
 * PATCH /api/documents/:employeeId/verify
 */
export const verifyDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: "Invalid employeeId" });
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const documents = await EmployeeDocuments.findOneAndUpdate(
      { employeeId },
      {
        status,
        remarks: remarks || "",
        verifiedBy: req.user?._id,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!documents) {
      return res.status(404).json({ success: false, message: "Document record not found" });
    }

    return res.json({ success: true, message: "Document status updated", kyc: documents });
  } catch (err) {
    console.error("verifyDocuments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ✅ Employees Missing/Empty Documents (Admin/HR)
 * GET /api/documents/missing
 */
export const getEmployeesMissingDocuments = async (req, res) => {
  try {
    // ✅ Get employees (exclude admin)
    const employees = await User.find({
      role: { $in: ["employee", "manager", "hr"] },
    }).select("name email phone role employeeId department designation profileImage createdAt");

    // ✅ Get all documents
    const docList = await EmployeeDocuments.find().select(
      "employeeId status panNumber aadhaarNumber documents updatedAt"
    );

    // ✅ Map employeeId => Documents
    const docMap = new Map();
    for (const doc of docList) {
      docMap.set(String(doc.employeeId), doc);
    }

    const isIncomplete = (doc) => {
      if (!doc) return true;
      const hasPan = doc.panNumber && doc.panNumber.trim().length > 0;
      const hasAadhaar = doc.aadhaarNumber && String(doc.aadhaarNumber).trim().length > 0;
      const docs = doc.documents || {};
      const hasAnyDoc =
        !!docs.aadhaarFront ||
        !!docs.aadhaarBack ||
        !!docs.panCard ||
        !!docs.passbook ||
        !!docs.photo;
      return !(hasPan || hasAadhaar || hasAnyDoc);
    };

    const result = employees.map((emp) => {
      const doc = docMap.get(String(emp._id));
      if (!doc) {
        return { employee: emp, kycStatus: "not_submitted", kycUpdatedAt: null };
      }
      if (isIncomplete(doc)) {
        return { employee: emp, kycStatus: "incomplete", kycUpdatedAt: doc.updatedAt };
      }
      return { employee: emp, kycStatus: doc.status || "pending", kycUpdatedAt: doc.updatedAt };
    });

    const missing = result.filter((x) =>
      ["not_submitted", "incomplete"].includes(x.kycStatus)
    );

    return res.json({
      success: true,
      total: missing.length,
      data: missing,
    });
  } catch (err) {
    console.error("getEmployeesMissingDocuments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

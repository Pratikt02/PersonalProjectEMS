import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Toast from "../components/Toast";

import {
  FiUser,
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiX,
  FiArrowLeft,
  FiEye,
  FiShield,
  FiAlertTriangle,
} from "react-icons/fi";

const BACKEND_URL = "https://ems.wordlanetech.com";

const EmployeeDocuments = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [kyc, setKyc] = useState(null);

  // ✅ Document Form
  const [form, setForm] = useState({
    aadhaarNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    address: "",
  });

  // ✅ docs
  const [files, setFiles] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    passbook: null,
    photo: null,
  });

  // ✅ preview existing docs
  const [existingDocs, setExistingDocs] = useState({});

  const safeDocUrl = (path) => {
    if (!path) return "";
    return `${BACKEND_URL}${path}`;
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const { name, files: picked } = e.target;
    if (!picked || !picked[0]) return;
    setFiles((prev) => ({ ...prev, [name]: picked[0] }));
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${employeeId}`);
      const kycData = res.data?.kyc || null;
      setKyc(kycData);

      if (kycData) {
        setForm({
          aadhaarNumber: kycData.aadhaarNumber || "",
          panNumber: kycData.panNumber || "",
          bankName: kycData.bankName || "",
          accountNumber: kycData.accountNumber || "",
          ifscCode: kycData.ifscCode || "",
          address: kycData.address || "",
        });

        setExistingDocs(kycData.documents || {});
      } else {
        setExistingDocs({});
      }
    } catch (err) {
      setKyc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) payload.append(k, v);
      });

      Object.entries(files).forEach(([k, f]) => {
        if (f) payload.append(k, f);
      });

      const res = await api.post(`/documents/${employeeId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({
        show: true,
        message: res.data?.message || "✅ Documents saved successfully!",
        type: "success",
      });

      fetchDocuments();
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to save documents",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || "pending").toLowerCase();

    const styles = {
      pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      verified: "bg-green-500/10 text-green-400 border-green-500/20",
      rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    return (
      <span
        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-[0.15em] border backdrop-blur-sm ${
          styles[s] || styles.pending
        }`}
      >
        {s}
      </span>
    );
  };

  const UploadCard = ({ label, name }) => {
    const hasNew = !!files[name];
    const hasOld = !!existingDocs?.[name];

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>

          {(hasOld || hasNew) && (
            <a
              href={hasNew ? URL.createObjectURL(files[name]) : safeDocUrl(existingDocs[name])}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <FiEye size={14} /> VIEW
            </a>
          )}
        </div>

        <label className="w-full cursor-pointer group">
          <div
            className={`w-full px-4 py-3.5 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2 text-xs font-semibold ${
              hasNew
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-slate-50 border-slate-200 text-slate-500 group-hover:bg-slate-100 group-hover:border-slate-300"
            }`}
          >
            <FiUploadCloud size={16} className={hasNew ? "text-green-600" : "text-slate-400"} />
            {hasNew ? files[name]?.name : "Select File"}
          </div>

          <input
            type="file"
            name={name}
            className="hidden"
            onChange={handleFile}
            accept="image/*,.pdf"
          />
        </label>

        {hasOld && !hasNew && (
          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
            <FiCheckCircle className="text-green-500" /> Current copy secure
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <FiShield className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Compliance Hub</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Storage</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Onboarding Documents</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Securely manage and verify your professional identification and employment records.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2 active:scale-95"
                >
                  <FiArrowLeft size={14} /> Back
                </button>
                <StatusBadge status={kyc?.status || "pending"} />
              </div>
              <div className="text-[10px] text-slate-400 italic">
                Last modified: {kyc?.updatedAt ? new Date(kyc.updatedAt).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Main Content Area */}
      <div className="flex-1 -mt-10 px-4 md:px-8 pb-12 max-w-5xl mx-auto w-full z-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Forms */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Identity Details Card */}
              <div className="erp-card overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[10px]">
                    <FiUser className="text-blue-600" /> Identity Information
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium tracking-tight">NATIONAL ID SYSTEMS</span>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Aadhaar Number</label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={form.aadhaarNumber}
                        onChange={handleChange}
                        placeholder="0000 0000 0000"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium tracking-wide placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">PAN Card Number</label>
                      <input
                        type="text"
                        name="panNumber"
                        value={form.panNumber}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium tracking-wide placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Permanent Residential Address</label>
                    <textarea
                      rows={3}
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Street, Area, City, State, Pincode"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="erp-card overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[10px]">
                    <FiFileText className="text-purple-600" /> Financial Records
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium tracking-tight">PAYROLL DISBURSEMENT</span>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Bank Institution</label>
                      <input
                        type="text"
                        name="bankName"
                        value={form.bankName}
                        onChange={handleChange}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={handleChange}
                        placeholder="000000000000"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium tracking-wide placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 lg:w-1/2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={form.ifscCode}
                      onChange={handleChange}
                      placeholder="HDFC0001234"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium tracking-wide placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Uploads & Verification */}
            <div className="space-y-6">
              
              {/* Submission Information */}
              <div className="erp-card bg-white border border-slate-200 p-6 text-slate-900 overflow-hidden relative shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h3 className="text-xs font-black mb-4 flex items-center gap-2 tracking-wider text-slate-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> FINALIZE SUBMISSION
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium">
                  Ensure all information matches your original documents. Inaccurate data may result in rejection from the compliance team.
                </p>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-300/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60 group border border-slate-800 active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <FiCheckCircle size={16} className="group-hover:scale-110 transition-transform" /> 
                      Commit Changes
                    </>
                  )}
                </button>
              </div>

              {/* Uploads Grid - Mini Cards */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-slate-400 uppercase tracking-widest pl-1 mb-2 font-black">Digital Copies</h3>
                <UploadCard label="Aadhaar Front" name="aadhaarFront" />
                <UploadCard label="Aadhaar Back" name="aadhaarBack" />
                <UploadCard label="PAN Card" name="panCard" />
                <UploadCard label="Bank Proof" name="passbook" />
                <UploadCard label="Passport Photo" name="photo" />
              </div>

              {/* Admin Feedback (If any) */}
              {kyc?.remarks && (
                <div className="erp-card bg-orange-50 border-orange-200 p-5 shadow-inner">
                  <div className="flex gap-3">
                    <FiAlertTriangle className="text-orange-500 mt-0.5 shrink-0" size={18} />
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Compliance Review Feedback</h4>
                      <p className="text-[11px] text-orange-700 leading-relaxed italic border-l-2 border-orange-300 pl-3 mt-3">
                        "{kyc.remarks}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <Footer />
    </div>
  );
};

export default EmployeeDocuments;

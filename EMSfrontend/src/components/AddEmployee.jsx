import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import Footer from "./Footer";
import Toast from "./Toast";
import {
  FiUser, FiMail, FiEye, FiCamera, FiX,
  FiBriefcase, FiShield, FiCheck, FiCalendar, FiLock, FiPhone,
} from "react-icons/fi";

// ── Static data ───────────────────────────────────────────────────────────────
const roleColors = {
  ADMIN:    { bg: "bg-red-100",    text: "text-red-700" },
  HR:       { bg: "bg-green-100",  text: "text-green-700" },
  EMPLOYEE: { bg: "bg-blue-100",   text: "text-blue-700" },
  MANAGER:  { bg: "bg-purple-100", text: "text-purple-700" },
  DEFAULT:  { bg: "bg-slate-100",  text: "text-slate-700" },
};

const departments = [
  "Engineering","HR","Finance","Marketing","Sales","Operations","IT Support",
  "Customer Service","Logistics","Legal","Procurement","R&D","Quality","Admin",
  "Production","Maintenance","Design","Training","Compliance","Analytics",
  "Strategy","Security","Public Relations","Facilities","Health & Safety",
  "UX/UI","Data Science","Content","Business Development","Innovation",
];

const designations = [
  "Manager","Senior Engineer","Junior Engineer","Intern","Team Lead","HR Executive",
  "Finance Analyst","Marketing Specialist","Sales Associate","Operations Manager",
  "IT Support Engineer","Customer Support Rep","Logistics Coordinator","Legal Advisor",
  "Procurement Officer","R&D Scientist","Quality Analyst","Admin Assistant",
  "Production Supervisor","Maintenance Technician","Designer","Trainer",
  "Compliance Officer","Data Analyst","Strategy Consultant","Security Officer",
  "PR Executive","Facilities Manager","Safety Officer","Content Writer",
  "Business Developer","Innovation Lead","UX Designer","UI Designer","Data Engineer",
  "Product Manager","Software Engineer","Network Engineer","Cloud Engineer","DevOps Engineer",
  "Database Admin","AI Specialist","Machine Learning Engineer","Cybersecurity Analyst",
  "Marketing Manager","Sales Manager","Operations Executive","HR Manager","Finance Manager",
  "Legal Manager","Customer Success Manager",
];

const roles = [
  { value: "admin",    label: "Admin" },
  { value: "manager",  label: "Manager" },
  { value: "hr",       label: "HR" },
  { value: "employee", label: "Employee" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const AddEmployee = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employeeId: "", name: "", email: "", role: "", department: "",
    designation: "", phone: "", joining_date: "", dob: "",
    location: "", address: "", gender: "", password: "",
    reportingTo: "",
  });
  const [managers,          setManagers]          = useState([]);
  const [file,              setFile]              = useState(null);
  const [previewUrl,        setPreviewUrl]        = useState("");
  const [submitting,        setSubmitting]        = useState(false);
  const [toast,             setToast]             = useState({ show: false, message: "", type: "success" });
  const [showPassword,      setShowPassword]      = useState(false);
  const [showConfirmModal,  setShowConfirmModal]  = useState(false);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get("/users/managers");
        setManagers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch managers", err);
      }
    };
    fetchManagers();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) { const [y, m, d] = parts; return `${d}-${m}-${y}`; }
    return dateStr;
  };

  // Auto-generate employee ID from joining date
  useEffect(() => {
    if (formData.joining_date) {
      const parts = formData.joining_date.split("-");
      if (parts.length === 3) {
        const yy = parts[0].slice(-2);
        const mm = parts[1];
        const rand = Math.floor(1000 + Math.random() * 9000);
        setFormData((prev) => ({ ...prev, employeeId: `${yy}${mm}${rand}` }));
      }
    }
  }, [formData.joining_date]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.name || !formData.email || !formData.role || !formData.password) {
      setToast({ show: true, message: "Please fill in all required fields.", type: "error" });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    const payload = new FormData();
    Object.keys(formData).forEach((key) => { if (formData[key]) payload.append(key, formData[key]); });
    if (file) payload.append("profileImage", file);
    try {
      const res = await api.post("/users/register", payload, { headers: { "Content-Type": "multipart/form-data" } });
      const created = res.data?.user || res.data?.employee || res.data?.data || res.data;
      if (!created?._id) { setToast({ show: true, message: "Employee created but no ID returned!", type: "error" }); return; }
      setToast({ show: true, message: "✅ Identity record initialized. Syncing documents...", type: "success" });
      setTimeout(() => navigate(`/employees/${created._id}/onboarding-documents`, { state: { employee: created, fromAddEmployee: true } }), 1000);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || "Internal system failure during registration.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Provisioning Identity Node...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-3 border-b border-slate-100/50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-slate-700 text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area */}
      <div className="bg-white pt-16 pb-28 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-600/5 via-blue-400/5 to-transparent opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                <FiUser size={18} />
              </div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-lg">Personnel Node</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">
              Initialize Employee Record
            </h1>
            <p className="text-slate-500 text-sm font-bold opacity-70">Register new personnel identity into the enterprise core.</p>
          </div>
          <button
            onClick={() => navigate("/employees")}
            className="erp-button-secondary h-12 px-8 flex items-center gap-2 group shadow-xl shadow-slate-200/50"
          >
            <FiX className="group-hover:rotate-90 transition-transform duration-300" /> Abort Process
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 -mt-12 mb-20 z-20">
        <form onSubmit={handleOpenConfirm} className="space-y-8">

          {/* Identity Section */}
          <div className="erp-card-premium overflow-hidden border-white/40">
            <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs"><FiUser size={16} /></div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Base Identity Data</h2>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 italic">Mandatory Fields</span>
            </div>
            
            <div className="p-10">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                {/* Photo upload */}
                <div className="flex flex-col items-center shrink-0">
                  <label className="erp-label mb-4">Official Bio-Image</label>
                  <div className="relative w-36 h-36 group cursor-pointer ring-4 ring-slate-50 ring-offset-4 ring-offset-white rounded-4xl overflow-hidden shadow-2xl transition-all duration-500 hover:ring-blue-100">
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-blue-300">
                      {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <FiUser className="text-slate-200" size={48} />}
                    </div>
                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <FiCamera size={24} className="mb-2 animate-bounce" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Update</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>

                {/* Name / Email / ID */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="erp-label">Full Legal Identity Name <span className="text-red-500 font-bold">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder="e.g. Alexander Pierce" required className="erp-input shadow-xs h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="erp-label">Secure Enterprise Mail <span className="text-red-500 font-bold">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="alex.p@enterprise.com" required className="erp-input shadow-xs h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="erp-label">Personnel ID Pointer</label>
                    <div className="relative group/id">
                      <input type="text" value={formData.employeeId} readOnly
                        placeholder="Automatic ID Pointer"
                        className="erp-input h-12 bg-slate-50 text-slate-400 font-mono italic cursor-not-allowed border-dashed" />
                      <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover/id:text-blue-400 transition-colors" size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Org Distribution */}
            <div className="erp-card-premium border-white/40">
              <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs"><FiBriefcase size={14} /></div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Org Distribution</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="erp-label">Access Role <span className="text-red-500 font-bold">*</span></label>
                  <select name="role" value={formData.role} onChange={handleChange} required className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Level</option>
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Division</label>
                  <select name="department" value={formData.department} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Dept</option>
                    {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Designation</label>
                  <select name="designation" value={formData.designation} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Title</option>
                    {designations.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Deployment Node</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange}
                    placeholder="e.g. HQ - New York" className="erp-input shadow-xs h-12" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="erp-label">Reporting To (Supervisor)</label>
                  <select name="reportingTo" value={formData.reportingTo} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Supervisor (Optional)</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.designation || m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Telemetry/Bio Data */}
            <div className="erp-card-premium border-white/40">
              <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs"><FiPhone size={14} /></div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Contact & Bio-Data</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="erp-label">Uplink Contact</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="+X (XXX) XXX-XXXX" className="erp-input shadow-xs h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Identity Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Arrival Epoch <span className="text-red-500 font-bold">*</span></label>
                  <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange}
                    required className="erp-input shadow-xs h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Resource DOB</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange}
                    className="erp-input shadow-xs h-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Security Node */}
          <div className="erp-card-premium border-white/40">
            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-purple-600 shadow-xs"><FiShield size={14} /></div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Security Credentials & Locale</h2>
            </div>
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-1.5">
                <label className="erp-label">Official Residence Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                  placeholder="Comprehensive residential address data..."
                  className="erp-input h-auto py-4 w-full resize-none shadow-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="erp-label">System Key (Pass) <span className="text-red-500 font-bold">*</span></label>
                <div className="relative group/pass">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                    onChange={handleChange} placeholder="Secure entropy string" required
                    className="erp-input h-12 w-full pr-12 shadow-xs group-hover/pass:border-blue-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                    {showPassword ? <FiEye size={16} /> : <FiLock size={16} />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter italic opacity-60">Used for first-time node authorization.</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-6 pt-10">
            <div className="hidden md:flex flex-col items-end">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authorization Required</p>
               <p className="text-[9px] text-slate-300 font-bold italic">Identity propagation is irreversible.</p>
            </div>
            <button type="submit" disabled={submitting} className="erp-button-primary h-14 px-12 text-xs flex items-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 group">
              <FiCheck className="group-hover:scale-125 transition-transform" size={18} /> Review & Propagate Identity
            </button>
          </div>
        </form>
      </main>

      <Footer />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />

      {/* 🔹 Confirm Modal Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-400 border border-white/20">

            {/* Modal header */}
            <div className="px-10 py-8 bg-linear-to-r from-slate-900 to-slate-800 flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"><FiShield size={20} /></div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Validate Personnel Data</h2>
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Deployment Pointer: {formData.employeeId}</p>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="p-3 rounded-2xl hover:bg-white/10 text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/5">
                <FiX size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0 bg-white">

              {/* Sidebar Identity Card */}
              <div className="w-full lg:w-72 bg-slate-50 p-10 flex flex-col items-center text-center shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-blue-600/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative w-32 h-32 rounded-[2.5rem] bg-white border-4 border-white flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-slate-100 ring-offset-4 ring-offset-white">
                    {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <FiUser className="text-slate-200" size={48} />}
                  </div>
                </div>
                
                <div className="mt-8 space-y-2">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{formData.name || "UNIDENTIFIED"}</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded-lg shadow-lg shadow-slate-900/10">
                      {formData.role || "NODE"}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100">
                       PROVISIONING
                    </span>
                  </div>
                </div>
                
                <div className="w-full mt-10 space-y-4">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><FiMail size={12} /></div>
                    <span className="text-[10px] font-bold text-slate-600 truncate">{formData.email || "NO-MAIL"}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><FiCalendar size={12} /></div>
                    <span className="text-[10px] font-bold text-slate-600">{formatDate(formData.joining_date)}</span>
                  </div>
                </div>
              </div>

              {/* Data Review Grid */}
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Identity Pointers
                     </p>
                     <DetailRow label="Resource ID" value={formData.employeeId} />
                     <DetailRow label="Phone Uplink" value={formData.phone} />
                     <DetailRow label="Location Node" value={formData.location} />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Org Assignment
                     </p>
                     <DetailRow label="Strategic Unit" value={formData.department} />
                     <DetailRow label="Resource Title" value={formData.designation} />
                     <DetailRow label="Gender Pointer" value={formData.gender} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Physical Locale & Bio
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                        <DetailRow label="Birth Epoch" value={formatDate(formData.dob)} />
                        <DetailRow label="Registration" value={formatDate(formData.joining_date)} />
                     </div>
                     <DetailRow label="Residence" value={formData.address} />
                  </div>
                  
                  {/* Security Key Display */}
                  <div className="md:col-span-2 bg-slate-900 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                     <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400"><FiLock size={20} /></div>
                        <div>
                           <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Authorization Key</p>
                           <p className="text-sm font-mono font-black tracking-widest text-white truncate max-w-[200px]">{formData.password}</p>
                        </div>
                     </div>
                     <div className="flex flex-col items-center md:items-end relative z-10">
                         <span className="text-[9px] font-black text-orange-400 uppercase bg-orange-400/10 px-3 py-1 rounded-lg border border-orange-400/20 mb-1">Sensitive Data</span>
                         <p className="text-[8px] text-slate-400 italic">Record this key for the first login sequence.</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-10 py-8 border-t border-slate-100 flex justify-end gap-4 shrink-0 bg-slate-50/80 backdrop-blur-md">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="h-14 px-10 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all hover:text-slate-900"
              >
                Refine Attributes
              </button>
              <button 
                onClick={handleSubmit} 
                className="h-14 px-12 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-3"
              >
                <FiCheck size={18} className="animate-pulse" /> Finalize Propagation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEmployee;


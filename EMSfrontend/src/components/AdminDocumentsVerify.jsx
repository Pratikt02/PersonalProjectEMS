import React, { useEffect, useState } from "react";
import api from "../api/api";
import Footer from "./Footer";
import Toast from "./Toast";
import {
  FiShield, FiSearch, FiEye, FiCheck, FiX, FiClock,
  FiUser, FiMail, FiPhone, FiArrowLeft, FiAlertTriangle,
  FiFileText, FiInfo, FiActivity
} from "react-icons/fi";
import EmptyState from "./EmptyState";

const statusBadge = {
  pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  verified: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const safeDocUrl = (path) => {
  if (!path) return "";
  return `https://ems.wordlanetech.com${path}`;
};

const AdminDocumentsVerify = () => {
  const [kycList, setKycList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewKyc, setViewKyc] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const fetchKycList = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await api.get("/documents?status=pending");
      const list = res.data?.kycList || [];
      setKycList(list);
      setFiltered(list);
    } catch (err) {
      setError(true);
      setToast({ show: true, message: "Failed to load document list", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKycList(); }, []);

  useEffect(() => {
    if (!search) setFiltered(kycList);
    else {
      const q = search.toLowerCase();
      setFiltered(kycList.filter((k) => {
        const emp = k.employeeId || {};
        return (emp.name || "").toLowerCase().includes(q) || (emp.email || "").toLowerCase().includes(q) || (emp.employeeId || "").toLowerCase().includes(q);
      }));
    }
  }, [search, kycList]);

  const updateStatus = async (employeeMongoId, status) => {
    try {
      setSubmitting(true);
      await api.patch(`/documents/${employeeMongoId}/verify`, { status, remarks });
      setToast({ show: true, message: `✅ Verification ${status.toUpperCase()} successfully`, type: "success" });
      setRemarks("");
      setViewKyc(null);
      fetchKycList();
    } catch (err) {
      setToast({ show: true, message: "Failed to update status", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (documentId) => {
  if (!window.confirm("Are you sure you want to delete this document?")) {
    return;
  }

  try {
    await api.delete(`/documents/${documentId}`);

    setToast({
      show: true,
      message: "Document deleted successfully",
      type: "success",
    });

    fetchKycList();
  } catch (err) {
    console.error(err);

    setToast({
      show: true,
      message: "Failed to delete document",
      type: "error",
    });
  }
};

  const DocItem = ({ title, filePath, icon: Icon }) => {
    const hasDoc = !!filePath;
    return (
      <div className={`erp-card p-4 transition-all duration-300 ${hasDoc ? 'bg-white' : 'bg-slate-50/50 opacity-60'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDoc ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                {Icon ? <Icon size={14} /> : <FiFileText size={14} />}
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <p className={`text-xs font-bold ${hasDoc ? 'text-slate-700' : 'text-slate-300'}`}>
                  {hasDoc ? 'Record Detected' : 'No Submission'}
                </p>
             </div>
          </div>
          {hasDoc && (
            <a href={safeDocUrl(filePath)} target="_blank" rel="noreferrer" 
               className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group">
              <FiEye size={16} className="group-hover:scale-110 transition-transform" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <FiShield className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Compliance Admin</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Audit Mode</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verification Panel</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-medium">
                  Authentication gateway for employee identity and financial records verification.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={fetchKycList} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 border border-blue-500/30 active:scale-95">
                <FiClock size={14} /> Refresh Stream
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 -mt-10 px-4 md:px-8 pb-12 max-w-6xl mx-auto w-full z-20">
        
        {/* Table/List View */}
        <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/20">
            <div className="relative w-full md:w-96 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <FiSearch size={16} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or identifier..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Pending Verification: {filtered.length}
            </div>
          </div>

          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                <p className="mt-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Scanning Document Store...</p>
             </div>
          ) : error ? (
             <div className="py-20">
                <EmptyState 
                  type="error" 
                  title="Compliance Stream Error" 
                  message="Unable to intercept the document queue. Security audit synchronization failure."
                  onRetry={fetchKycList}
                />
             </div>
          ) : filtered.length === 0 ? (
             <div className="py-24 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <FiCheck className="text-blue-600 text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Compliance Cleared</h3>
                <p className="text-xs text-slate-500">No pending verification requests found in the system queue.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="px-8 py-5">Personnel Account</th>
                    <th className="px-8 py-5">Communication Data</th>
                    <th className="px-8 py-5">Compliance Token</th>
                    <th className="px-8 py-5 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((k) => {
                    const emp = k.employeeId || {};
                    return (
                      <tr key={k._id} className="group hover:bg-slate-50 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs group-hover:bg-blue-600 transition-colors shadow-lg overflow-hidden shrink-0">
                              {emp.profileImage ? <img src={`https://ems.wordlanetech.com${emp.profileImage}`} alt="" className="w-full h-full object-cover" /> : (emp.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 tracking-tight">{emp.name || "N/A"}</span>
                              <span className="text-[9px] text-slate-400 font-mono uppercase mt-0.5 tracking-tighter">UID: {emp.employeeId ? emp.employeeId : (emp._id ? emp._id.slice(-6) : "N/A")
                            }</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5 text-[11px] font-medium text-slate-600">
                            <span className="flex items-center gap-2"><FiMail className="text-blue-400" size={10} /> {emp.email || "-"}</span>
                            <span className="flex items-center gap-2 text-slate-400"><FiPhone className="text-slate-300" size={10} /> {emp.phone || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border shadow-xs ${statusBadge[k.status] || statusBadge.pending}`}>
                            {k.status || "pending"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setViewKyc(k);
                                setRemarks(k.remarks || "");
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all group active:scale-95"
                            >
                              <FiEye size={14} className="group-hover:rotate-12 transition-transform" />
                              Review & Audit
                            </button>

                            <button
                              onClick={() => handleDelete(k._id)}
                              className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                        {/* <td className="px-8 py-6 text-right">
                          <button onClick={() => { setViewKyc(k); setRemarks(k.remarks || ""); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all group active:scale-95">
                            <FiEye size={14} className="group-hover:rotate-12 transition-transform" /> Review & Audit
                          </button>
                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Premium Verification Modal */}
      {viewKyc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 backdrop-blur-xl transition-all duration-300">
           <div className="absolute inset-0 bg-slate-900/40" onClick={() => setViewKyc(null)} />
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[92vh] overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner">
                       <FiActivity size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 tracking-tight">Onboarding Audit</h2>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Profile:</span>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{viewKyc.employeeId?.name}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setViewKyc(null)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 active:scale-90">
                    <FiX size={20} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                 
                 {/* Sidebar: Metadata */}
                 <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 overflow-y-auto space-y-8">
                    
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Inspection</h3>
                       <div className="space-y-3">
                          {[
                            { label: 'Aadhaar UID', value: viewKyc.aadhaarNumber },
                            { label: 'PAN Identity', value: viewKyc.panNumber },
                            { label: 'Bank Entity', value: viewKyc.bankName },
                            { label: 'Account No', value: viewKyc.accountNumber },
                            { label: 'IFSC Routing', value: viewKyc.ifscCode },
                          ].map(item => (
                            <div key={item.label} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                               <p className="text-xs font-black text-slate-800 tracking-tight">{item.value || 'Not Disclosed'}</p>
                            </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance Remarks</h3>
                       <textarea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add internal compliance notes..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-medium resize-none transition-all outline-none"
                       />
                       <p className="text-[9px] text-slate-400 italic">Notes will be visible to the candidate.</p>
                    </section>
                 </div>

                 {/* Main: Assets */}
                 <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Assets</h3>
                       <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Asset Integrity Check</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <DocItem title="Aadhaar Frontage" filePath={viewKyc.documents?.aadhaarFront} />
                       <DocItem title="Aadhaar Reverse" filePath={viewKyc.documents?.aadhaarBack} />
                       <DocItem title="PAN Identity Card" filePath={viewKyc.documents?.panCard} />
                       <DocItem title="Financial Ledger" filePath={viewKyc.documents?.passbook} />
                       <DocItem title="Biometric Portrait" filePath={viewKyc.documents?.photo} />
                    </div>

                    {/* Security Info */}
                    <div className="bg-blue-600 rounded-2xl p-6 text-white overflow-hidden relative shadow-2xl shadow-blue-900/20">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                       <div className="relative z-10 flex gap-4 items-start">
                          <FiInfo size={20} className="mt-1 shrink-0" />
                          <div className="space-y-1">
                             <h4 className="text-xs font-black uppercase tracking-widest">System Validation Logic</h4>
                             <p className="text-[11px] text-blue-100 leading-relaxed opacity-80 font-medium">
                                Cross-verify Aadhaar and PAN numbers against provided visual evidence. Ensure account numbers are legible in bank proofs before finalization.
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                 <button onClick={() => updateStatus(viewKyc.employeeId?._id, "rejected")} disabled={submitting}
                   className="px-8 py-3 rounded-xl border border-red-200 bg-white text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:border-red-300 shadow-sm transition-all flex items-center gap-2 group active:scale-95 disabled:opacity-50">
                    <FiX size={16} className="group-hover:rotate-90 transition-transform" /> Deny Clearance
                 </button>
                 <button onClick={() => updateStatus(viewKyc.employeeId?._id, "verified")} disabled={submitting}
                   className="px-10 py-3 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 group active:scale-95 disabled:opacity-50">
                    <FiCheck size={16} className="group-hover:scale-125 transition-transform" /> Approve Verification
                 </button>
              </div>
           </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />
    </div>
  );
};

export default AdminDocumentsVerify;

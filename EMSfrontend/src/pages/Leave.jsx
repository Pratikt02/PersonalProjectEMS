import React, { useEffect, useState } from "react";
import api from "../api/api";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import {
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiPlus,
  FiX,
  FiMoreVertical,
  FiInbox,
  FiTag,
} from "react-icons/fi";

// ── Status badge styles ──────────────────────────────────────────────────────
const statusColors = {
  Approved: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500" },
  Pending:  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  Rejected: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
};

// ── Type badge styles ────────────────────────────────────────────────────────
const typeColors = {
  "Sick Leave":   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "Casual Leave": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Paid Leave":   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  "Other":        { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200" },
};

const TOTAL_LEAVES = 12;

const generateLeaveId = () => {
  const now    = new Date();
  const mm     = String(now.getMonth() + 1).padStart(2, "0");
  const dd     = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${mm}${dd}${random}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const calcDays = (from, to) => {
  if (!from || !to) return "—";
  const diff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
  return diff <= 0 ? "1 day" : `${diff} day${diff > 1 ? "s" : ""}`;
};

// ────────────────────────────────────────────────────────────────────────────
const Leave = () => {
  const [leaves,      setLeaves]      = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [toast,       setToast]       = useState({ show: false, message: "", type: "success" });

  // Filters
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");

  // Add form
  const [newLeave, setNewLeave] = useState({ type: "Sick Leave", from: "", to: "", reason: "" });

  const role         = localStorage.getItem("role");
  const user         = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId   = user.employeeId;
  const employeeName = user.name;
  const today        = new Date().toISOString().split("T")[0];

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res  = await api.get("/leaves");
      const data = res.data || [];
      setLeaves(role === "employee" ? data.filter((l) => l.employee_id === employeeId) : data);
    } catch (e) {
      setToast({ show: true, message: "Failed to fetch leave requests", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const usedLeaves      = leaves.filter((l) => l.status === "Approved").length;
  const pendingLeaves   = leaves.filter((l) => l.status === "Pending").length;
  const rejectedLeaves  = leaves.filter((l) => l.status === "Rejected").length;
  const remainingLeaves = Math.max(TOTAL_LEAVES - usedLeaves, 0);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredLeaves = leaves.filter((l) => {
    if (search && !(l.employee_name || "").toLowerCase().includes(search.toLowerCase()) && !String(l.leave_id).includes(search)) return false;
    if (typeFilter !== "All"   && l.type   !== typeFilter)   return false;
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    if (fromDate && new Date(l.from) < new Date(fromDate))   return false;
    if (toDate   && new Date(l.to)   > new Date(toDate))     return false;
    return true;
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAddLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post("/leaves", {
        leave_id:      generateLeaveId(),
        employee_id:   employeeId,
        employee_name: employeeName,
        ...newLeave,
        status: "Pending",
      });
      setShowAddModal(false);
      setNewLeave({ type: "Sick Leave", from: "", to: "", reason: "" });
      fetchLeaves();
      setToast({ show: true, message: "Leave request submitted successfully", type: "success" });
    } catch {
      setToast({ show: true, message: "Failed to submit leave request", type: "error" });
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/leaves/${id}`, { status });
      setShowDropdown(null);
      fetchLeaves();
      setToast({ show: true, message: `Leave request ${status.toLowerCase()}`, type: "success" });
    } catch {
      setToast({ show: true, message: "Failed to update status", type: "error" });
    } finally {
      setUpdating(null);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest(".dropdown-actions")) setShowDropdown(null); };
    if (showDropdown) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showDropdown]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl opacity-60" />
        
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                <FiCalendar className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Personnel Services</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Absence Management</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Leave Management</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Streamline time-off requests while maintaining organizational velocity and transparency.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 shadow-2xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-800 active:scale-95"
              >
                <FiPlus size={16} /> Request Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-10 max-w-[1600px] mx-auto w-full px-4 md:px-6 pb-12 z-20">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {role === "employee" ? (
            <>
              <StatCard label="Total Allocation" value={TOTAL_LEAVES} icon={<FiInbox />} color="slate" />
              <StatCard label="Utilized"         value={usedLeaves}    icon={<FiCheckCircle />} color="green" />
              <StatCard label="Pending Approval" value={pendingLeaves} icon={<FiClock />} color="orange" />
              <StatCard label="Net Balance"      value={remainingLeaves} icon={<FiActivity />} color="blue" />
            </>
          ) : (
            <>
              <StatCard label="Total Requests" value={leaves.length}  icon={<FiInbox />} color="slate" />
              <StatCard label="Approved"       value={usedLeaves}     icon={<FiCheckCircle />} color="green" />
              <StatCard label="Pending Review" value={pendingLeaves}  icon={<FiClock />} color="orange" />
              <StatCard label="Rejected"       value={rejectedLeaves} icon={<FiX />} color="red" />
            </>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div className="erp-card bg-white/80 backdrop-blur-md p-4 mb-6 border-slate-200/60 shadow-xl shadow-slate-200/20">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-400 group">
              <FiFilter size={14} className="group-hover:text-blue-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="erp-input pl-9 h-10 w-64 text-sm bg-white"
                placeholder="Search by name or ID..."
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="erp-input h-10 text-sm w-44 bg-white"
              >
                <option value="All">All Categories</option>
                <option>Sick Leave</option>
                <option>Casual Leave</option>
                <option>Paid Leave</option>
                <option>Other</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="erp-input h-10 text-sm w-40 bg-white"
              >
                <option value="All">All Statuses</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>

              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-0.5">Start Date</span>
                   <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="erp-input h-8 text-[11px] w-28 bg-white"
                  />
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-0.5">End Date</span>
                   <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="erp-input h-8 text-[11px] w-28 bg-white"
                  />
                </div>
              </div>

              {(search || typeFilter !== "All" || statusFilter !== "All" || fromDate || toDate) && (
                <button
                  onClick={() => { setSearch(""); setTypeFilter("All"); setStatusFilter("All"); setFromDate(""); setToDate(""); }}
                  className="px-3 h-10 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                >
                  <FiX size={14} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Intelligence</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Justification</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow State</th>
                  {role !== "employee" && <th className="px-6 py-5 text-right" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={role !== "employee" ? 7 : 6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={role !== "employee" ? 7 : 6} className="py-24 text-center px-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiInbox size={40} className="text-slate-200" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No Requests Logged</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        There are no absence requests matching your current filter configuration.
                      </p>
                    </td>
                  </tr>
                ) : filteredLeaves.map((leave) => {
                  const statusStyle = statusColors[leave.status] || statusColors.Pending;
                  const typeStyle   = typeColors[leave.type]     || typeColors["Other"];
                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                            {(leave.employee_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{leave.employee_name || "—"}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">ID-{leave.leave_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all shadow-xs ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                          {leave.type}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-600 flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5"><FiCalendar size={11} className="text-slate-400" /> {formatDate(leave.from)}</span>
                          <span className="flex items-center gap-1.5 opacity-60 ml-[15px]">to {formatDate(leave.to)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-widest group-hover:bg-white transition-colors">
                          <FiClock size={11} className="text-slate-400" />
                          {calcDays(leave.from, leave.to)}
                        </span>
                      </td>

                      <td className="px-6 py-5 max-w-[200px]">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2" title={leave.reason}>
                          "{leave.reason || "Operational necessity — no justification logged"}"
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest transition-all shadow-xs ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`} />
                          {leave.status}
                        </span>
                      </td>

                      {/* Admin actions */}
                      {role !== "employee" && (
                        <td className="px-6 py-5 text-right whitespace-nowrap dropdown-actions">
                          <div className="relative inline-block">
                            <button
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-200 border border-transparent rounded-xl transition-all active:scale-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(showDropdown === leave._id ? null : leave._id);
                              }}
                            >
                              <FiMoreVertical size={16} />
                            </button>
                            <div className={`absolute right-0 mt-3 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-30 overflow-hidden transition-all duration-200 origin-top-right ${showDropdown === leave._id ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                              <button
                                onClick={() => updateStatus(leave._id, "Approved")}
                                disabled={updating === leave._id}
                                className="flex w-full items-center gap-3 px-5 py-4 text-[10px] font-black text-green-700 uppercase tracking-widest hover:bg-green-50/50 transition-colors disabled:opacity-50"
                              >
                                <FiCheckCircle size={14} /> Approve Request
                              </button>
                              <div className="border-t border-slate-100" />
                              <button
                                onClick={() => updateStatus(leave._id, "Rejected")}
                                disabled={updating === leave._id}
                                className="flex w-full items-center gap-3 px-5 py-4 text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50/50 transition-colors disabled:opacity-50"
                              >
                                <FiX size={14} /> Deny Request
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!loading && filteredLeaves.length > 0 && (
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Ledger scan: <span className="text-slate-900">{filteredLeaves.length}</span> results found in <span className="text-slate-900">{leaves.length}</span> records
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />

      {/* ── Request Leave Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
            <div className="flex items-center justify-between px-10 py-10 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.25rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                  <FiCalendar size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Request Leave</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Absence Initiation Protocol</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-12 h-12 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-center text-slate-400"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLeave} className="px-10 py-10 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="erp-label ml-1">Requesting Identity</label>
                  <div className="flex items-center gap-4 px-6 py-4 rounded-[1.25rem] bg-slate-50 border border-slate-200/60 shadow-inner">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 shadow-sm">
                      {(employeeName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-800 block leading-none mb-0.5">{employeeName || "Cognito Identity"}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Personnel Record</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="erp-label ml-1">Absence Category</label>
                  <select
                    value={newLeave.type}
                    onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                    className="erp-input h-14 font-bold text-slate-700 rounded-2xl"
                  >
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Paid Leave</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="erp-label ml-1 text-emerald-600">Effective From</label>
                    <input
                      type="date"
                      min={today}
                      required
                      value={newLeave.from}
                      onChange={(e) => setNewLeave({ ...newLeave, from: e.target.value })}
                      className="erp-input h-14 font-black text-slate-700 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="erp-label ml-1 text-rose-500">Effective To</label>
                    <input
                      type="date"
                      min={today}
                      required
                      value={newLeave.to}
                      onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })}
                      className="erp-input h-14 font-black text-slate-700 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="erp-label ml-1">Operational Justification</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide professional justification for this absence request..."
                    value={newLeave.reason}
                    onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                    className="erp-input resize-none py-5 font-medium text-slate-700 leading-relaxed rounded-3xl"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                >
                  Abort
                </button>
                <button type="submit" className="flex-2 h-14 rounded-2xl bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <FiPlus size={16} /> Submit Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───
function StatCard({ label, value, icon, color }) {
  const styles = {
    blue:   "bg-blue-500/10 text-blue-600 border-blue-100",
    green:  "bg-emerald-500/10 text-emerald-600 border-emerald-100",
    orange: "bg-orange-500/10 text-orange-600 border-orange-100",
    red:    "bg-rose-500/10 text-rose-600 border-rose-100",
    slate:  "bg-slate-100 text-slate-500 border-slate-200"
  };

  return (
    <div className="erp-card bg-white/80 backdrop-blur-md p-6 group transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all duration-300 group-hover:scale-110 ${styles[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

const FiActivity = (props) => (
  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);


export default Leave;
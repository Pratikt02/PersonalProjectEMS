import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import {
  FiBriefcase, FiCalendar, FiMoreVertical, FiSearch, FiX,
  FiFilter, FiPlus, FiActivity, FiCheckCircle, FiClock,
  FiAlertCircle, FiEdit, FiTrash2, FiLayers, FiInfo, FiFolder
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/EmptyState";

// ── Status badge styles (Premium) ──────────────────────────────────────────
const statusColors = {
  "In Progress": { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  "Completed": { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  "On Hold": { bg: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" },
  DEFAULT: { bg: "bg-slate-50 text-slate-700 border-slate-100", dot: "bg-slate-400" },
};

const Projects = () => {
  const [projects,      setProjects]      = useState([]);
  const [summary,       setSummary]       = useState({ total: 0, completed: 0, inProgress: 0, onHold: 0 });
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [teamFilter,    setTeamFilter]    = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [fromDate,      setFromDate]      = useState("");
  const [toDate,        setToDate]        = useState("");
  const [teams,         setTeams]         = useState([]);
  const [managers,      setManagers]      = useState([]);
  const [dropdownOpen,  setDropdownOpen]  = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [deleteId,      setDeleteId]      = useState(null);
  const [userRole,      setUserRole]      = useState("");
  const [toast,         setToast]         = useState({ show: false, message: "", type: "success" });
  const [page,          setPage]          = useState(1);
  const limit = 12;

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());
    API.get("/teams").then(res => setTeams(res.data || [])).catch(() => {});
    API.get("/users/managers").then(res => setManagers(res.data || [])).catch(() => {});
  }, []);

  const fetchProjects = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/projects", {
        params: { page: p, limit, search, status: statusFilter, team: teamFilter, manager: managerFilter, from: fromDate, to: toDate },
      });
      setProjects(res.data.projects || []);
      setSummary(res.data.summary || { total: 0, completed: 0, inProgress: 0, onHold: 0 });
    } catch (err) {
      console.error("Project Fetch Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(1); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchProjects(1); }, 350);
    return () => clearTimeout(timer);
  }, [search, statusFilter, teamFilter, managerFilter, fromDate, toDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest(".dropdown-actions")) setDropdownOpen(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const resetFilters = () => {
    setSearch(""); setStatusFilter(""); setTeamFilter("");
    setManagerFilter(""); setFromDate(""); setToDate("");
    setPage(1); fetchProjects(1);
  };

  const confirmDelete = (id) => { setDeleteId(id); setModalOpen(true); setDropdownOpen(null); };

  const handleDelete = async () => {
    try {
      await API.delete(`/projects/${deleteId}`);
      setToast({ show: true, message: "Project purged successfully.", type: "success" });
      setModalOpen(false); setDeleteId(null); fetchProjects(page);
    } catch {
      setToast({ show: true, message: "Failed to purge project node.", type: "error" });
    }
  };

  const nextPage = () => setPage((p) => { const np = p + 1; fetchProjects(np); return np; });
  const prevPage = () => setPage((p) => { const np = Math.max(1, p - 1); fetchProjects(np); return np; });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl opacity-60" />
        
        <div className="max-w-[1600px] mx-auto relative z-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                <FiBriefcase className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Project Hub</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Initiative Matrix</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Operational Registry</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Initialize organizational initiatives, manage stakeholder alignments, and monitor target timelines.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {(userRole === "admin" || userRole === "manager") && (
                <button
                  onClick={() => navigate("/add-project")}
                  className="px-8 h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 shadow-2xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-800 active:scale-95 whitespace-nowrap"
                >
                  <FiPlus size={16} /> New Initiative
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-10 max-w-[1600px] mx-auto w-full px-4 md:px-6 pb-12 relative z-20">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Live Initiatives"    value={summary.total}       icon={<FiLayers />}      color="blue" />
          <StatCard label="Deployed Cycles"    value={summary.completed}   icon={<FiCheckCircle />} color="green" />
          <StatCard label="Live Operations"    value={summary.inProgress}  icon={<FiActivity />}    color="slate" />
          <StatCard label="Deferred Nodes"     value={summary.onHold}      icon={<FiClock />}       color="red" />
        </div>

        {/* Filter bar */}
        <div className="erp-card bg-white/80 backdrop-blur-md p-4 mb-6 border-slate-200/60 shadow-xl shadow-slate-200/20">
           <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-2 text-slate-400 group">
               <FiFilter size={14} className="group-hover:text-blue-500 transition-colors" />
               <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
             </div>
             
             <div className="relative flex-1 max-w-sm">
               <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
               <input
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="erp-input pl-9 h-11 w-full text-sm bg-white"
                 placeholder="Find objective..."
               />
             </div>

             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} 
               className="erp-input h-11 text-[10px] font-black uppercase tracking-widest w-40 bg-white">
               <option value="">Status: All</option>
               {["Completed", "In Progress", "On Hold"].map(s => <option key={s} value={s}>{s}</option>)}
             </select>

             <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} 
               className="erp-input h-11 text-[10px] font-black uppercase tracking-widest w-40 bg-white">
               <option value="">Unit: All</option>
               {teams.map((t) => <option key={t._id} value={t._id}>{t.team_name}</option>)}
             </select>

             <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} 
               className="erp-input h-11 text-[10px] font-black uppercase tracking-widest w-40 bg-white">
               <option value="">Steward: All</option>
               {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
             </select>

             {(search || statusFilter || teamFilter || managerFilter || fromDate || toDate) && (
               <button onClick={resetFilters} className="px-3 h-11 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5">
                 <FiX size={14} /> Reset
               </button>
             )}
           </div>
        </div>

        {/* Table/Initiative Grid */}
        <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiative Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocated Unit</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Steward</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"> Start Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Deadline</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle Stage</th>
                  <th className="px-8 py-5 text-right w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Objective Ledger...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="py-20 px-6">
                       <EmptyState 
                          type="error" 
                          title="Registry Access Denied" 
                          message="Strategic data retrieval failure. The initiative cluster is temporarily unreachable."
                          onRetry={() => fetchProjects(page)}
                        />
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 px-6">
                       <EmptyState 
                          type={search ? "search" : "empty"}
                          title={search ? "No Tactical Matches" : "Initiative Void"}
                          message={search ? `No initiatives match your tactical search for "${search}".` : "No operational initiatives have been registered in the system ledger."}
                       />
                    </td>
                  </tr>
                ) : (
                  projects.map((proj) => {
                    const status = proj.status || "Unknown";
                    const sc = statusColors[status] || statusColors.DEFAULT;
                    return (
                      <tr key={proj._id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{proj.project_name}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">UID: {proj.project_id || proj._id.slice(-6)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 bg-white shadow-xs">
                             {proj.team?.team_name || "N/A"}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-[10px] font-black shrink-0">
                               {proj.manager?.name?.charAt(0) || "?"}
                             </div>
                             <span className="text-xs font-bold text-slate-700 tracking-tight">{proj.manager?.name || "Unassigned"}</span>
                           </div>
                        </td>
                        
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                             <FiCalendar size={13} className="text-green-500/50" />
                               {proj.start_date ? new Date(proj.start_date).toLocaleDateString(undefined,{month:'short', day:'numeric', year:'numeric' })
                                     : "-"}
                           </div>
                        </td>

                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                             <FiCalendar size={13} className="text-blue-500/50" />
                             {proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '∞'}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-xs ${sc.bg} ${sc.text} ${sc.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                              {status}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right whitespace-nowrap dropdown-actions">
                           <div className="relative inline-block">
                             <button onClick={() => setDropdownOpen(dropdownOpen === proj._id ? null : proj._id)} 
                               className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-200 border border-transparent rounded-xl transition-all active:scale-90">
                               <FiMoreVertical size={18} />
                             </button>
                             <AnimatePresence>
                               {dropdownOpen === proj._id && (
                                 <motion.div 
                                   initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                   animate={{ opacity: 1, scale: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                   className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-30 overflow-hidden"
                                 >
                                    <button onClick={() => navigate(`/edit-project/${proj._id}`)} 
                                      className="flex items-center gap-3 w-full px-5 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-slate-50/50 transition-colors">
                                       <FiEdit size={14} className="text-blue-600" /> Modify Node
                                    </button>
                                    {userRole === "admin" && (
                                       <button onClick={() => confirmDelete(proj._id)} 
                                         className="flex items-center gap-3 w-full px-5 py-4 text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50/50 transition-colors border-t border-slate-100">
                                          <FiTrash2 size={14} /> Purge Object
                                       </button>
                                    )}
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Node {page}</span>
            <div className="flex gap-2">
              <button onClick={prevPage} disabled={page === 1} 
                className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95 shadow-sm">
                Previous
              </button>
              <button onClick={nextPage} disabled={projects.length < limit} 
                className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95 shadow-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/20"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 border border-rose-100">
                 <FiTrash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Terminate Node?</h3>
              <p className="text-sm text-slate-500 mb-10 leading-relaxed font-bold">
                 This action will permanently purge the project node and all associated historical datasets from the system ledger.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95">Abort</button>
                <button onClick={handleDelete} className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">Execute Purge</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />
    </div>
  );
};

// ── StatCard Sub-component (Same as Employees.jsx) ──────────────────────────
function StatCard({ label, value, icon, color }) {
  const styles = {
    blue:   "bg-blue-500/10 text-blue-600 border-blue-100",
    green:  "bg-emerald-500/10 text-emerald-600 border-emerald-100",
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

export default Projects;

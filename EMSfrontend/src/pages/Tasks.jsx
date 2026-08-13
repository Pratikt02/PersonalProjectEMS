import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import {
  FiMoreVertical, FiSearch, FiX, FiCalendar, FiBriefcase,
  FiEye, FiFilter, FiActivity, FiEdit, FiPlus, FiSend, FiTrash2,
  FiClock, FiCheckCircle, FiUsers, FiArrowLeft, FiAlertTriangle,
  FiShield, FiInfo, FiLayers
} from "react-icons/fi";

// ── Status badge styles ──────────────────────────────────────────────────────
const statusColors = {
  "Not Started": { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20", dot: "bg-slate-400" },
  "In Progress": { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", dot: "bg-blue-500" },
  "On Hold": { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20", dot: "bg-yellow-500" },
  "Completed": { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  "In Review": { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20", dot: "bg-purple-500" },
  "Reverted": { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", dot: "bg-red-500" },
  "Pending": { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20", dot: "bg-orange-500" },
};

const priorityColors = {
  Low: { bg: "bg-slate-100", text: "text-slate-600" },
  Medium: { bg: "bg-blue-100", text: "text-blue-700" },
  High: { bg: "bg-orange-100", text: "text-orange-700" },
  Critical: { bg: "bg-red-100", text: "text-red-700" },
};

// ────────────────────────────────────────────────────────────────────────────
const Tasks = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewTicket, setViewTicket] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTicketForReview, setSelectedTicketForReview] = useState(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedTicketForProgress, setSelectedTicketForProgress] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(false);
  const [user, setUser] = useState({ role: "", id: "" });

  const navigate = useNavigate();

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      );
      return JSON.parse(jsonPayload);
    } catch { return null; }
  };

  useEffect(() => {
    const initializeData = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      const decoded = decodeJWT(token);
      if (decoded) {
        setUser({ role: decoded.role?.toLowerCase() || "", id: decoded.id || decoded._id });
        fetchTickets();
      } else {
        setToast({ show: true, message: "Invalid session. Please log in again.", type: "error" });
        navigate("/login");
      }
    };
    initializeData();
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await api.get("/tasks");
      setTickets(response.data);
      setFilteredTickets(response.data);
    } catch (err) {
      setError(true);
      setToast({ show: true, message: "Failed to load tickets", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) { setFilteredTickets(tickets); return; }
    const sl = search.toLowerCase();
    setFilteredTickets(tickets.filter((t) =>
      t.title?.toLowerCase().includes(sl) ||
      String(t.taskId || "").toLowerCase().includes(sl) ||
      (Array.isArray(t.assignedTo) && t.assignedTo.some((a) => a.name?.toLowerCase().includes(sl)))
    ));
  }, [search, tickets]);

  const confirmDelete = (id) => { setDeleteId(id); setModalOpen(true); setDropdownOpen(null); };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${deleteId}`);
      fetchTickets();
      setModalOpen(false);
      setToast({ show: true, message: "Ticket deleted successfully", type: "success" });
    } catch (err) {
      setToast({ show: true, message: "Failed to delete ticket", type: "error" });
    }
  };

  const handleAcceptTask = (ticket) => { setSelectedTicketForProgress(ticket); setProgressModalOpen(true); setDropdownOpen(null); };

  const confirmAcceptTask = async () => {
    try {
      await api.put(`/tasks/${selectedTicketForProgress._id}/accept`);
      fetchTickets();
      setProgressModalOpen(false);
      setSelectedTicketForProgress(null);
      setToast({ show: true, message: "Task accepted. Status is now 'In Progress'", type: "success" });
    } catch (err) {
      setToast({ show: true, message: "Failed to accept task", type: "error" });
    }
  };

  const handleSubmitWork = async (ticketToSubmit) => {
    try {
      await api.put(`/tasks/${ticketToSubmit._id}/submit`);
      fetchTickets();
      if (viewModalOpen && viewTicket?._id === ticketToSubmit._id) setViewModalOpen(false);
      setToast({ show: true, message: "Work submitted for review", type: "success" });
    } catch (err) {
      setToast({ show: true, message: "Failed to submit work", type: "error" });
    }
  };

  const handleReviewAction = async (action) => {
    try {
      await api.put(`/tasks/${selectedTicketForReview._id}/review`, { action });
      fetchTickets();
      setReviewModalOpen(false);
      setSelectedTicketForReview(null);
      setToast({ show: true, message: action === "approve" ? "Task approved" : "Task reverted", type: "success" });
    } catch (err) {
      setToast({ show: true, message: "Failed to update task", type: "error" });
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { text: "", cls: "" };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(deadline); d.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: "Overdue", cls: "bg-red-500/10 text-red-500 border-red-500/20" };
    if (diffDays <= 3) return { text: "Due Soon", cls: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
    return { text: "", cls: "" };
  };

  const isCreator = (t) => t.createdBy && (t.createdBy._id === user.id || t.createdBy === user.id);
  const isReviewer = (t) => Array.isArray(t.reviewers) && t.reviewers.some((r) => (r._id === user.id || r === user.id));
  const isAssignee = (t) => Array.isArray(t.assignedTo) && t.assignedTo.some((a) => (a._id === user.id || a === user.id));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalTasks = filteredTickets.length;
  const overdueTasks = filteredTickets.filter((t) => t.dueDate && new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0)).length;
  const inProgressTasks = filteredTickets.filter((t) => t.status === "In Progress").length;
  const completedTasks = filteredTickets.filter((t) => t.status === "Completed").length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-indigo-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-[1600px] mx-auto relative z-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                <FiLayers className="text-indigo-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Lifecycle Hub</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Agile Workflow Matrix</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Workload Management</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Allocate resources, monitor progress, and coordinate inter-departmental deliverables with precision.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative group">
                 <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                 <input
                  type="text"
                  placeholder="Search objective..."
                  className="bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full md:w-64 placeholder:text-slate-400 shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              
              {(user.role === "admin" || user.role === "manager") && (
                <button
                  onClick={() => navigate("/add-task")}
                  className="px-8 h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 shadow-2xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-800 active:scale-95 whitespace-nowrap"
                >
                  <FiPlus size={16} /> New Deliverable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-10 max-w-[1600px] mx-auto w-full px-4 md:px-6 pb-12 relative z-20">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="System Load" value={totalTasks} icon={<FiActivity />} color="indigo" />
          <StatCard label="Critical Risk" value={overdueTasks} icon={<FiAlertTriangle />} color="red" />
          <StatCard label="Active Cycle" value={inProgressTasks} icon={<FiClock />} color="blue" />
          <StatCard label="Closed Loops" value={completedTasks} icon={<FiCheckCircle />} color="emerald" />
        </div>

        {/* Task Grid/Table */}
            <div className="erp-card bg-white/80 backdrop-blur-md border-none ring-1 ring-slate-200/50 shadow-2xl overflow-visible">          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Workload Matrix...</p>
             </div>
          ) : error ? (
            <div className="py-20">
              <EmptyState 
                type="error" 
                title="Workflow Matrix Sync Error" 
                message="Connectivity to the central deliverable node has been interrupted."
                onRetry={fetchTickets}
              />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-20">
              <EmptyState 
                type={search ? "search" : "empty"}
                title={search ? "No Objective Matches" : "Queue Empty"}
                message={search ? `No deliverables found matching "${search}" in the system.` : "The organizational workload matrix is currently clear."}
              />
            </div>
          ) : (
            <div className="relative overflow-visible">
              <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <th className="px-8 py-5">Objective Identifier</th>
                    <th className="px-8 py-5">Org Unit</th>
                    <th className="px-8 py-5">Resourced Assets</th>
                    <th className="px-8 py-5">Target Lifecycle</th>
                    <th className="px-8 py-5">Node Status</th>
                    <th className="px-8 py-5 text-right w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 overflow-visible">
                  {filteredTickets.map((ticket) => {
                    const ds = getDeadlineStatus(ticket.dueDate);
                    const displayStatus = ticket.status || "Not Started";
                    const sc = statusColors[displayStatus];
                    return (
                      <tr key={ticket._id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                        <td className="px-8 py-6 cursor-pointer" onClick={() => { setViewTicket(ticket); setViewModalOpen(true); }}>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{ticket.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 opacity-60 tracking-tighter">REF: {ticket.taskId}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest">{ticket.team?.team_name || "GLOBAL"}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex -space-x-2 overflow-hidden">
                            {Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0 ? (
                              ticket.assignedTo.slice(0, 4).map((emp, idx) => (
                                <div key={idx} className="flex h-8 w-8 rounded-lg ring-2 ring-white bg-slate-100 text-slate-500 items-center justify-center text-[10px] font-bold uppercase transition-transform hover:scale-110 hover:z-10 shadow-sm first:ml-0 overflow-hidden border border-slate-200" title={emp.name}>
                                  {emp.name.charAt(0)}
                                </div>
                              ))
                            ) : <span className="text-[10px] text-slate-300 font-bold uppercase">Unallocated</span>}
                            {ticket.assignedTo?.length > 4 && (
                              <div className="flex h-8 w-8 rounded-lg ring-2 ring-white bg-indigo-50 text-indigo-600 items-center justify-center text-[10px] font-bold shadow-sm border border-indigo-100 italic">
                                +{ticket.assignedTo.length - 4}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-700">
                                 <FiCalendar size={12} className="text-slate-300" />
                                 {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '∞'}
                              </div>
                              {ds.text && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest self-start ${ds.cls}`}>{ds.text}</span>}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-xs transition-all group-hover:shadow-md ${sc?.bg} ${sc?.text} ${sc?.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc?.dot} animate-pulse`} />
                              {displayStatus}
                           </span>
                        </td>
                         <td className="relative px-8 py-6 text-right whitespace-nowrap overflow-visible">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                const rect = e.currentTarget.getBoundingClientRect();

                                setMenuPosition({
                                  x: rect.right - 260,
                                  y: rect.bottom + 8,
                                });

                                setDropdownOpen(
                                  dropdownOpen === ticket._id ? null : ticket._id
                                );
                              }}
                               className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
                            >
                              <FiMoreVertical size={16} />
                            </button>
                            {/* {dropdownOpen === ticket._id && (
                              <div
                                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl z-[99999]"
                              >
                                <button className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all"
                                  onClick={() => { setViewTicket(ticket); setViewModalOpen(true); setDropdownOpen(null); }}>
                                   <FiEye size={14} className="text-indigo-600" /> View Metrics
                                </button>
                                {isCreator(ticket) && (
                                   <button className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all"
                                     onClick={() => { navigate(`/edit-task/${ticket._id}`); setDropdownOpen(null); }}>
                                      <FiEdit size={14} className="text-blue-500" /> Modify Node
                                   </button>
                                )}
                                {isCreator(ticket) && (
                                   <button className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all"
                                     onClick={() => confirmDelete(ticket._id)}>
                                      <FiTrash2 size={14} /> Purge Object
                                      
                                   </button>
                                )}
                             </div>
                             )} */}
                            </div>  
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      </main>
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setDropdownOpen(null)}
        >
          <div
            className="absolute w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const ticket = filteredTickets.find(
                (t) => t._id === dropdownOpen
              );

              if (!ticket) return null;

              return (
                <>
                  <button
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                    onClick={() => {
                      setViewTicket(ticket);
                      setViewModalOpen(true);
                      setDropdownOpen(null);
                    }}
                  >
                    <FiEye size={14} className="text-indigo-600" />
                    View Metrics
                  </button>

                  {isCreator(ticket) && (
                    <>
                      <button
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                        onClick={() => {
                          navigate(`/edit-task/${ticket._id}`);
                          setDropdownOpen(null);
                        }}
                      >
                        <FiEdit size={14} className="text-blue-500" />
                        Modify Node
                      </button>

                      <button
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50"
                        onClick={() => confirmDelete(ticket._id)}
                      >
                        <FiTrash2 size={14} />
                        Purge Object
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      <Footer />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />

      {/* ── View Details Modal ── */}
      {viewModalOpen && viewTicket && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 backdrop-blur-xl">
           <div className="absolute inset-0 bg-slate-900/40" onClick={() => setViewModalOpen(false)} />
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
              <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                       <FiActivity size={20} />
                    </div>
                    <div>
                       <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">{viewTicket.title}</h2>
                       <p className="text-[9px] font-mono text-slate-400 uppercase">SYS-NODE: {viewTicket.taskId}</p>
                    </div>
                 </div>
                 <button onClick={() => setViewModalOpen(false)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 active:scale-95">
                    <FiX size={18} />
                 </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                 <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 space-y-6 overflow-y-auto">
                    {[
                      { label: 'Operational Level', value: viewTicket.priority, color: priorityColors[viewTicket.priority]?.text },
                      { label: 'Current Phase', value: viewTicket.status, color: statusColors[viewTicket.status]?.text },
                      { label: 'Target Due', value: viewTicket.dueDate ? new Date(viewTicket.dueDate).toLocaleDateString() : 'N/A' },
                      { label: 'Owner Module', value: viewTicket.team?.team_name || 'Global' }
                    ].map(item => (
                      <div key={item.label}>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                         <p className={`text-xs font-black ${item.color || 'text-slate-800'} uppercase tracking-tighter`}>{item.value}</p>
                      </div>
                    ))}
                 </div>
                 <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-white">
                    <section>
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Functional Requirements</h3>
                       <div className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 ring-4 ring-slate-100/50">
                          {viewTicket.description || "No criteria defined."}
                       </div>
                    </section>
                    
                    <section>
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Allocated Personnel</h3>
                       <div className="flex flex-wrap gap-3">
                          {viewTicket.assignedTo?.map((emp, i) => (
                             <div key={i} className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] font-black">{emp.name.charAt(0)}</div>
                                <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">{emp.name}</span>
                             </div>
                          ))}
                       </div>
                    </section>

                    {/* Actions in Modal */}
                    <div className="pt-4 flex gap-3">
                       {user.role === "employee" && isAssignee(viewTicket) && viewTicket.status === "In Progress" && (
                          <button onClick={() => handleSubmitWork(viewTicket)}
                            className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-slate-300/20 transition-all flex items-center justify-center gap-2 group">
                             <FiSend size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Commit Work to Review
                          </button>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="absolute inset-0 bg-slate-900/40" onClick={() => setModalOpen(false)} />
           <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center relative z-10 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"><FiTrash2 size={28} /></div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Purge Object?</h3>
              <p className="text-xs text-slate-500 font-medium mb-8">This will permanently delete the task node and all historical traces in the operational ledger.</p>
              <div className="flex gap-3">
                 <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                 <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all">Yes, Purge</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${colors[color] || colors.indigo} border border-current/10 shadow-sm`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
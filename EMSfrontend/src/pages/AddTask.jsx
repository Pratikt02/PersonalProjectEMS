import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiArrowLeft, FiBriefcase, FiCalendar, FiUser, FiLayers, FiUsers, 
  FiCheckCircle, FiClock, FiAlertCircle, FiTag, FiFileText, 
  FiUpload, FiTrash2, FiSave, FiChevronDown, FiActivity, FiTarget, FiPlus, FiSearch, FiCheck, FiX, FiPaperclip, FiBell
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const AddTask = () => {
  const [ticket, setTicket] = useState({
    title: "", description: "", assignedTo: [], team: "",
    startDate: "", dueDate: "", estimatedHours: "",
    priority: "Medium", category: "Development",
    progress: 0, tags: "", notes: "", notifyAssignee: true,
  });
  const [employees,          setEmployees]          = useState([]);
  const [teams,              setTeams]              = useState([]);
  const [filteredEmployees,  setFilteredEmployees]  = useState([]);
  const [attachments,        setAttachments]        = useState([]);
  const [uploading,          setUploading]          = useState(false);
  const [toast,              setToast]              = useState({ show: false, message: "", type: "success" });
  const [currentUser,        setCurrentUser]        = useState({ id: "", name: "", employeeId: "" });
  const [userLoading,        setUserLoading]        = useState(true);
  const [viewTeam,           setViewTeam]           = useState(null);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const token       = localStorage.getItem("token");

  // ── JWT helper ───────────────────────────────────────────────────────────────
  const decodeJWT = (t) => {
    try {
      const b64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(atob(b64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
    } catch { return null; }
  };

  const fetchUserById = async (id) => {
    try { return (await api.get(`/users/${id}`)).data; } catch { return null; }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsAssigneeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!token) { setCurrentUser({ id: "no-token", name: "Guest", employeeId: "N/A" }); setUserLoading(false); return; }
      try {
        const decoded = decodeJWT(token);
        if (!decoded?.id) throw new Error("Invalid token");
        const userData = await fetchUserById(decoded.id || decoded._id);
        if (userData) {
          const u = { id: userData._id, name: userData.name, employeeId: userData.employeeId };
          setCurrentUser(u);
          localStorage.setItem("id", u.id);
          localStorage.setItem("name", u.name);
          localStorage.setItem("employeeId", u.employeeId);
        } else {
          setCurrentUser({ id: "not-found", name: "User Not Found", employeeId: "N/A" });
        }
      } catch { setCurrentUser({ id: "error", name: "Error Loading User", employeeId: "N/A" }); }
      finally  { setUserLoading(false); }

      try {
        const [empRes, teamRes] = await Promise.all([api.get("/users"), api.get("/teams")]);
        setEmployees(empRes.data || []);
        setFilteredEmployees(empRes.data || []);
        setTeams(teamRes.data || []);
      } catch { /* non-blocking */ }
    };
    init();
  }, [token]);

  // ── Filter employees by team ─────────────────────────────────────────────────
  useEffect(() => {
    if (ticket.team && teams.length > 0 && employees.length > 0) {
      const sel = teams.find((t) => t._id === ticket.team);
      if (sel?.members) {
        const memberIds = sel.members
          .map((m) => (m.employee && typeof m.employee === "object" ? m.employee._id || m.employee : m.employee))
          .filter(Boolean);
        if (sel.team_leader) {
          const lid = typeof sel.team_leader === "object" ? sel.team_leader._id : sel.team_leader;
          if (lid && !memberIds.includes(lid)) memberIds.push(lid);
        }
        setFilteredEmployees(employees.filter((e) => memberIds.some((id) => id.toString() === e._id.toString())));
      } else setFilteredEmployees(employees);
    } else setFilteredEmployees(employees);
    setTicket((prev) => ({ ...prev, assignedTo: [] }));
  }, [ticket.team, teams, employees]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTicket((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleEmployee = (id) => {
    setTicket((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter((x) => x !== id)
        : [...prev.assignedTo, id],
    }));
  };

  const handleFileChange = (e) => setAttachments(e.target.files);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser.id || currentUser.id === "no-token" || currentUser.id === "error") {
      setToast({ show: true, message: "Secure context missing. Re-authentication required.", type: "error" }); return;
    }
    if (ticket.assignedTo.length === 0) {
      setToast({ show: true, message: "Personnel allocation required for ticket initialization.", type: "error" }); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      Object.keys(ticket).forEach((k) => fd.append(k, k === "assignedTo" ? JSON.stringify(ticket[k]) : ticket[k]));
      fd.append("status", "Not Started");
      fd.append("createdBy", currentUser.id);
      if (attachments.length > 0) Array.from(attachments).forEach((f) => fd.append("attachments", f));
      await api.post("/tasks", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setToast({ show: true, message: "New operational objective initialized successfully!", type: "success" });
      setTimeout(() => navigate("/tasks"), 1500);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Strategic initialization failed.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const filteredAvailableAssignees = filteredEmployees.filter(u => 
    u.name?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full shadow-2xl" 
          />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">Securing Execution Context...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight overflow-x-hidden">
      
      {/* 🔹 Premium Header Area */}
      <div className="bg-white pt-16 pb-32 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-600/5 via-blue-400/5 to-transparent opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-[1500px] mx-auto relative z-10">
          <Link to="/tasks" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all mb-8 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group active:scale-95">
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Registry
          </Link>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/20 relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <FiPlus size={36} className="relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-lg">Operational Lab</span>
                  <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Objective Commissioning</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">New Task</h1>
                <p className="text-slate-500 text-sm font-bold opacity-70">Initialize a new work item and allocate tactical resources.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-20 px-4 md:px-6 pb-24 z-20">
        <div className="max-w-[1500px] mx-auto">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Core Ticket Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="erp-card-premium p-0 overflow-hidden border-white/40 shadow-2xl">
                <div className="p-10 border-b border-slate-100 bg-linear-to-b from-white to-slate-50/30">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                      <FiFileText size={16} />
                    </div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Operational Manifest</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Ticket Subject</label>
                      <div className="relative">
                        <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          name="title"
                          className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-blue-500/5 transition-all"
                          placeholder="Brief objective title..."
                          value={ticket.title}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Context & Technical Specifications</label>
                      <textarea
                        name="description"
                        className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-slate-100/30 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none font-medium text-slate-700 placeholder-slate-300 shadow-inner"
                        placeholder="Define full technical context and primary operational constraints..."
                        rows={8}
                        value={ticket.description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-white">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
                        <FiUsers size={16} />
                      </div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resource Allocation</h3>
                    </div>

                    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                      <button 
                        type="button"
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        className="w-full sm:w-auto h-11 px-6 rounded-xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-between gap-3 bg-white shadow-xs active:scale-95"
                      >
                        Allocate Assets <FiPlus className={`transition-transform duration-300 ${isAssigneeDropdownOpen ? "rotate-45" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {isAssigneeDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-full sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                          >
                            <div className="p-4 bg-slate-50 border-b border-slate-100 relative">
                              <FiSearch className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300" />
                              <input 
                                type="text" 
                                autoFocus
                                placeholder="Find Personnel..."
                                className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                value={assigneeSearch}
                                onChange={(e) => setAssigneeSearch(e.target.value)}
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                              {filteredAvailableAssignees.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50/50 rounded-xl m-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching assets</p>
                                </div>
                              ) : (
                                filteredAvailableAssignees.map((u) => {
                                  const isIncluded = ticket.assignedTo.includes(u._id);
                                  return (
                                    <button
                                      key={u._id}
                                      type="button"
                                      onClick={() => toggleEmployee(u._id)}
                                      className={`w-full p-3 rounded-xl mb-1 flex items-center justify-between group transition-all ${
                                        isIncluded ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${isIncluded ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                                          {u.name?.charAt(0)}
                                        </div>
                                        <div className="text-left overflow-hidden">
                                          <p className="text-[10px] font-black uppercase tracking-tight truncate">{u.name}</p>
                                          <p className={`text-[8px] font-bold uppercase opacity-60 ${isIncluded ? "text-blue-100" : "text-slate-400"}`}>{u.employeeId}</p>
                                        </div>
                                      </div>
                                      {isIncluded && <FiCheck size={14} />}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="bg-slate-100/30 rounded-4xl p-8 border-2 border-dashed border-slate-100 min-h-[180px] transition-colors hover:border-slate-200">
                    <AnimatePresence mode="popLayout">
                      {ticket.assignedTo.length === 0 ? (
                        <motion.div 
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="py-12 flex flex-col items-center justify-center text-center opacity-40 group h-full"
                        >
                          <FiUsers size={40} className="text-slate-200 group-hover:text-blue-200 transition-colors duration-500" />
                          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No Personnel Allocated</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Configure operatives via control above.</p>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                          {employees.filter(u => ticket.assignedTo.includes(u._id)).map((u) => (
                            <motion.div 
                              layout
                              key={u._id} 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 transition-all"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="shrink-0 w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] border border-blue-100/50">
                                  {u.name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{u.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleEmployee(u._id)}
                                className="shrink-0 w-8 h-8 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 active:scale-90"
                              >
                                <FiX size={16} />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Strategic Parameters */}
            <div className="space-y-8">
              <div className="erp-card-premium p-8 space-y-8 border-white shadow-2xl shadow-slate-200/50 overflow-visible">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                    <FiActivity size={16} />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Meta</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Tactical Division</label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <select name="team" value={ticket.team} onChange={handleChange}
                        className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-blue-500/5 transition-all bg-white appearance-none cursor-pointer">
                        <option value="">Choose a team...</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.team_name}</option>)}
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                      <select name="priority" value={ticket.priority} onChange={handleChange}
                        className="erp-input px-4 shadow-xs bg-white text-xs font-bold uppercase tracking-widest">
                        {["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                      <select name="category" value={ticket.category} onChange={handleChange}
                        className="erp-input px-4 shadow-xs bg-white text-xs font-bold uppercase tracking-widest">
                        {["Development", "Design", "Testing", "Documentation", "Research"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Temporal Deadline</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <input type="date" name="dueDate" value={ticket.dueDate} onChange={handleChange}
                        className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Estimated Velocity (Hrs)</label>
                    <div className="relative">
                      <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <input type="number" name="estimatedHours" value={ticket.estimatedHours} onChange={handleChange}
                        className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="0.0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="erp-card-premium p-8 space-y-8 border-white shadow-2xl shadow-slate-200/50">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                    <FiUpload size={16} />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Deliverables</h3>
                </div>

                <div className="space-y-6">
                  <div className="relative p-10 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-center group">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      <FiUpload className="text-blue-600" size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provision Digital Assets</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Multi-format support enabled</p>
                    <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <input type="checkbox" name="notifyAssignee" checked={ticket.notifyAssignee} onChange={handleChange}
                      className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/20" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Operational Broadcast</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Notify allocated assets of initialization</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={uploading}
                    className={`w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${
                      uploading 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30"
                    }`}
                  >
                    {!uploading && <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:rotate-12 group-hover:-translate-x-full transition-transform duration-1000" />}
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiBell size={18} /> Commission Objective
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default AddTask;
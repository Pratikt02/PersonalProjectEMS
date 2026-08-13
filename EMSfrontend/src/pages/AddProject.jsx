import { FiChevronDown } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiArrowLeft, FiBriefcase, FiUser, FiPlus, FiAlertCircle, 
  FiCalendar, FiActivity, FiLayers, FiInfo, FiTag, FiClock
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const AddProject = () => {
  const [teams,       setTeams]       = useState([]);
  const [managers,    setManagers]    = useState([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId,      setTeamId]      = useState("");
  const [managerId,   setManagerId]   = useState("");
  const [status,      setStatus]      = useState("In Progress");
  const [startDate, setStartDate] = useState("");
  const [deadline,    setDeadline]    = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [tRes, mRes] = await Promise.all([API.get("/teams"), API.get("/users/managers")]);
        setTeams(tRes.data || []);
        setManagers(mRes.data || []);
      } catch { setError("Failed to hydrate strategic registries."); }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!projectName.trim()) { setError("Initiative descriptor is required."); return; }
    if (!managerId)           { setError("Operational steward must be selected."); return; }
    
    setLoading(true);
    try {
    await API.post("/projects", {
    project_name: projectName,
    description,
    team_id: teamId,
    manager_id: managerId,
    status,
    start_date: startDate ? new Date(startDate).toISOString() : null,
    deadline: deadline ? new Date(deadline).toISOString() : null,
          });

          
      setToast({ show: true, message: "Strategic initiative successfully initialized!", type: "success" });
      setTimeout(() => navigate("/projects"), 2000);
    } catch { setError("Failed to initialize initiative node."); }
    finally  { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-24 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl opacity-60" />
        
        <div className="max-w-4xl mx-auto relative z-10 w-full">
          <Link to="/projects" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all mb-8 group active:scale-95">
            <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Strategy Hub
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                <FiBriefcase className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Strategy Hub</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Initiative Creation</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Create Initiative</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Define the scope and objectives for your next major enterprise initiative.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-12 max-w-4xl mx-auto w-full px-4 md:px-6 pb-12 z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-200/20 border border-white p-1 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-8 md:p-10 space-y-10">
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 text-[11px] font-black uppercase tracking-widest"
                  >
                    <FiAlertCircle size={16} className="shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section 1: Project Details */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <FiLayers size={16} />
                  </div>
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Scope & Identity</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initiative Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="erp-input w-full h-12 bg-white"
                      placeholder="e.g. Q3 Global Transformation"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="erp-input w-full py-4 bg-white resize-none"
                      placeholder="Outline core objectives and success metrics..."
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Assignment & Timeline */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                    <FiUser size={16} />
                  </div>
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Ownership & Timeline</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Steward <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        className="erp-input w-full h-12 bg-white appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select Steward</option>
                        {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Unit</label>
                    <div className="relative">
                      <select
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        className="erp-input w-full h-12 bg-white appearance-none cursor-pointer"
                      >
                        <option value="">De-allocated</option>
                        {teams.map((t) => <option key={t._id} value={t._id}>{t.team_name}</option>)}
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Stage</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="erp-input w-full h-12 bg-white appearance-none cursor-pointer"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>


                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <FiCalendar size={12} className="text-blue-400" /> Start Date
                     </label>

                          <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="erp-input w-full h-12 bg-white cursor-pointer"/>
                  </div>


                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <FiClock size={12} className="text-blue-400" /> Target Deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="erp-input w-full h-12 bg-white cursor-pointer"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Final Actions */}
            <div className="p-8 md:p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-4 items-center">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="w-full md:w-auto px-8 h-12 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
              >
                Abort Creation
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 translate-y-0 hover:-translate-y-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <FiPlus size={18} />
                    <span>Initialize Initiative</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />
    </div>
  );
};

export default AddProject;

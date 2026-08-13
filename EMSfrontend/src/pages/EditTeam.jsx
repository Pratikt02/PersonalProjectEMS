import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api/api";
import { 
  FiUsers, FiShield, FiX, FiChevronDown, 
  FiBriefcase, FiUserCheck, FiArrowLeft, FiActivity, FiLayers, FiInfo, FiSave, FiSearch, FiCheck
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [teamName, setTeamName] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, teamRes] = await Promise.all([
          api.get("/users"),
          api.get(`/teams/${id}`),
        ]);
        setAllUsers(usersRes.data || []);
        const teamData = teamRes.data;
        setTeamName(teamData.team_name || "");
        const leaderId = typeof teamData.team_leader === "object" ? teamData.team_leader._id : teamData.team_leader;
        setTeamLeader(leaderId || "");
        const memberIds = (teamData.members || []).map((m) => m.employee?._id || m.employee).filter(Boolean);
        setMembers(memberIds);
      } catch (err) {
        console.error(err);
        setToast({ show: true, message: "System failure during tactical hydration.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (teamLeader && members.includes(teamLeader)) {
      setMembers(prev => prev.filter(mid => mid !== teamLeader));
    }
  }, [teamLeader]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsMemberDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMemberToggle = (id) => {
    setMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName || !teamLeader) {
      setToast({ show: true, message: "Incomplete configuration. Key parameters missing.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/teams/${id}`, {
        team_name: teamName,
        team_leader_id: teamLeader,
        member_ids: members,
      });
      setToast({ show: true, message: "Tactical unit synchronized with central ledger.", type: "success" });
      setTimeout(() => navigate("/team"), 1500);
    } catch (err) {
      setToast({ show: true, message: "Synchronization failure in the tactical hub.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAvailableMembers = allUsers
    .filter(u => u._id !== teamLeader)
    .filter(u => u.name?.toLowerCase().includes(memberSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full shadow-2xl" 
          />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">Hydrating Tactical Context...</p>
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
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link to="/team" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all mb-8 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group active:scale-95">
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Matrix
          </Link>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/20 relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <FiLayers size={36} className="relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-blue-50 px-3 py-1 rounded-lg">Tactical Configurator</span>
                  <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Unit ID: {id.slice(-8).toUpperCase()}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Modify Collective</h1>
                <p className="text-slate-500 text-sm font-bold opacity-70">Adjusting parameters for unit: <span className="text-blue-600">{teamName}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-20 px-4 md:px-8 pb-24 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="erp-card-premium p-0 overflow-hidden border-white/40 shadow-2xl">
            
            {/* Form Section: Core Identity */}
            <div className="p-10 border-b border-slate-100 bg-linear-to-b from-white to-slate-50/30">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <FiInfo size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Identity Parameters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Tactical Designation</label>
                  <div className="relative">
                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-blue-500/5 transition-all"
                      placeholder="e.g. Strike Force Omega"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Assigned Leadership</label>
                  <div className="relative">
                    <FiUserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <select
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-blue-500/5 transition-all bg-white appearance-none cursor-pointer"
                      value={teamLeader}
                      onChange={(e) => setTeamLeader(e.target.value)}
                      required
                    >
                      <option value="">Select Command Officer</option>
                      {allUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section: Collective Composition */}
            <div className="p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                    <FiUsers size={16} />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Collective Composition ({members.length})</h3>
                </div>
                
                <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                    className="w-full sm:w-auto h-11 px-6 rounded-xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-between gap-3 bg-white shadow-xs active:scale-95"
                  >
                    Modify Operatives <FiPlus className={`transition-transform duration-300 ${isMemberDropdownOpen ? "rotate-45" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isMemberDropdownOpen && (
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
                            placeholder="Find Assets..."
                            className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                          {filteredAvailableMembers.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50/50 rounded-xl m-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching results</p>
                            </div>
                          ) : (
                            filteredAvailableMembers.map((u) => {
                              const isIncluded = members.includes(u._id);
                              return (
                                <button
                                  key={u._id}
                                  type="button"
                                  onClick={() => handleMemberToggle(u._id)}
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
                        <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{members.length} Linked Assets</span>
                          <button onClick={() => setIsMemberDropdownOpen(false)} className="text-blue-600 hover:underline">Synchronize</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="bg-slate-100/30 rounded-4xl p-8 border-2 border-dashed border-slate-100 min-h-[220px] transition-colors hover:border-slate-200">
                <AnimatePresence mode="popLayout">
                  {members.length === 0 ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 flex flex-col items-center justify-center text-center opacity-40 group h-full"
                    >
                      <FiUsers size={40} className="text-slate-200 group-hover:text-blue-200 transition-colors duration-500" />
                      <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collective Empty</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Initialize operatives via the control above.</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {allUsers.filter(u => members.includes(u._id)).map((u) => (
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
                            onClick={() => handleMemberToggle(u._id)}
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

            {/* Form Footer */}
            <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-200">
                <FiShield className="text-blue-500" /> End-to-End Encrypted Coordination
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                >
                  Abort Sync
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 md:flex-none h-14 px-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${
                    submitting 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30"
                  }`}
                >
                  {!submitting && <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:-translate-x-full transition-transform duration-1000 rotate-12" />}
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave size={18} /> Synchronize Collective
                    </>
                  )}
                </button>
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

export default EditTeam;

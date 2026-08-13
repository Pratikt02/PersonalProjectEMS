import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiPlusCircle, FiUsers, FiShield, FiX, FiChevronDown, 
  FiBriefcase, FiUserCheck, FiArrowLeft, FiPlus, FiCheck, FiSearch
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const AddTeam = () => {
  const [teamName, setTeamName] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setAllUsers(res.data || []);
      } catch (err) {
        setToast({ show: true, message: "Failed to hydrate personnel registry", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (teamLeader && members.includes(teamLeader)) {
      setMembers(prev => prev.filter(id => id !== teamLeader));
    }
  }, [teamLeader, members]);

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
      setToast({ show: true, message: "Team Identity and Leadership are mandatory.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/teams", {
        team_name: teamName,
        team_leader_id: teamLeader,
        member_ids: members,
      });
      setToast({ show: true, message: "Bespoke tactical team successfully commissioned!", type: "success" });
      setTimeout(() => navigate("/team"), 1500);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to finalize commissioning.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const availableMembers = allUsers
    .filter(u => u._id !== teamLeader)
    .filter(u => u.name?.toLowerCase().includes(memberSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Hydrating Personnel Registry...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-24 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-violet-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl opacity-60" />
        
        <div className="max-w-4xl mx-auto relative z-10 w-full">
          <Link to="/team" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-violet-600 transition-all mb-8 group active:scale-95">
            <FiArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Tactical Hub
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                <FiUsers className="text-violet-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em]">Operational Lab</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Team Commissioning</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Initialize Unit</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Define the command structure and allocate personnel for a new tactical business unit.
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
          className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-violet-200/20 border border-white p-1 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-8 md:p-10 space-y-10">
              
              {/* 1. Core Identity */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100">
                    <FiBriefcase size={16} />
                  </div>
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Tactical Unit Identity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="erp-input w-full h-12 bg-white"
                      placeholder="e.g. Core Engineering Alpha"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <FiShield size={12} className="text-violet-400" /> Primary Tactical Lead
                    </label>
                    <div className="relative">
                      <select
                        value={teamLeader}
                        onChange={(e) => setTeamLeader(e.target.value)}
                        className="erp-input w-full h-12 bg-white appearance-none cursor-pointer"
                        required
                      >
                        <option value="">De-selected</option>
                        {allUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role?.toUpperCase()})</option>)}
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Personnel Allocation */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                    <FiUserCheck size={16} />
                  </div>
                  <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Resource Allocation</h2>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Tactical Personnel ({members.length})
                  </label>
                  
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                      className="w-full h-14 px-5 text-left rounded-2xl border border-slate-200 bg-white hover:border-violet-500 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <FiUsers className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                        <span className="text-sm font-bold text-slate-700">
                          {members.length === 0 ? "Provision Staff Resources" : `${members.length} Personnel Provisioned`}
                        </span>
                      </div>
                      <FiChevronDown className={`text-slate-400 transition-transform ${isMemberDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isMemberDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.98 }}
                          className="absolute z-50 w-full mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                        >
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                type="text" 
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Search personnel registry..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                              />
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto erp-scrollbar p-2">
                            {availableMembers.length > 0 ? (
                              availableMembers.map(u => {
                                const isSelected = members.includes(u._id);
                                return (
                                  <label key={u._id} className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${isSelected ? "bg-violet-50" : "hover:bg-slate-50"}`}>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-violet-600 border-violet-600" : "border-slate-300 group-hover:border-violet-400"}`}>
                                      {isSelected && <FiCheck className="text-white text-[10px] stroke-[4px]" />}
                                      <input type="checkbox" className="hidden" checked={isSelected} onChange={() => handleMemberToggle(u._id)} />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`text-xs font-black uppercase tracking-tight transition-colors ${isSelected ? "text-violet-900" : "text-slate-700"}`}>
                                        {u.name}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.role}</span>
                                    </div>
                                  </label>
                                );
                              })
                            ) : (
                              <div className="py-10 text-center flex flex-col items-center gap-2 opacity-40">
                                <FiInfo size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Null Registry Result</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Chips for selected members */}
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {members.map(id => {
                      const user = allUsers.find(u => u._id === id);
                      return (
                        <motion.button
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          type="button"
                          key={id}
                          onClick={() => handleMemberToggle(id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full border border-violet-100 text-[10px] font-black uppercase tracking-widest hover:bg-violet-100 transition-colors shadow-sm"
                        >
                          {user?.name}
                          <FiX size={12} className="opacity-50 hover:opacity-100" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Final Actions */}
            <div className="p-8 md:p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-4 items-center">
              <button
                type="button"
                onClick={() => navigate("/team")}
                className="w-full md:w-auto px-8 h-12 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
              >
                Abort Commissioning
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full md:w-auto px-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-2xl shadow-violet-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 translate-y-0 hover:-translate-y-1"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Syncing Hub...</span>
                  </>
                ) : (
                  <>
                    <FiPlusCircle size={18} />
                    <span>Finalize Commissioning</span>
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

export default AddTeam;

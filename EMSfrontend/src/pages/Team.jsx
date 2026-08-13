import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { 
  FiMoreVertical, FiSearch, FiX, FiUsers, FiShield, 
  FiUser, FiCalendar, FiBriefcase, FiEye, FiActivity,
  FiInfo, FiPlus, FiTrash2, FiEdit, FiFilter, FiArrowLeft
} from "react-icons/fi";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import EmptyState from "../components/EmptyState";

// Aesthetic Color Palette - ERP Standard
const roleColors = {
  ADMIN: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
  HR: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  EMPLOYEE: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  MANAGER: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" },
  DEFAULT: { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" },
};

const Team = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [viewTeam, setViewTeam] = useState(null); 
  const [userRole, setUserRole] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await api.get("/teams");
        if(res.data) {
          setTeams(res.data);
          setFilteredTeams(res.data);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!search) setFilteredTeams(teams);
    else {
      const q = search.toLowerCase();
      setFilteredTeams(teams.filter((team) =>
        (team.team_name || "").toLowerCase().includes(q) ||
        (team.team_leader?.name || "").toLowerCase().includes(q)
      ));
    }
  }, [search, teams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-actions')) setDropdownOpen(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') { setViewTeam(null); setModalOpen(false); setDropdownOpen(null); }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const confirmDelete = (id) => { setDeleteTeamId(id); setModalOpen(true); setDropdownOpen(null); };

  const handleDelete = async () => {
    try {
      await api.delete(`/teams/${deleteTeamId}`);
      setTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
      setFilteredTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
      setModalOpen(false);
      setDeleteTeamId(null);
      setToast({ show: true, message: 'Team deleted successfully!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Failed to delete team.', type: 'error' });
    }
  };

  const totalMembers = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
  const teamsWithLeaders = teams.filter(t => t.team_leader).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-24 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-violet-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-[1600px] mx-auto relative z-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 backdrop-blur-sm">
                <FiUsers className="text-violet-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em]">Human Capital</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Node Hierarchy</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Architecture</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-medium">
                  Map organizational structures, delegate leadership roles, and manage personnel clusters.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative group">
                 <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                 <input
                  type="text"
                  placeholder="Search teams..."
                  className="bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all w-full md:w-64 placeholder:text-slate-400 shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              
              {(userRole === "admin" || userRole === "hr") && (
                <button
                  onClick={() => navigate("/add-team")}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-xl shadow-violet-500/20 transition-all flex items-center gap-2 border border-violet-500/30 active:scale-95"
                >
                  <FiPlus size={16} /> Create Unit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 -mt-12 max-w-[1600px] mx-auto w-full px-4 md:px-8 pb-12 z-20">
        
        {/* Statistics Bar */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Cluster Groups', value: teams.length, color: 'text-indigo-500', icon: FiBriefcase, iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
              { label: 'Personnel Count', value: totalMembers, color: 'text-amber-500', icon: FiUsers, iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
              { label: 'Stewardship Map', value: teamsWithLeaders, color: 'text-emerald-500', icon: FiShield, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
            ].map((stat, i) => (
              <div key={i} className="erp-card p-5 bg-white flex items-center gap-5 border-none ring-1 ring-slate-200/50 shadow-xl relative overflow-hidden">
                <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center ${stat.iconText} shrink-0 shadow-inner border border-slate-100`}>
                   <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading / Error / Empty States */}
        {loading ? (
             <div className="py-32 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-violet-600 animate-spin" />
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Org Matrix...</p>
             </div>
        ) : error ? (
             <div className="py-20">
                <EmptyState 
                  type="error" 
                  title="Org Matrix Scan Failure" 
                  message="System topology scan interrupted. The human capital node is currently unreadable."
                  onRetry={() => { setLoading(true); window.location.reload(); }}
                />
             </div>
        ) : filteredTeams.length === 0 ? (
             <div className="py-20">
                <EmptyState 
                  type={search ? "search" : "empty"}
                  title={search ? "No Units Found" : "Zero Clusters Recorded"}
                  message={search ? `No organizational units match "${search}" in the active scan.` : "The organization currenty has no registered team clusters."}
                />
             </div>
        ) : (
          /* Table */
          <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden border-none ring-1 ring-slate-200/50 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <th className="px-8 py-5">Unit Identifier</th>
                    <th className="px-8 py-5">Operational Steward</th>
                    <th className="px-8 py-5">Personnel Array</th>
                    <th className="px-8 py-5">Lifecycle Meta</th>
                    <th className="px-8 py-5 text-center">Load</th>
                    <th className="px-8 py-5 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredTeams.map((team) => (
                    <tr key={team._id} className="group hover:bg-violet-50/20 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 group-hover:text-violet-600 transition-colors uppercase tracking-widest">{team.team_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 opacity-60 uppercase tracking-tighter">NODE-REF: {team._id.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {team.team_leader ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-[10px] shadow-lg group-hover:bg-violet-600 transition-colors uppercase">
                              {team.team_leader.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-700 tracking-tight">{team.team_leader.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{team.team_leader.role}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Unallocated</span>
                        )}
                      </td>
                      <td className="px-8 py-6 cursor-pointer" onClick={() => setViewTeam(team)}>
                         <div className="flex -space-x-2">
                            {team.members?.slice(0, 4).map((m, idx) => (
                              <div key={idx} className="w-8 h-8 rounded-lg ring-2 ring-white bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-black border border-slate-200 uppercase hover:scale-110 hover:z-10 transition-transform">
                                {m.employee?.name ? m.employee.name.charAt(0) : "?"}
                              </div>
                            ))}
                            {team.members?.length > 4 && (
                              <div className="w-8 h-8 rounded-lg ring-2 ring-white bg-violet-50 text-violet-600 text-[10px] flex items-center justify-center font-black shadow-inner border border-violet-100">
                                +{team.members.length - 4}
                              </div>
                            )}
                          </div>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest space-y-1">
                        <div className="flex items-center gap-1.5"><FiCalendar size={10} className="text-slate-300"/> INIT: {new Date(team.createdAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5 opacity-60"><FiActivity size={10} className="text-slate-200"/> SYNC: {new Date(team.updatedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-6 text-center cursor-pointer" onClick={() => setViewTeam(team)}>
                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-slate-50 text-slate-900 font-black text-[10px] border border-slate-200 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-500 transition-all shadow-xs">
                          {team.members?.length || 0}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right relative dropdown-actions">
                        <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === team._id ? null : team._id); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                          <FiMoreVertical size={16} />
                        </button>
                        {dropdownOpen === team._id && (
                          <div className="absolute right-8 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden divide-y divide-slate-50 animate-in fade-in zoom-in-95 duration-100">
                             <button className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-violet-600 transition-all text-left"
                               onClick={() => { setViewTeam(team); setDropdownOpen(null); }}>
                                <FiEye size={14} className="text-violet-600" /> View Specs
                             </button>
                             <button className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all text-left"
                               onClick={() => { navigate(`/edit-team/${team._id}`); setDropdownOpen(null); }}>
                                <FiUsers size={14} className="text-blue-600" /> Modify Cluster
                             </button>
                             {userRole === "admin" && (
                                <button className="flex w-full items-center gap-3 px-5 py-3.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all text-left"
                                  onClick={() => confirmDelete(team._id)}>
                                   <FiX size={14} /> Purge Component
                                </button>
                             )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- TEAM DETAILS MODAL --- */}
      {viewTeam && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 backdrop-blur-xl">
           <div className="absolute inset-0 bg-slate-900/40" onClick={() => setViewTeam(null)} />
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
              <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 shadow-inner">
                       <FiActivity size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 tracking-widest uppercase mb-1">{viewTeam.team_name}</h2>
                       <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">NODE-HASH: {viewTeam._id}</p>
                    </div>
                 </div>
                 <button onClick={() => setViewTeam(null)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 active:scale-95">
                    <FiX size={20} />
                 </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                 <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-8 overflow-y-auto space-y-8">
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Steward</h3>
                       <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 flex flex-col items-center text-center">
                          <div className="w-20 h-20 rounded-4xl bg-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-inner mb-4 overflow-hidden border-4 border-white">
                              {viewTeam.team_leader ? viewTeam.team_leader.name.charAt(0) : "?"}
                          </div>
                          <p className="font-black text-slate-900 text-lg tracking-tight uppercase mb-2">{viewTeam.team_leader ? viewTeam.team_leader.name : "Unassigned"}</p>
                          {viewTeam.team_leader && (
                               <span className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border shadow-xs ${
                                  roleColors[viewTeam.team_leader.role?.toUpperCase()] ? 
                                  `${roleColors[viewTeam.team_leader.role?.toUpperCase()].bg} ${roleColors[viewTeam.team_leader.role?.toUpperCase()].text} ${roleColors[viewTeam.team_leader.role?.toUpperCase()].border}` :
                                  "bg-slate-100 text-slate-700"
                               }`}>
                                  {viewTeam.team_leader.role}
                               </span>
                          )}
                       </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Telemetry Metrics</h3>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Members</p>
                              <p className="text-xl font-black text-slate-900">{viewTeam.members?.length || 0}</p>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Set</p>
                              <p className="text-xl font-black text-emerald-500 uppercase tracking-widest">{viewTeam.team_leader ? 'YES' : 'NO'}</p>
                           </div>
                        </div>
                    </section>
                 </div>

                 <div className="flex-1 p-8 bg-white flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Deployment Array</h3>
                        <div className="h-0.5 flex-1 mx-6 bg-slate-50" />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-4 space-y-3">
                      {viewTeam.members?.length > 0 ? (
                        viewTeam.members.map((m) => {
                          const role = m.employee?.role?.toUpperCase() || "DEFAULT";
                          const colors = roleColors[role] || roleColors.DEFAULT;
                          return (
                            <div key={m._id} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-violet-300 hover:bg-white hover:shadow-xl transition-all duration-300">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-[11px] border border-slate-200 uppercase group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-inner">
                                {m.employee?.name ? m.employee.name.charAt(0) : "?"}
                              </div>
                              <div className="flex-1 flex flex-col min-w-0">
                                <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-widest truncate">{m.employee?.name || "Anonymous Asset"}</h4>
                                <p className="text-[9px] text-slate-400 font-mono tracking-tighter truncate">{m.employee?.email}</p>
                              </div>
                              <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-xs ${colors.bg} ${colors.text} ${colors.border}`}>
                                {m.employee?.role || 'RESOURCE'}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                           <FiUsers size={48} className="mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No deployed personnel</p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center relative z-10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"><FiX size={32} /></div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Purge Cluster?</h2>
            <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">System-wide deletion of this team node will detach all assigned personnel. Operational integrity will be impacted.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors shadow-sm" onClick={() => setModalOpen(false)}>Abort</button>
              <button className="flex-1 py-3 rounded-xl bg-red-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all active:scale-95" onClick={handleDelete}>Confirm Purge</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />
    </div>
  );
};

export default Team;
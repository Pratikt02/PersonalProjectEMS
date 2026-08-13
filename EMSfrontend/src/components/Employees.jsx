import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api"; // ✅ Use the interceptor-enabled API instance
import { toast } from "react-toastify";
import {
  FiMoreVertical,
  FiSearch,
  FiX,
  FiUsers,
  FiShield,
  FiCalendar,
  FiBriefcase,
  FiEye,
  FiMail,
  FiPhone,
  FiPlus,
  FiFilter,
} from "react-icons/fi";
import { IoDocumentAttachOutline } from "react-icons/io5";
import Footer from "./Footer";

const roleColors = {
  ADMIN: "bg-red-50 text-red-700 border-red-100",
  HR: "bg-green-50 text-green-700 border-green-100",
  EMPLOYEE: "bg-slate-50 text-slate-700 border-slate-100",
  MANAGER: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB", {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users");
      setEmployees(res.data || []);
      setFilteredEmployees(res.data || []);
    } catch (err) {
      // Interceptor handles toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!search) setFilteredEmployees(employees);
    else {
      const s = search.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            (emp.name || "").toLowerCase().includes(s) ||
            (emp.email || "").toLowerCase().includes(s) ||
            (emp.department || "").toLowerCase().includes(s) ||
            (emp.role || "").toLowerCase().includes(s) ||
            (emp.employeeId || "").toLowerCase().includes(s)
        )
      );
    }
  }, [search, employees]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest(".dropdown-actions")) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${deleteId}`);
      toast.success("Personnel record terminated successfully");
      setEmployees((prev) => prev.filter((emp) => emp._id !== deleteId));
      setModalOpen(false);
      setDeleteId(null);
    } catch (err) {
      // Interceptor handles toast
    }
  };

  const stats = {
    total: employees.length,
    departments: new Set(employees.map((e) => e.department).filter(Boolean)).size,
    admins: employees.filter((e) => e.role?.toLowerCase() === "admin").length,
    active: employees.length, // Logic could be more complex but matches existing
  };

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
                <FiUsers className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Personnel Hub</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Enterprise Directory</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Employee Records</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Maintain global workforce intelligence and manage professional identities with operational precision.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {(userRole === "admin" || userRole === "hr") && (
                <button
                  onClick={() => navigate("/add-employee")}
                  className="px-8 h-12 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 shadow-2xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-800 active:scale-95 whitespace-nowrap"
                >
                  <FiPlus size={16} /> Register Resource
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-10 max-w-[1600px] mx-auto w-full px-4 md:px-6 pb-12 z-20">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Live Resources"    value={stats.total}       icon={<FiUsers />}     color="blue" />
          <StatCard label="Active Depts"      value={stats.departments} icon={<FiBriefcase />} color="slate" />
          <StatCard label="Privileged Sec"    value={stats.admins}      icon={<FiShield />}    color="red" />
          <StatCard label="Avg Tenure"        value="2.4Y"              icon={<FiActivity />}  color="green" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="erp-card bg-white/80 backdrop-blur-md p-4 mb-6 border-slate-200/60 shadow-xl shadow-slate-200/20">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-400 group">
              <FiFilter size={14} className="group-hover:text-blue-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest">Global Search</span>
            </div>

            <div className="relative flex-1 max-w-xl">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="erp-input pl-9 h-11 w-full text-sm bg-white"
                placeholder="Search by name, ID, department or role..."
              />
            </div>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="px-3 h-11 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
              >
                <FiX size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Identity</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Architecture</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Comms</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activation</th>
                  <th className="px-6 py-5 text-right w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data Node...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center px-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FiUsers size={40} className="text-slate-200" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Query Null</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Zero records found matching the specified parameters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const roleStyle = roleColors[emp.role?.toUpperCase()] || "bg-slate-50 text-slate-700 border-slate-100";
                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform overflow-hidden shadow-sm">
                              {emp.profileImage ? (
                                <img
                                  src={`https://ems.wordlanetech.com/${emp.profileImage.replace(/^\/+/, "")}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                // <img src={`https://ems.wordlanetech.com${emp.profileImage.replace(/^\/+/, "")}`} className="w-full h-full object-cover" />
                              ) : emp.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{emp.employeeId || "X-IDENT-000"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{emp.department || "General"}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Org Unit</span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all shadow-xs w-fit ${roleStyle}`}>
                              {emp.role}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 italic opacity-70">{emp.designation || "Core Associate"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-600 flex items-center gap-2"><FiMail className="text-slate-300" size={12} /> {emp.email}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><FiPhone className="text-slate-300" size={12} /> {emp.phone || "No direct link"}</p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <FiCalendar size={13} className="text-blue-500/50" />
                            {formatDate(emp.createdAt)}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-right whitespace-nowrap dropdown-actions">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setDropdownOpen(dropdownOpen === emp._id ? null : emp._id)}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-200 border border-transparent rounded-xl transition-all active:scale-90"
                            >
                              <FiMoreVertical size={18} />
                            </button>

                            <div className={`absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-30 overflow-hidden transition-all duration-200 origin-top-right ${dropdownOpen === emp._id ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                              <button onClick={() => navigate(`/edit-employee/${emp._id}`)} className="flex items-center gap-3 w-full px-5 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-slate-50/50 transition-colors">
                                <FiBriefcase size={14} className="text-blue-600" /> Modify Profile
                              </button>
                              <button onClick={() => navigate(`/employees/${emp._id}/onboarding-documents`)} className="flex items-center gap-3 w-full px-5 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-slate-50/50 transition-colors border-t border-slate-100">
                                <IoDocumentAttachOutline size={16} className="text-orange-500" /> Resource Docs
                              </button>
                              {(userRole === "admin" || userRole === "hr") && (
                                <>
                                  <div className="border-t border-slate-100" />
                                  <button onClick={() => { setDeleteId(emp._id); setModalOpen(true); }} className="flex items-center gap-3 w-full px-5 py-4 text-[10px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50/50 transition-colors">
                                    <FiX size={14} /> Terminate Record
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 border border-rose-100">
               <FiX size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Terminate Record?</h3>
            <p className="text-sm text-slate-500 mb-10 leading-relaxed font-medium">
               You are about to permanently purge this resource identity from the system. This action is terminal and will affect all downstream operational datasets.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95"
              >
                Abort
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
              >
                Execute Purge
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
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


export default Employees;

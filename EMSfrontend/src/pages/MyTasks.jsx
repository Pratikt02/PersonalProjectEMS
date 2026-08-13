import React, { useEffect, useState } from "react";
import api from "../api/api";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiClock, FiUser, FiCalendar, FiArrowLeft, FiShield, 
  FiActivity, FiCheckCircle, FiSearch, FiFilter, FiBriefcase, FiMoreVertical
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";

const statusColors = {
  "Pending": { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", dot: "bg-blue-500" },
  "On Hold": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", dot: "bg-orange-500" },
  "Completed": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500" },
  "In Review": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", dot: "bg-purple-500" },
};

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      setError(false);
      if (user) {
        const res = await api.get("/tasks/my-tasks");
        setTickets(res.data);
        setFilteredTickets(res.data);
      }
    } catch (err) {
      console.error("Error loading my tickets:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchMyTickets();
    // eslint-disable-next-line
  }, [user?.employeeId]);

  useEffect(() => {
    let filtered = [...tickets];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.title?.toLowerCase().includes(q) || t.taskId?.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    setFilteredTickets(filtered);
  }, [search, statusFilter, tickets]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await api.put(`/tasks/${ticketId}/status`, { status: newStatus });
      setToast({ show: true, message: "Workflow node synchronized.", type: "success" });
      fetchMyTickets();
    } catch (err) {
      setToast({ show: true, message: "System failure during status update.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area */}
      <div className="bg-white pt-16 pb-28 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-emerald-600/5 via-emerald-400/5 to-transparent opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-6xl mx-auto relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/20">
              <FiActivity size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] bg-emerald-50 px-3 py-1 rounded-lg">Operational Ledger</span>
                <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Encrypted Stream</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Personal Assignments</h1>
              <p className="text-slate-500 text-sm font-bold opacity-70">Managing {tickets.length} active work streams.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="erp-button-secondary h-12 px-8 flex items-center gap-2 group">
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Exit View
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-12 px-4 md:px-8 pb-20 max-w-6xl mx-auto w-full z-20">
        
        {/* Filtering & Search Nodes */}
        <div className="erp-card-premium overflow-hidden p-3 mb-10 border-white/40 flex flex-col lg:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full group">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Operational Identifiers or Titles..."
                className="w-full pl-12 pr-6 h-14 rounded-2xl border-none bg-slate-50/50 text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all shadow-inner"
              />
           </div>
           
           <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64 group">
                 <FiFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500" />
                 <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                   className="w-full pl-12 pr-10 h-14 rounded-2xl border-none bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white appearance-none transition-all cursor-pointer shadow-inner"
                 >
                    <option value="">Status: All Nodes</option>
                    {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <FiMoreVertical className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
              
              <div className="h-14 px-6 rounded-2xl bg-slate-900 flex items-center gap-3 shadow-xl shadow-slate-900/10 border border-slate-800">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-lg font-black text-white leading-none">{filteredTickets.length}</div>
              </div>
           </div>
        </div>

        {loading ? (
             <div className="py-40 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin shadow-2xl" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-100 px-4 py-2 rounded-full">Syncing Local Ledger...</p>
             </div>
        ) : error ? (
            <EmptyState 
              type="error" 
              title="Ledger Sync Failure" 
              message="We were unable to synchronize your personal operational queue with the central node."
              onRetry={fetchMyTickets}
            />
        ) : filteredTickets.length === 0 ? (
            <EmptyState 
              type={search ? "search" : "empty"}
              title={search ? "No Matches Found" : "Operational Queue Clear"} 
              message={search ? `No assignment identifiers match "${search}".` : "Your personal operational ledger is currently synchronized and clear of pending tasks."}
            />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTickets.map((ticket) => {
               const sc = statusColors[ticket.status] || statusColors["Pending"];
               return (
                  <div key={ticket._id} className="erp-card-premium p-0 flex flex-col group hover:scale-[1.02] transition-all duration-500">
                     <div className="p-8 pb-6 flex-1">
                        <div className="flex justify-between items-start mb-6">
                           <div className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest shadow-xs flex items-center gap-2 ${sc.bg} ${sc.text} ${sc.border}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                              {ticket.status}
                           </div>
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] bg-slate-50 px-2 py-1 rounded-md">ID: {ticket.taskId}</span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-4 group-hover:text-emerald-600 transition-colors uppercase leading-tight line-clamp-2">{ticket.title}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                           <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                              <FiClock size={12} className="text-emerald-500" /> {ticket.priority.toUpperCase()}
                           </div>
                           <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                              <FiCalendar size={12} className="text-blue-500" /> {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'NO TARGET'}
                           </div>
                        </div>

                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 text-[11px] text-slate-500 font-bold leading-relaxed line-clamp-3 italic opacity-80 group-hover:opacity-100 transition-opacity">
                           "{ticket.description || "No tactical details provided in the system ledger."}"
                        </div>
                     </div>

                     <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                        <div className="relative flex-1">
                           <select
                               className="w-full px-5 h-12 rounded-xl border border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer shadow-xs"
                               value={ticket.status}
                               onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                           >
                              {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                           <FiChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                        <button className="h-12 w-12 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 active:scale-90 flex items-center justify-center group/btn">
                           <FiCheckCircle size={20} className="group-hover/btn:scale-125 transition-transform" />
                        </button>
                     </div>
                  </div>
               );
            })}
          </div>
        )}
      </main>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />
    </div>
  );
};

export default MyTickets;

import React, { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import Footer from "../components/Footer";
import {
  FiDollarSign, FiPlus, FiSearch, FiX, FiEdit2, FiTrash2,
  FiCheckCircle, FiEye, FiPrinter, FiChevronDown, FiFilter,
  FiActivity, FiBriefcase, FiCalendar
} from "react-icons/fi";
import EmptyState from "../components/EmptyState";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const STATUS_STYLES = {
  Draft:     "bg-slate-100 text-slate-600 border-slate-200",
  Processed: "bg-blue-50 text-blue-700 border-blue-200",
  Paid:      "bg-green-50 text-green-700 border-green-200",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const EMPTY_FORM = {
  employeeId: "", month: currentMonth, year: currentYear,
  basicSalary: "", hra: "", allowances: "", bonus: "",
  pf: "", tax: "", lateDeductions: "", otherDeductions: "",
  status: "Draft", remarks: "",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Payroll() {
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdminHR = user.role === "admin" || user.role === "hr";

  const [records,   setRecords]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [toast,     setToast]     = useState(null);

  // Filters
  const [search,     setSearch]     = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear,  setFilterYear]  = useState(currentYear);
  const [filterStatus,setFilterStatus]= useState("");

  // Modals
  const [showForm,    setShowForm]    = useState(false);
  const [showDetail,  setShowDetail]  = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [editRecord,  setEditRecord]  = useState(null);
  const [detailRecord,setDetailRecord]= useState(null);
  const [deleteId,    setDeleteId]    = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Fix: Don't send "All" to backend
      if (filterMonth && filterMonth !== "All") params.month = filterMonth;
      if (filterYear && filterYear !== "All")   params.year = filterYear;
      if (filterStatus && filterStatus !== "All") params.status = filterStatus;
      if (search) params.search = search;

      const endpoint = isAdminHR ? "/payroll" : "/payroll/my";
      const res = await api.get(endpoint, { params });
      setRecords(res.data || []);
    } catch (err) {
      setError(true);
      showToast("Failed to load payroll records", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdminHR) return;
    try {
      const res = await api.get("/users");
      setEmployees(res.data || []);
    } catch {}
  };

  useEffect(() => { fetchRecords(); }, [filterMonth, filterYear, filterStatus]);
  useEffect(() => { fetchEmployees(); }, []);

  // ── Live net-pay preview in form ──────────────────────────────────────────
  const liveGross = useMemo(() => {
    const b = Number(form.basicSalary) || 0;
    const h = Number(form.hra) || 0;
    const a = Number(form.allowances) || 0;
    const bn = Number(form.bonus) || 0;
    return b + h + a + bn;
  }, [form.basicSalary, form.hra, form.allowances, form.bonus]);

  const liveDed = useMemo(() => {
    const p  = Number(form.pf) || 0;
    const t  = Number(form.tax) || 0;
    const l  = Number(form.lateDeductions) || 0;
    const o  = Number(form.otherDeductions) || 0;
    return p + t + l + o;
  }, [form.pf, form.tax, form.lateDeductions, form.otherDeductions]);

  const liveNet = liveGross - liveDed;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditRecord(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (rec) => {
    setEditRecord(rec);
    setForm({
      employeeId:    rec.employeeId,
      month:         rec.month,
      year:          rec.year,
      basicSalary:   rec.basicSalary,
      hra:           rec.hra,
      allowances:    rec.allowances,
      bonus:         rec.bonus,
      pf:            rec.pf,
      tax:           rec.tax,
      lateDeductions:rec.lateDeductions,
      otherDeductions:rec.otherDeductions,
      status:        rec.status,
      remarks:       rec.remarks || "",
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editRecord) {
        const res = await api.put(`/payroll/${editRecord._id}`, form);
        setRecords(prev => prev.map(r => r._id === editRecord._id ? res.data : r));
        showToast("Pay slip updated successfully");
      } else {
        const res = await api.post("/payroll", form);
        setRecords(prev => [res.data, ...prev]);
        showToast("Pay slip generated successfully");
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save pay slip", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const res = await api.patch(`/payroll/${id}/pay`);
      setRecords(prev => prev.map(r => r._id === id ? res.data : r));
      showToast("Payroll marked as Paid");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to mark as paid", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/payroll/${deleteId}`);
      setRecords(prev => prev.filter(r => r._id !== deleteId));
      setShowDelete(false);
      showToast("Pay slip deleted");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalNet   = records.reduce((s, r) => s + (r.netPay || 0), 0);
  const paidCount  = records.filter(r => r.status === "Paid").length;
  const pendCount  = records.filter(r => r.status === "Processed").length;
  const draftCount = records.filter(r => r.status === "Draft").length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <FiDollarSign className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Finance Hub</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Payroll & Compensation</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payroll Management</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Execute comprehensive compensation strategies and maintain transparent financial records.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {isAdminHR && (
                <button
                  onClick={openCreate}
                  className="px-6 h-11 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-800 active:scale-95"
                >
                  <FiPlus size={16} /> Generate Pay Slip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-10 max-w-[1600px] mx-auto w-full px-4 md:px-6 pb-12 z-20">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Payroll" value={`₹${fmt(totalNet)}`} icon={<FiDollarSign />} color="blue" />
          <StatCard label="Paid"      value={paidCount}  icon={<FiCheckCircle />} color="green" />
          <StatCard label="Pending"   value={pendCount}  icon={<FiActivity />} color="orange" />
          <StatCard label="Draft"     value={draftCount} icon={<FiBriefcase />} color="slate" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="erp-card bg-white/80 backdrop-blur-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-400 group">
              <FiFilter size={14} className="group-hover:text-blue-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
            </div>
            
            {isAdminHR && (
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  className="erp-input pl-9 h-10 w-56 text-sm bg-white"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchRecords()}
                />
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <select className="erp-input h-10 text-sm w-40 bg-white" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>

              <select className="erp-input h-10 text-sm w-32 bg-white" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <select className="erp-input h-10 text-sm w-40 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Processed">Processed</option>
                <option value="Paid">Paid</option>
              </select>

              {(search || filterMonth || filterStatus) && (
                <button
                  onClick={() => { setSearch(""); setFilterMonth(""); setFilterStatus(""); }}
                  className="px-3 h-10 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                >
                  <FiX size={14} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Data Table ── */}
        <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Ledger...</p>
            </div>
          ) : error ? (
            <div className="py-20">
              <EmptyState 
                type="error" 
                title="Financial Ledger Error" 
                message="Unable to access the vault. Encrypted stream synchronization failure."
                onRetry={fetchRecords}
              />
            </div>
          ) : records.length === 0 ? (
            <div className="py-20">
              <EmptyState 
                type={search ? "search" : "empty"}
                title={search ? "No Financial Matches" : "Ledger Clear"}
                message={search ? `No payroll identifiers match "${search}" for this period.` : "The financial payroll ledger is currently clear for the selected parameters."}
              />
              {isAdminHR && (
                <div className="flex justify-center mt-6">
                  <button onClick={openCreate} className="erp-button-primary px-10">
                    Register New Pay Slip
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/60">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Context</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Period</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Amount</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Adjustments</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Disbursement</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(rec => (
                    <tr key={rec._id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-extrabold text-xs border border-slate-200 transition-transform group-hover:scale-110">
                            {rec.employeeName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{rec.employeeName}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{rec.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-600 flex items-center gap-2">
                          <FiCalendar size={13} className="text-slate-400" />
                          {MONTHS[rec.month - 1]} {rec.year}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-slate-700">₹{fmt(rec.grossPay)}</td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-red-500/80">− ₹{fmt(rec.totalDeductions)}</td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-base font-black text-slate-900">₹{fmt(rec.netPay)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all shadow-xs ${STATUS_STYLES[rec.status] || STATUS_STYLES.Draft}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${rec.status === 'Paid' ? 'bg-green-500' : rec.status === 'Processed' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setDetailRecord(rec); setShowDetail(true); }}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-blue-100"
                            title="View Ledger Detail"
                          >
                            <FiEye size={16} />
                          </button>
                          {isAdminHR && rec.status !== "Paid" && (
                            <>
                              <button
                                onClick={() => openEdit(rec)}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-indigo-100"
                                title="Adjust Slip"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleMarkPaid(rec._id)}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-green-100"
                                title="Execute Payment"
                              >
                                <FiCheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => { setDeleteId(rec._id); setShowDelete(true); }}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-100"
                                title="Delete Record"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold tracking-tight animate-in slide-in-from-bottom-6 duration-500 backdrop-blur-md ${
          toast.type === "error"
            ? "bg-red-600/95 text-white border-red-400"
            : "bg-slate-900/95 text-white border-slate-700"
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"><FiX size={14} /></button>
        </div>
      )}

      {/* ── Generate / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-7 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <FiDollarSign size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-none mb-1">
                    {editRecord ? "Adjust Pay Slip" : "Generate Pay Slip"}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Financial Ledger Entry</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-hide">
              {/* Employee & Period */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee & Calculation Period</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="erp-label">Target Employee <span className="text-red-500">*</span></label>
                    {editRecord ? (
                      <div className="erp-input bg-slate-50 flex items-center font-bold text-slate-500 select-none">
                        {form.employeeId}
                      </div>
                    ) : (
                      <select
                        className="erp-input font-bold"
                        value={form.employeeId}
                        onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                        required
                      >
                        <option value="">Select identity</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp.employeeId}>
                            {emp.name} — {emp.employeeId}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="erp-label">Disbursement Month <span className="text-red-500">*</span></label>
                    <select className="erp-input font-bold" value={form.month} onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))} required>
                      {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="erp-label">Fiscal Year <span className="text-red-500">*</span></label>
                    <select className="erp-input font-bold" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} required>
                      {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings Breakdown (₹)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { key: "basicSalary", label: "Basic Retainer" },
                    { key: "hra",         label: "HRA Segment" },
                    { key: "allowances",  label: "Allowances" },
                    { key: "bonus",       label: "Incentive/Bonus" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="erp-label">{label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="erp-input font-mono font-bold"
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deductions & Adjustments (₹)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { key: "pf",              label: "Provident Fund" },
                    { key: "tax",             label: "TDS / Tax" },
                    { key: "lateDeductions",  label: "Late Penalty" },
                    { key: "otherDeductions", label: "Miscellaneous" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="erp-label">{label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="erp-input font-mono font-bold text-red-500"
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview / Outcome */}
              <div className="bg-slate-900 rounded-4xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center relative overflow-hidden shadow-2xl shadow-slate-900/30">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
                <div className="relative">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gross Revenue</p>
                  <p className="text-xl font-bold text-white">₹{fmt(liveGross)}</p>
                </div>
                <div className="relative border-x border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Total Retention</p>
                  <p className="text-xl font-bold text-rose-400">− ₹{fmt(liveDed)}</p>
                </div>
                <div className="relative">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Final Disbursement</p>
                  <p className="text-3xl font-black text-white tracking-tighter">₹{fmt(liveNet)}</p>
                </div>
              </div>

              {/* Status & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="erp-label">Entry Lifecycle Status</label>
                  <select className="erp-input font-bold" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="Draft">Draft Mode</option>
                    <option value="Processed">Processed (Finalized)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Audit Remarks</label>
                  <input
                    type="text"
                    className="erp-input font-medium"
                    value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="Provide context if necessary..."
                  />
                </div>
              </div>
            </form>

            {/* Actions */}
            <div className="px-8 py-7 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                Cancel
              </button>
              <button type="submit" onClick={handleSave} disabled={saving} className="px-10 py-3 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none">
                {saving ? "Finalizing..." : editRecord ? "Update Ledger" : "Commit Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay Slip Detail Modal ── */}
      {showDetail && detailRecord && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            {/* Header / Watermark style */}
            <div className="bg-slate-50 p-10 border-b border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                      <FiDollarSign size={14} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Official Pay Slip</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{detailRecord.employeeName}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono font-bold tracking-widest uppercase">ID: {detailRecord.employeeId}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{MONTHS[detailRecord.month - 1]} {detailRecord.year}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm active:scale-90"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {/* Grid System */}
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Revenue Streams</p>
                  <div className="space-y-4">
                    <SlipRow label="Basic Salary"  value={detailRecord.basicSalary} />
                    <SlipRow label="HRA Segment"    value={detailRecord.hra} />
                    <SlipRow label="Allowances"     value={detailRecord.allowances} />
                    <SlipRow label="Incentives"     value={detailRecord.bonus} />
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest border-b border-red-50 pb-2">Retentions</p>
                  <div className="space-y-4">
                    <SlipRow label="Provident Fund"  value={detailRecord.pf}              red />
                    <SlipRow label="Taxation (TDS)"  value={detailRecord.tax}             red />
                    <SlipRow label="Late Deductions" value={detailRecord.lateDeductions}  red />
                    <SlipRow label="Miscellaneous"   value={detailRecord.otherDeductions} red />
                  </div>
                </div>
              </div>

              {/* Final Disbursement Result */}
              <div className="relative pt-6">
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-slate-100 to-transparent" />
                <div className="bg-slate-900 rounded-3xl p-8 flex justify-between items-center shadow-2xl shadow-slate-900/20 group">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block">Total Net Disbursement</span>
                    <span className="text-3xl font-black text-white tracking-tighter">₹{fmt(detailRecord.netPay)}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg transition-transform group-hover:scale-105 ${STATUS_STYLES[detailRecord.status]}`}>
                    {detailRecord.status}
                  </div>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="flex flex-col gap-3">
                {detailRecord.paidOn && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <FiCheckCircle size={12} className="text-green-500" />
                    Processed on {new Date(detailRecord.paidOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
                {detailRecord.remarks && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 opacity-50 italic">Audit Notes:</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{detailRecord.remarks}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <FiPrinter size={15} /> Export PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-4xl shadow-2xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nullify Record?</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              This action will permanently delete the pay slip entry. <span className="text-red-600 font-bold">Paid records cannot be nullified</span> once disbursed.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                Abort
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  const styles = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    slate:  "bg-slate-100 text-slate-500"
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter shrink-0">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${styles[color] || styles.blue} border border-current/10 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
    </div>
  );
}

function SlipRow({ label, value, red, bold }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[11px] uppercase tracking-wider font-bold ${bold ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
      <span className={`font-mono font-bold text-sm ${red ? "text-rose-500" : "text-slate-900"}`}>
        {red ? "- " : ""}₹{fmt(value)}
      </span>
    </div>
  );
}

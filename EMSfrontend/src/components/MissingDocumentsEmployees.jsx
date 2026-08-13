import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Toast from "./Toast";
import {
  FiSearch,
  FiUsers,
  FiAlertTriangle,
  FiExternalLink,
  FiDownload,
  FiArrowLeft,
  FiShield,
} from "react-icons/fi";

const badge = {
  not_submitted: "bg-red-500/10 text-red-500 border-red-500/20",
  incomplete: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const MissingDocumentsEmployees = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents/missing");
      const data = res.data?.data || [];
      setList(data);
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to load employee document status",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.trim().toLowerCase();
    return list.filter((x) => {
      const emp = x.employee || {};
      return (
        (emp.name || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.employeeId || "").toLowerCase().includes(q)
      );
    });
  }, [search, list]);

  const downloadCSV = () => {
    try {
      if (!filtered.length) {
        setToast({ show: true, message: "No data to export", type: "error" });
        return;
      }

      const rows = filtered.map((row, index) => {
        const emp = row.employee || {};
        return {
          "Sr No": index + 1,
          "Employee Name": emp.name || "-",
          "Employee ID": emp.employeeId || "-",
          Email: emp.email || "-",
          Phone: emp.phone || "-",
          Role: emp.role || "-",
          Department: emp.department || "-",
          Designation: emp.designation || "-",
          "Document Status": row.kycStatus || "-",
        };
      });

      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const val = String(r[h] ?? "").replaceAll('"', '""');
              return `"${val}"`;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `missing_documents_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setToast({ show: true, message: "✅ CSV downloaded successfully!", type: "success" });
    } catch (err) {
      setToast({ show: true, message: "Failed to export CSV", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans tracking-tight">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                <FiAlertTriangle className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Compliance Risk</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Audit Mode</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Missing Documents</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Identify and notify employees with pending or incomplete onboarding documentation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={downloadCSV}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 border border-slate-800 active:scale-95"
              >
                <FiDownload size={14} /> Export CSV
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <FiArrowLeft size={14} /> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 -mt-10 px-4 md:px-8 pb-12 max-w-6xl mx-auto w-full z-20">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="erp-card p-4 bg-white/80 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pending</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{list.length}</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <FiUsers size={20} />
            </div>
          </div>
        </div>

        <div className="erp-card bg-white/80 backdrop-blur-md overflow-hidden">
          {/* Internal Header/Search */}
          <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
            <div className="relative w-full md:w-96">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <FiSearch size={16} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID or email..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 shadow-xs"
              />
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Live Filtration Active
            </div>
          </div>

          {/* Table Area */}
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiShield className="text-blue-600 animate-pulse" size={14} />
                </div>
              </div>
              <p className="mt-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">Scanning compliance records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <FiCheckCircle className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Audit Complete: No Issues Found</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Excellent! All employees currently have submitted their onboarding documentation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="px-8 py-5">Employee Context</th>
                    <th className="px-8 py-5">Communication</th>
                    <th className="px-8 py-5">System Status</th>
                    <th className="px-8 py-5 text-right">Verification Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => {
                    const emp = row.employee;
                    if (!emp) return null;
                    return (
                      <tr key={emp._id} className="group hover:bg-slate-50 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-200 group-hover:scale-110 transition-transform shadow-sm">
                              {emp.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {emp.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-0.5">
                                ID: {emp.employeeId || emp._id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-slate-700">{emp.email}</span>
                            <span className="text-[10px] text-slate-400 font-medium">DEP: {emp.department || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <span
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border shadow-xs ${
                              badge[row.kycStatus] || badge.incomplete
                            }`}
                          >
                            {row.kycStatus === 'not_submitted' ? 'Missing Submission' : row.kycStatus}
                          </span>
                        </td>

                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => navigate(`/employees/${emp._id}/onboarding-documents`)}
                            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 group"
                          >
                            <FiExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> 
                            Audit Record
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <Footer />
    </div>
  );
};

export default MissingDocumentsEmployees;

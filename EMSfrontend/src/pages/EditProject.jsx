import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiArrowLeft, FiBriefcase, FiCalendar, FiUser, FiUsers, FiLayers, 
  FiCheckCircle, FiSave, FiClock, FiActivity, FiFilter, 
  FiInfo, FiChevronDown, FiTarget
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    manager_id: "",
    team_id: "",
    start_date: "",
    deadline: "",
    status: "In Progress"
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchManagers(), fetchTeams()]);
      setLoading(false);
    };
    init();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      const project = response.data;
      setFormData({
        project_name: project.project_name || "",
        description: project.description || "",
        manager_id: project.manager?._id || "",
        team_id: project.team?._id || "",
        start_date: project.start_date ? project.start_date.split("T")[0]
         : "",
        deadline: project.deadline
          ? project.deadline.split("T")[0]
          : (project.end_date ? project.end_date.split("T")[0] : ""),
        status: project.status || "In Progress"
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      setToast({ show: true, message: "System failure during project hydration", type: "error" });
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("/users/managers");
      setManagers(response.data || []);
    } catch (err) {
      console.error("Error fetching managers:", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get("/teams");
      setTeams(response.data || []);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        project_name: formData.project_name,
        description: formData.description,
        manager_id: formData.manager_id,
        team_id: formData.team_id,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.deadline || null,
        deadline: formData.deadline || null,
      };

      await api.put(`/projects/${id}`, payload);

      setToast({
        show: true,
        message: "Initiative parameters synchronized successfully!",
        type: "success",
      });

      setTimeout(() => navigate("/projects"), 1500);
    } catch (err) {
      console.error("Error updating project:", err);
      setToast({
        show: true,
        message:
          err.response?.data?.message ||
          "Tactical synchronization failure.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full shadow-2xl" 
          />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">Hydrating Project Meta...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-tight overflow-x-hidden">
      
      {/* 🔹 Premium Header Area */}
      <div className="bg-white pt-16 pb-32 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-indigo-600/5 via-blue-400/5 to-transparent opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link to="/projects" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all mb-8 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group active:scale-95">
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Strategy Hub
          </Link>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <FiBriefcase size={36} className="relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] bg-indigo-50 px-3 py-1 rounded-lg">Operational Lab</span>
                  <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Initiative ID: {id.slice(-8).toUpperCase()}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">Modify Pipeline</h1>
                <p className="text-slate-500 text-sm font-bold opacity-70">Adjusting parameters for: <span className="text-indigo-600">{formData.project_name}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-20 px-4 md:px-8 pb-24 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="erp-card-premium p-0 overflow-hidden border-white/40 shadow-2xl">
            
            {/* Form Section: Core Parameters */}
            <div className="p-10 border-b border-slate-100 bg-linear-to-b from-white to-slate-50/30">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                  <FiActivity size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Core Parameters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">Strategic Identity</label>
                  <div className="relative">
                    <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="project_name"
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      placeholder="e.g. Project Odyssey"
                      value={formData.project_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">Lifecycle Status</label>
                  <div className="relative">
                    <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <select
                      name="status"
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white appearance-none cursor-pointer"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>



                <div className="space-y-2 group">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Start Date
                   </label>

                <div className="relative">
                   <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />

                    <input
                      type="date"
                      name="start_date"
                      className="erp-input pl-12"
                      value={formData.start_date}
                      onChange={handleChange} />
                </div>
                </div>


                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">Target Deadline</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="date"
                      name="deadline"
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      value={formData.deadline}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section: Stakeholders */}
            <div className="p-10 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
                  <FiLayers size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Stakeholders & Resource Allocation</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-purple-600 transition-colors">Strategic Lead (Manager)</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                    <select
                      name="manager_id"
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white appearance-none cursor-pointer"
                      value={formData.manager_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">De-selected</option>
                      {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-purple-600 transition-colors">Tactical Team</label>
                  <div className="relative">
                    <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                    <select
                      name="team_id"
                      className="erp-input pl-12 shadow-xs focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white appearance-none cursor-pointer"
                      value={formData.team_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Unassigned</option>
                      {teams.map((t) => <option key={t._id} value={t._id}>{t.team_name}</option>)}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section: Scope */}
            <div className="p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-200">
                  <FiInfo size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Initiative Scope & Objectives</h3>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-slate-100/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none font-medium text-slate-700 placeholder-slate-300 shadow-inner"
                placeholder="Define the primary objectives and operational constraints of this corporate initiative..."
              />
            </div>

            {/* Form Footer */}
            <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-200">
                <FiClock className="text-indigo-500" /> Immutable Temporal Alignment
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                >
                  Abort Changes
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 md:flex-none h-14 px-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${
                    submitting 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30"
                  }`}
                >
                  {!submitting && <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:-translate-x-full transition-transform duration-1000 rotate-12" />}
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave size={18} /> Update Strategy Hub
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

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

export default EditProject;

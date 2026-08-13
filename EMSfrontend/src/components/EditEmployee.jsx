import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiBriefcase, FiCalendar, FiMapPin, FiAward, FiShield, FiCamera, FiX, FiCheck, FiSave } from "react-icons/fi";
import Footer from "./Footer";
import Toast from "./Toast";

const departments = ["Engineering", "Product", "Design", "Marketing", "Sales", "Human Resources", "Finance", "Operations", "Legal", "Quality Assurance"];
const designations = ["Software Engineer", "Senior Software Engineer", "Product Manager", "UX Designer", "Marketing Specialist", "Sales representative", "HR Manager", "Accountant", "Operations Manager", "Data Analyst"];
const roles = [
  { value: "Admin", label: "Administrator (Root Access)" },
  { value: "Employee", label: "Standard Employee (Base Nodes)" },
];

const roleColors = {
  ADMIN: { bg: "bg-slate-900", text: "text-white", border: "border-slate-800 shadow-lg shadow-slate-900/10" },
  EMPLOYEE: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
};

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [formData, setFormData] = useState({
    name: "", email: "", role: "", department: "", designation: "", phone: "", 
    joining_date: "", dob: "", location: "", address: "", gender: "", password: "",
    reportingTo: "" 
  });

  const [managers, setManagers] = useState([]);
  const [profileImage, setProfileImage] = useState("");
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const data = res.data;
        
        // Pre-fill form data
        setFormData({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          department: data.department || "",
          designation: data.designation || "",
          phone: data.phone || "",
          joining_date: data.joining_date?.slice(0, 10) || "",
          dob: data.dob?.slice(0, 10) || "",
          location: data.location || "",
          address: data.address || "",
          gender: data.gender || "",
          password: "",
          reportingTo: data.reportingTo?._id || data.reportingTo || "" 
        });
        setProfileImage(data.profileImage || "");
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          setError("Session expired or unauthorized. Re-authentication required.");
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError("System failed to retrieve personnel record.");
        }
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get("/users/managers");
        // Filter out the current employee from potential supervisors
        const potentialSupervisors = (res.data || []).filter(m => m._id !== id);
        setManagers(potentialSupervisors);
      } catch (err) {
        console.error("Failed to fetch managers", err);
      }
    };
    fetchManagers();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || !formData.email || !formData.role) {
      setError("Critical indices missing: Name, Email, and Role are mandatory.");
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== "") {
        payload.append(key, formData[key]);
      }
    });
    
    if (file) {
      payload.append('profileImage', file);
    }

    try {
      await api.put(`/users/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToast({ show: true, message: 'Identity node synchronized successfully.', type: 'success' });
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setToast({ message: 'Auth breach detected. Re-logging...', type: 'error' });
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response && err.response.data) {
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          setError(`Input rejection: ${err.response.data.errors.join(', ')}`);
        } else {
          setError(err.response.data.message || 'Identity synchronization failed.');
        }
      } else {
        setError('Core update failure. Please retry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Personnel Data...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area */}
      <div className="bg-white pt-16 pb-28 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-600/5 via-blue-400/5 to-transparent opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                <FiUser size={18} />
              </div>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-lg">Identity Refinement</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">
              Synchronize Identity
            </h1>
            <p className="text-slate-500 text-sm font-bold opacity-70">Updating resource parameters for {formData.name}.</p>
          </div>
          <button
            onClick={() => navigate("/employees")}
            className="erp-button-secondary h-12 px-8 flex items-center gap-2 group shadow-xl shadow-slate-200/50"
          >
            <FiX className="group-hover:rotate-90 transition-transform duration-300" /> Cancel Sync
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 -mt-12 mb-20 z-20">
        
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8 animate-in slide-in-from-top-4 flex items-center gap-3 shadow-lg shadow-red-500/10">
            <FiShield size={18} />
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Identity Section */}
          <div className="erp-card-premium overflow-hidden border-white/40">
            <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs"><FiUser size={16} /></div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Base Identity Data</h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${roleColors[formData.role.toUpperCase()]?.bg || "bg-slate-100"} ${roleColors[formData.role.toUpperCase()]?.text || "text-slate-700"} ${roleColors[formData.role.toUpperCase()]?.border || "border-slate-200"}`}>
                    {formData.role}
                 </span>
              </div>
            </div>
            
            <div className="p-10">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                {/* Photo upload */}
                <div className="flex flex-col items-center shrink-0">
                  <label className="erp-label mb-4">Official Bio-Image</label>
                  <div className="relative w-36 h-36 group cursor-pointer ring-4 ring-slate-50 ring-offset-4 ring-offset-white rounded-4xl overflow-hidden shadow-2xl transition-all duration-500 hover:ring-blue-100">
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-blue-300">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : profileImage ? (
                        <img src={`https://ems.wordlanetech.com${profileImage.replace(/^\/+/, "")}`} alt={formData.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="text-slate-200" size={48} />
                      )}
                    </div>
                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <FiCamera size={24} className="mb-2 animate-bounce" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Update</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>

                {/* Name / Email */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="erp-label">Full Legal Identity Name <span className="text-red-500 font-bold">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder="e.g. Alexander Pierce" required className="erp-input shadow-xs h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="erp-label">Secure Enterprise Mail <span className="text-red-500 font-bold">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="alex.p@enterprise.com" required className="erp-input shadow-xs h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="erp-label">Uplink Contact</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="+X (XXX) XXX-XXXX" className="erp-input shadow-xs h-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Org Distribution */}
            <div className="erp-card-premium border-white/40">
              <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs"><FiBriefcase size={14} /></div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Org Distribution</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="erp-label">Access Role <span className="text-red-500 font-bold">*</span></label>
                  <select name="role" value={formData.role} onChange={handleChange} required className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Level</option>
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Division</label>
                  <select name="department" value={formData.department} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Dept</option>
                    {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Designation</label>
                  <select name="designation" value={formData.designation} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Title</option>
                    {designations.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Deployment Node</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange}
                    placeholder="e.g. HQ - New York" className="erp-input shadow-xs h-12" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="erp-label">Reporting To (Supervisor)</label>
                  <select name="reportingTo" value={formData.reportingTo} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select Supervisor (Optional)</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.designation || m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Telemetry/Bio Data */}
            <div className="erp-card-premium border-white/40">
              <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs"><FiCalendar size={14} /></div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Bio-Data Epochs</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="erp-label">Identity Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="erp-input shadow-xs h-12 bg-white">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="erp-label">Arrival Epoch</label>
                  <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange}
                    className="erp-input shadow-xs h-12" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="erp-label">Resource DOB</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange}
                    className="erp-input shadow-xs h-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Security Node */}
          <div className="erp-card-premium border-white/40">
            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-purple-600 shadow-xs"><FiShield size={14} /></div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Security Credentials & Locale</h2>
            </div>
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-1.5">
                <label className="erp-label">Official Residence Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                  placeholder="Comprehensive residential address data..."
                  className="erp-input h-auto py-4 w-full resize-none shadow-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="erp-label">System Key (Update only)</label>
                <div className="relative group/pass">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                    onChange={handleChange} placeholder="Entropy overwrite string" 
                    className="erp-input h-12 w-full pr-12 shadow-xs group-hover/pass:border-blue-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                    {showPassword ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter italic opacity-60">Leave blank to retain current entropy.</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-6 pt-10">
            <div className="hidden md:flex flex-col items-end">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authorization Required</p>
               <p className="text-[9px] text-slate-300 font-bold italic">Synchronizing to enterprise core...</p>
            </div>
            <button type="submit" disabled={submitting} className="erp-button-primary h-14 px-12 text-xs flex items-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 group">
              <FiSave className="group-hover:scale-125 transition-transform" size={18} /> {submitting ? "Syncing..." : "Synchronize Identity"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default EditEmployee;

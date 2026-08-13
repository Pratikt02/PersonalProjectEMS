import React, { useEffect, useState } from "react";
import Footer from "./Footer";
import API from "../api/api";
import { toast } from "react-toastify";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, 
  FiBriefcase, FiLayers, FiShield, FiEdit3, FiCamera, FiActivity, FiGlobe, FiClock
} from "react-icons/fi";

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");

  if (userData) {
      const parsed = JSON.parse(userData);

      console.log("Loaded User:", parsed);

      setUser(parsed);
  }
    // const userData = localStorage.getItem("user");
    // if (userData) setUser(JSON.parse(userData));
  }, []);

const handleProfileImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setUploading(true);

    const formData = new FormData();

    // Keep existing user data
    formData.append("name", user.name || "");
    formData.append("email", user.email || "");
    formData.append("phone", user.phone || "");
    formData.append("department", user.department || "");
    formData.append("designation", user.designation || "");
    formData.append("role", user.role || "");
    formData.append("employeeId", user.employeeId || "");

    // Upload new image
    formData.append("profileImage", file);
    console.log("Current user:", user);

    const userId = user._id || user.id;

    console.log("Using User ID:", userId);

    if (!userId) {
      toast.error("User ID not found");
      setUploading(false);
      return;
    }

    const res = await API.put(`/users/${userId}`, formData, {
    // console.log("Current user:", user);
    // console.log("User id:", user.id);

    // const res = await API.put(`/users/${user.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const updatedUser = res.data.user;

    const mergedUser = {
    ...user,
    ...updatedUser,
    };

    setUser(mergedUser);
    localStorage.setItem("user", JSON.stringify(mergedUser));

    // setUser(updatedUser);
    // localStorage.setItem("user", JSON.stringify(updatedUser));

    toast.success("Profile image updated successfully!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to upload profile image.");
  } finally {
    setUploading(false);
  }
};

  // Reusable Detail Field Component
  const DetailField = ({ label, value, icon, accent = "blue" }) => {
    const accents = {
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      purple: "text-purple-600 bg-purple-50 border-purple-100",
      orange: "text-orange-600 bg-orange-50 border-orange-100",
      emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    };

    return (
      <div className="erp-card p-6 group transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 bg-white/80 backdrop-blur-md border-slate-200/60">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${accents[accent] || accents.blue}`}>
            {icon}
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-hover:text-blue-500 transition-colors">
            System Field
          </span>
        </div>
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 opacity-60">{label}</span>
          <p className="text-slate-900 font-black text-sm tracking-tight truncate leading-tight">{value || "UNSPECIFIED"}</p>
        </div>
      </div>
    );
  };

  if (!user || Object.keys(user).length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Identity Node...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans tracking-tight">
      
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-20 pb-40 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-linear-to-bl from-blue-600/5 via-blue-400/5 to-transparent opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            
            {/* Avatar with Ring */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-linear-to-tr from-blue-600/20 to-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative w-44 h-44 rounded-[2.5rem] bg-white border-4 border-white overflow-hidden shadow-2xl flex items-center justify-center ring-1 ring-slate-100 ring-offset-4 ring-offset-white">
                {user.profileImage ? (
                  <img
		                src={`https://ems.wordlanetech.com/${user.profileImage.replace(/^\/+/, "")}`}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    <span className="text-6xl font-black text-slate-200 tracking-tighter">
                      {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                    </span>
                  </div>
                )}
                <label
                  htmlFor="profileImageInput"
                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer border-2 border-dashed border-white/20 rounded-[2.5rem]"
                >
                  <FiCamera className="text-white text-3xl mb-2 animate-bounce" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest text-center px-4">
                    Update Bio-Image
                  </span>
                </label>

                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                />
                {/* <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer border-2 border-dashed border-white/20 rounded-[2.5rem]">
                   <FiCamera className="text-white text-3xl mb-2 animate-bounce" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest text-center px-4">Update Bio-Image</span>
                </label> */}
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <span className="px-4 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10">
                  {user.role || "Official"}
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80">Online & Verified</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                {user.name || "Enterprise User"}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                  <FiBriefcase className="text-blue-500" /> {user.designation || "Core Specialist"} 
                </p>
                <div className="h-1 w-1 bg-slate-300 rounded-full" />
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                  <FiLayers className="text-blue-500" /> {user.department || "Organization"}
                </p>
                <div className="h-1 w-1 bg-slate-300 rounded-full" />
                <p className="text-slate-500 text-sm font-bold flex items-center gap-2 font-mono">
                  <FiGlobe className="text-blue-500" /> {user.employeeId || "X-IDENT-000"}
                </p>
              </div>
            </div>

            <div className="md:ml-auto flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-8 md:mt-0">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                  <FiShield className="text-emerald-500" /> Enterprise Encrypted
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Details Section */}
      <div className="flex-1 -mt-24 px-4 md:px-8 pb-12 max-w-6xl mx-auto w-full z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content Grid */}
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailField label="Personnel Identifier" value={user.employeeId} icon={<FiUser />} accent="blue" />
              <DetailField label="Corporate Email" value={user.email} icon={<FiMail />} accent="purple" />
              <DetailField label="Mobile Uplink" value={user.phone} icon={<FiPhone />} accent="emerald" />
              <DetailField label="Work Station" value={user.location || user.address} icon={<FiMapPin />} accent="orange" />
              <DetailField label="Official Activation" value={user.joining_date ? new Date(user.joining_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'} icon={<FiCalendar />} accent="blue" />
              <DetailField label="Security Privilege" value={user.role} icon={<FiShield />} accent="purple" />
              <DetailField label="Org Unit" value={user.department} icon={<FiBriefcase />} accent="emerald" />
              <DetailField label="Professional Grade" value={user.designation} icon={<FiLayers />} accent="orange" />
            </div>

            {/* Performance Snapshot */}
            <div className="erp-card bg-white/80 backdrop-blur-md p-8 border-slate-200/60 shadow-xl shadow-slate-200/20">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <FiActivity size={20} />
                     </div>
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Performance Intelligence</h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-time Telemetry</span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                     <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">94.2%</span>
                        <span className="text-[10px] font-bold text-emerald-500 mb-0.5">+1.2%</span>
                     </div>
                     <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                     <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">98.5%</span>
                        <span className="text-[10px] font-bold text-blue-500 mb-0.5">Optimal</span>
                     </div>
                     <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '98%' }} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Cycle</p>
                     <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none">4.2d</span>
                        <span className="text-[10px] font-bold text-blue-500 mb-0.5">-0.5d</span>
                     </div>
                     <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '85%' }} />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <div className="erp-card bg-linear-to-br from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
              <h3 className="text-[10px] font-black mb-6 flex items-center gap-3 tracking-[0.3em] text-blue-400 uppercase">
                Node Status
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uplink</span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">Secure</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latency</span>
                  <span className="text-[10px] font-black text-blue-400 uppercase">24ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privilege</span>
                  <span className="text-[10px] font-black text-yellow-400 uppercase">{user.role || 'Level 1'}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-700/50">
                 <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <FiClock /> Viewing Security Logs
                 </button>
              </div>
            </div>

            <div className="erp-card p-8 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-xl shadow-slate-200/20">
               <h3 className="text-[10px] font-black mb-6 flex items-center gap-3 tracking-[0.2em] text-slate-400 uppercase">
                Activity Stream
              </h3>
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-lg shadow-blue-500/50" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-slate-900 tracking-tight leading-none uppercase">System Access Authorized</span>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase">March 0{i + 1}, 2024</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>


      <Footer />
    </div>
  );
};

export default ProfilePage;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Logo from "../../assets/logo.png";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";
import { FaRegUser } from "react-icons/fa6";
import { getErrorMessage } from "../../utils/errorUtils";
import { toast } from "react-toastify";

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(
        "/users/login",
        {
          employeeId,
          password,
          role,
        }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[900px] flex bg-white rounded-xl shadow-xl shadow-slate-200/40 overflow-hidden border border-slate-200">
          
          {/* Form Side */}
          <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img src={Logo} alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Wordlane Tech</span>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to ERP</h1>
              <p className="text-sm text-slate-500">Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Employee ID</label>
                <div className="relative">
                  <FaRegUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="E.g. EMP1234"
                    className="erp-input pl-10 h-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="erp-input pl-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {["employee", "manager", "hr", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-10 px-3 rounded-md border text-sm font-medium transition-all ${
                        role === r
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full erp-button-primary h-11 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue to Workspace</span>
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center">
                Need help accessing your account? <button className="text-blue-600 font-semibold hover:underline">Contact Support</button>
              </p>
            </div>
          </div>

          {/* Decorative Side */}
          <div className="hidden md:flex md:w-[45%] bg-slate-900 relative p-12 flex-col justify-end">
            <div className="absolute top-0 right-0 p-24 opacity-20 pointer-events-none">
               <div className="w-64 h-64 border-40 border-slate-700 rounded-full" />
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-1 bg-blue-500 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Secure Enterprise Portal</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Experience streamlined resource management and enterprise-grade security within a centralized workflow.
              </p>
            </div>
            
            <div className="absolute bottom-12 right-12 text-slate-700 font-mono text-[10px] uppercase tracking-[0.2em] pointer-events-none">
              v2.4.0-STABLE
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">&copy; 2025 Wordlane Tech. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;

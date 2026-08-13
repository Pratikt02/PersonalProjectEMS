import axios from "axios";import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  withCredentials: true,
});

// Request interceptor: add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isSilent = error.config?._silentFail;
    
    // Auto logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      // Use hash router path correctly
      if (!window.location.hash.includes('#/login')) {
        window.location.hash = '#/login';
      }
    } else if (!isSilent && error.response) {
      // Show toast if not a silent failure
      const message = error.response.data?.message || "An unexpected error occurred";
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export const API = api; // Alias for compatibility
export default api;

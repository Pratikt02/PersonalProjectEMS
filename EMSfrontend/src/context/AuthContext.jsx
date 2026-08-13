// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

// Create the context
const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTime, setLoginTime] = useState("");
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [logoutTime, setLogoutTime] = useState("");

  // ✅ Clear auth state
  const clearAuthState = () => {
    setUser(null);
    setIsLoggedIn(false);
    setLoginTime("");
    setAttendanceRecord(null);
    setLogoutTime("");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("attendanceLoginTime");
    localStorage.removeItem("attendanceRecord");
    localStorage.removeItem("attendanceLogoutTime");
  };

  // ✅ Load state from localStorage on startup
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setUser(JSON.parse(storedUser));
      }

      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);

      const storedLoginTime = localStorage.getItem("attendanceLoginTime");
      if (storedLoginTime) setLoginTime(storedLoginTime);

      const storedRecord = localStorage.getItem("attendanceRecord");
      if (storedRecord) setAttendanceRecord(JSON.parse(storedRecord));

      const storedLogoutTime = localStorage.getItem("attendanceLogoutTime");
      if (storedLogoutTime) setLogoutTime(storedLogoutTime);
    } catch (error) {
      console.error("Failed to load auth state from localStorage:", error);
      clearAuthState();
    }
  }, []);

  // ✅ Sync user
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // ✅ Sync isLoggedIn
  useEffect(() => {
    if (isLoggedIn) localStorage.setItem("isLoggedIn", "true");
    else localStorage.removeItem("isLoggedIn");
  }, [isLoggedIn]);

  // ✅ Sync loginTime
  useEffect(() => {
    if (loginTime) localStorage.setItem("attendanceLoginTime", loginTime);
    else localStorage.removeItem("attendanceLoginTime");
  }, [loginTime]);

  // ✅ Sync attendanceRecord
  useEffect(() => {
    if (attendanceRecord)
      localStorage.setItem("attendanceRecord", JSON.stringify(attendanceRecord));
    else localStorage.removeItem("attendanceRecord");
  }, [attendanceRecord]);

  // ✅ Sync logoutTime
  useEffect(() => {
    if (logoutTime) localStorage.setItem("attendanceLogoutTime", logoutTime);
    else localStorage.removeItem("attendanceLogoutTime");
  }, [logoutTime]);

  const value = {
    user,
    isLoggedIn,
    loginTime,
    attendanceRecord,
    logoutTime,
    setUser,
    setIsLoggedIn,
    setLoginTime,
    setAttendanceRecord,
    setLogoutTime,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => useContext(AuthContext);

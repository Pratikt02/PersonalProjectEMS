import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CompanyLogo from "../assets/logo.png";
import { GrDocumentMissing } from "react-icons/gr";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Search,
  HelpCircle,
  Home,
  Users,
  BriefcaseBusiness,
  CheckSquare,
  UserCheck,
  CalendarOff,
  DollarSign,
  CalendarDays,
  MessageCircle,
} from "lucide-react";

import { API } from "../api/api";

import {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  deleteOneNotification,
} from "../api/notificationApi";

// ✅ Safe Helper
const getUserSafe = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // ✅ Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [messengerCount, setMessengerCount] = useState(0);
  const [messengerUnreadTotal, setMessengerUnreadTotal] = useState(0);
  const [messengerUnreadChats, setMessengerUnreadChats] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const user = getUserSafe();
  const token = localStorage.getItem("token");
  const userId = user?._id || user?.id;

  const { role, employeeId, name, profileImage } = user || {
    role: "guest",
    employeeId: "",
    name: "Guest",
    profileImage: "",
  };

  // ✅ Fetch Notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoadingNotifs(true);
      const res = await getMyNotifications(token, 1, 10);
      setNotifications(res?.data?.data || []);
    } catch (err) {
      console.log("❌ Notification fetch error:", err?.response?.data || err.message);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // ✅ Fetch Unread Count
  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await getUnreadCount(token);
      setUnreadCount(res?.data?.unread || 0);
    } catch (err) {
      console.log("❌ Unread count error:", err?.response?.data || err.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllRead(token);
      await fetchNotifications();
      await fetchUnread();
    } catch (err) {
      console.log("❌ Mark all read error:", err?.response?.data || err.message);
    }
  };

  const handleMarkRead = async (id) => {
    if (!token || !id) return;
    try {
      await markOneRead(token, id);
      await fetchNotifications();
      await fetchUnread();
    } catch (err) {
      console.log("❌ Mark read error:", err?.response?.data || err.message);
    }
  };

  const handleDeleteNotif = async (id) => {
    if (!token || !id) return;
    try {
      await deleteOneNotification(token, id);
      await fetchNotifications();
      await fetchUnread();
    } catch (err) {
      console.log("❌ Delete notification error:", err?.response?.data || err.message);
    }
  };

  // ✅ Initial Load
  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchUnread();
      API.get("/messenger/users", { _silentFail: true })
        .then((res) => setMessengerCount(res.data?.count || 0))
        .catch(() => {});
      // fetch messenger unread counts
      const fetchMessengerCounts = async () => {
        try {
          const res = await API.get("/messenger/conversations", { _silentFail: true });
          const convs = res.data?.conversations || [];
          const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          const chatsWithUnread = convs.filter((c) => (c.unreadCount || 0) > 0).length;
          setMessengerUnreadTotal(totalUnread);
          setMessengerUnreadChats(chatsWithUnread);
        } catch (e) {}
      };

      fetchMessengerCounts();

      const timer = setInterval(fetchMessengerCounts, 5000);
      return () => clearInterval(timer);
    }
  }, [token]);

  // ✅ Logout Handler (removed socket.disconnect)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/");
  };

  // ✅ close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Menu Items - Grouped and Cleaned
 const menuItems = [
  { name: "Overview", path: "/dashboard", icon: Home },
  { name: "Projects", path: "/projects", icon: BriefcaseBusiness },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Messenger", path: "/messenger", icon: MessageCircle, count: messengerCount },
  { name: "Leave", path: "/leave", icon: CalendarOff },
  { name: "Calendar", path: "/calendar", icon: CalendarDays },
  
  ...(role === "admin" || role === "hr" ? [{ name: "Personnel", path: "/employees", icon: Users }] : []),
  ...(role === "admin" || role === "manager" || role === "hr" || role === "employee"? [{ name: "Presence", path: "/attendance", icon: UserCheck }]: []),
  ...(role === "admin" || role === "hr" ? [{ name: "Payroll", path: "/payroll", icon: DollarSign }] : []),

];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .h-screen.flex.flex-col > .flex-1 {
            padding-left: 15rem;
          }
        }
      `}</style>

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200 flex-col">
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shadow-sm border border-slate-200 overflow-hidden">
              <img src={CompanyLogo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Wordlane Tech</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-7 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-md transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} strokeWidth={1.9} />
                <span className="flex-1">{item.name}</span>
                {item.name === "Messenger" && item.count > 0 && (
                  <>
                    {messengerUnreadTotal > 0 ? (
                      <span className="min-w-6 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {messengerUnreadTotal > 99 ? "99+" : messengerUnreadTotal}
                      </span>
                    ) : (
                      <span className="min-w-6 h-5 px-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                        {item.count > 99 ? "99+" : item.count}
                      </span>
                    )}

                    {messengerUnreadChats > 0 && (
                      <span className="absolute left-3 top-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full h-11 border border-red-100 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 w-full lg:pl-60 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center h-14 lg:h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-8 shrink-0 lg:hidden">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shadow-lg border border-slate-200 overflow-hidden">
                <img src={CompanyLogo} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">Wordlane Tech</span>
            </Link>
          </div>

          {/* Search Bar - ERP Standard */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search modules, tasks, or users..." 
                className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all"
              />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-md transition-colors relative hidden sm:block">
              <HelpCircle size={20} />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    fetchNotifications();
                    fetchUnread();
                  }
                }}
                className={`p-2 rounded-md transition-all relative ${
                  showNotifications ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[350px] bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Synchronizing...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">System fully updated</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-4 transition-colors hover:bg-slate-50 group ${!n.isRead ? "bg-blue-50/30" : ""}`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="text-xs font-bold text-slate-900">{n.title}</p>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-normal line-clamp-2">{n.message}</p>
                                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!n.isRead && (
                                    <button onClick={() => handleMarkRead(n._id)} className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline">Read</button>
                                  )}
                                  <button onClick={() => handleDeleteNotif(n._id)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-red-500 transition-colors">Dismiss</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Profile Section */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`flex items-center gap-2 p-1 pl-2 rounded-md transition-all ${
                  showProfileDropdown ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none mb-1">{name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{role}</p>
                </div>
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={`https://ems.wordlanetech.com/${profileImage.replace(/^\/+/, "")}`}
                      // src={
                      //   profileImage?.startsWith("http")
                      //     ? profileImage
                      //     : `https://ems.wordlanetech.com${profileImage}`
                      // }
                      //src={`https://emsbackend-1-c3ed.onrender.com${profileImage}`}
                      alt="Profile"
                      className="w-8 h-8 rounded shadow-sm object-cover grayscale-20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {name?.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-4 bg-slate-50/50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                        {profileImage ? (
                            <img
                              src={`https://ems.wordlanetech.com/${profileImage.replace(/^\/+/, "")}`}
                              // src={
                              //   profileImage?.startsWith("http")
                              //     ? profileImage
                              //     : `https://ems.wordlanetech.com/${profileImage.replace(/^\/+/, "")}`
                              // }
                              alt="profile"
                              className="w-8 h-8 rounded shadow-sm object-cover grayscale-20"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center">
                              {name?.charAt(0)}
                            </div>
                          )}

                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{employeeId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenu && (
        <div className="lg:hidden bg-white border-t border-slate-200 py-2 shadow-xl animate-in fade-in slide-in-from-top-1">
          <div className="px-4 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-between group ${
                  isActive(item.path) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} />
                  {item.name}
                  {item.name === "Messenger" && item.count > 0 && (
                    <span className={`min-w-5 h-5 px-1.5 rounded-full text-[9px] font-bold flex items-center justify-center ${isActive(item.path) ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </span>
                <ChevronDown size={14} className={`-rotate-90 opacity-40 group-hover:opacity-100 transition-all ${isActive(item.path) ? "opacity-100" : ""}`} />
              </Link>
              );
            })}
          </div>
        </div>
      )}
      </header>
    </>
  );
};

export default Navbar;

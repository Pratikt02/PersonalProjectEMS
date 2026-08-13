import React, { useEffect, useState } from "react";
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from "../api/notificationApi";

export default function NotificationBell({ token }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await fetchMyNotifications(token, 1, 10);
      setNotifications(res.data.data || []);
    } catch (err) {
      console.log("fetchMyNotifications error:", err.message);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await fetchUnreadCount(token);
      setUnread(res.data.unread || 0);
    } catch (err) {
      console.log("fetchUnreadCount error:", err.message);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(token);
    loadNotifications();
    loadUnreadCount();
  };

  const handleReadOne = async (id) => {
    await markNotificationRead(token, id);
    loadNotifications();
    loadUnreadCount();
  };

  const handleDelete = async (id) => {
    await deleteNotification(token, id);
    loadNotifications();
    loadUnreadCount();
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 🔔 Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              marginLeft: "6px",
              fontSize: "12px",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ✅ Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "35px",
            right: "0px",
            width: "320px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "10px",
            zIndex: 999,
            boxShadow: "0px 5px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Notifications</b>

            <button
              onClick={handleMarkAllRead}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "blue",
              }}
            >
              Mark all read
            </button>
          </div>

          <hr />

          {notifications.length === 0 ? (
            <p style={{ fontSize: "14px" }}>No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  background: n.isRead ? "#f5f5f5" : "#e6f7ff",
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b style={{ fontSize: "14px" }}>{n.title}</b>

                  <button
                    onClick={() => handleDelete(n._id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "red",
                      fontSize: "14px",
                    }}
                  >
                    ✖
                  </button>
                </div>

                <p style={{ margin: "5px 0", fontSize: "13px" }}>{n.message}</p>

                <small style={{ fontSize: "11px", color: "gray" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </small>

                {!n.isRead && (
                  <div>
                    <button
                      onClick={() => handleReadOne(n._id)}
                      style={{
                        marginTop: "6px",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        borderRadius: "6px",
                        background: "#000",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    >
                      Mark as read
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

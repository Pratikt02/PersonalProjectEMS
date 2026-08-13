import api from "./api";

const getTokenHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ✅ My Notifications
export const getMyNotifications = (token, page = 1, limit = 10) => {
  return api.get(`/notifications/my?page=${page}&limit=${limit}`, getTokenHeader(token));
};

// ✅ Unread Count
export const getUnreadCount = (token) => {
  return api.get(`/notifications/unread-count`, getTokenHeader(token));
};

// ✅ Mark all read
export const markAllRead = (token) => {
  return api.put(`/notifications/read-all`, {}, getTokenHeader(token));
};

// ✅ Mark one read
export const markOneRead = (token, id) => {
  return api.put(`/notifications/read/${id}`, {}, getTokenHeader(token));
};

// ✅ Delete one notification
export const deleteOneNotification = (token, id) => {
  return api.delete(`/notifications/${id}`, getTokenHeader(token));
};

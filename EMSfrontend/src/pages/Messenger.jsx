import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { API } from "../api/api";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitials = (name = "User") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const Messenger = () => {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?._id || currentUser?.id;

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("Company Announcement");
  const [broadcastText, setBroadcastText] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [showGroup, setShowGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("New Group");
  const [groupSelectedRecipients, setGroupSelectedRecipients] = useState([]);
  const [groupUserSearch, setGroupUserSearch] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [listTab, setListTab] = useState("recent");
  const [showInfo, setShowInfo] = useState(false);
  const [infoSearch, setInfoSearch] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const messageEndRef = useRef(null);
  const messageRequestRef = useRef(0);

  const loadUsers = useCallback(async () => {
    const response = await API.get("/messenger/users", { _silentFail: true });
    setUsers(response.data?.users || []);
  }, []);

  const loadConversations = useCallback(async () => {
    const response = await API.get("/messenger/conversations", {
      _silentFail: true,
    });

    const next = response.data?.conversations || [];

    // Notify on new unread messages for conversations not currently open.
    try {
      if (window?.Notification && Notification.permission === "granted") {
        const prevMap = (window.__prevConversations || []).reduce((acc, c) => {
          acc[c._id] = c.unreadCount || 0;
          return acc;
        }, {});

        next.forEach((c) => {
          const prev = prevMap[c._id] || 0;
          const now = c.unreadCount || 0;
          if (now > prev && String(selectedConversationId) !== String(c._id)) {
            try {
              new Notification(getConversationName(c), {
                body: c.lastMessageText || "New message",
              });
            } catch (e) {}
          }
        });
      }
    } catch (e) {}

    window.__prevConversations = next;

    setConversations(next);

    // IMPORTANT:
    // This function only refreshes the conversation list.
    // It must NEVER change selectedConversationId.
    //
    // Previously, the polling refresh could change the selected chat
    // while the user was clicking another employee. That caused the
    // first employee to stop opening repeatedly.
    return next;
  }, []);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId) return;

    const normalizedId = String(conversationId);
    const requestId = ++messageRequestRef.current;

    try {
      if (!silent) setMessagesLoading(true);

      const response = await API.get(
        `/messenger/conversations/${normalizedId}/messages`,
        {
          _silentFail: true,
        }
      );

      // Do not allow an older request to overwrite the chat
      // that the user selected afterwards.
      if (requestId !== messageRequestRef.current) return;

      setMessages(response.data?.messages || []);
    } catch (error) {
      if (requestId === messageRequestRef.current) {
        console.error("Messenger message load error", error);
      }
    } finally {
      if (!silent && requestId === messageRequestRef.current) {
        setMessagesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      try {
        setLoading(true);

        const [_, initialConversations] = await Promise.all([
          loadUsers(),
          loadConversations(),
        ]);

        if (
          !cancelled &&
          !selectedConversationId &&
          initialConversations.length > 0
        ) {
          setSelectedConversationId(
            String(initialConversations[0]._id)
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load Messenger");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadUsers, loadConversations]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
    setShowMobileList(false);

    const timer = setInterval(() => {
      loadMessages(selectedConversationId, true);
    }, 2500);

    return () => clearInterval(timer);
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations().catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          String(conversation._id) ===
          String(selectedConversationId)
      ) || null,
    [conversations, selectedConversationId]
  );

  const isConversationAdmin = (activeConversation?.admins || []).map(a => String(a._id || a)).includes(String(currentUserId));

  const getConversationName = (conversation) => {
    if (!conversation) return "Messenger";
    if (conversation.type === "broadcast") return conversation.title || "Company Announcement";
    if (conversation.type === "group") return conversation.title || "Group";
    const other = conversation.participants?.find(
      (participant) => (participant._id || participant.id) !== currentUserId
    );
    return other?.name || "Employee";
  };

  const getConversationSubtitle = (conversation) => {
    if (!conversation) return "Select a conversation";
    if (conversation.type === "broadcast") {
      const count = Math.max((conversation.participants?.length || 1) - 1, 0);
      return `${count} employee${count === 1 ? "" : "s"}`;
    }
    if (conversation.type === "group") {
      const count = Math.max((conversation.participants?.length || 1) - 1, 0);
      return `${count} member${count === 1 ? "" : "s"}`;
    }
    const other = conversation.participants?.find(
      (participant) => (participant._id || participant.id) !== currentUserId
    );
    return other?.designation || other?.role || "Employee";
  };

  const filteredConversations = conversations.filter((conversation) => {
    const name = getConversationName(conversation).toLowerCase();
    const last = conversation.lastMessageText?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || last.includes(search.toLowerCase());
  });

  const filteredUsers = users.filter((user) => {
    if ((user._id || user.id) === currentUserId) return false;
    const text = `${user.name} ${user.employeeId || ""} ${user.designation || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const broadcastUsers = users.filter((user) => {
    if ((user._id || user.id) === currentUserId || user.role === "admin") return false;
    const text = `${user.name} ${user.employeeId || ""} ${user.department || ""}`.toLowerCase();
    return text.includes(userSearch.toLowerCase());
  });

  const groupsList = conversations.filter((c) => {
    if (c.type !== "group") return false;
    // show group only to admins or participants of the group
    if (isAdmin) return true;
    const participants = c.participants || [];
    return participants.some((p) => String(p._id || p.id) === String(currentUserId));
  });

  const selectedConversationParticipants = activeConversation?.participants || [];

  /*
   * Open a conversation directly.
   *
   * IMPORTANT:
   * We set the selected conversation BEFORE refreshing the
   * conversation list. This makes switching A -> B -> A reliable.
   */
  const openConversation = async (conversationId) => {
    if (!conversationId) return;

    const id = String(conversationId);

    // Invalidate any message request belonging to the previous chat.
    messageRequestRef.current += 1;

    // Clear old chat immediately so messages from the previous
    // employee cannot remain visible while the new chat loads.
    setMessages([]);
    setMessagesLoading(true);

    setSelectedConversationId(id);
    setShowMobileList(false);

    try {
      await loadMessages(id);
    } finally {
      // loadMessages already controls this state for the latest request.
    }
  };

  const deleteMessageById = async (messageId) => {
    if (!messageId) return;

    try {
      await API.delete(`/messenger/messages/${messageId}`);
      // Refresh current chat and conversations
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete message");
    }
  };

  const startEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.text || "");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEdit = async (messageId) => {
    const text = String(editingText || "").trim();
    if (!text) return;
    try {
      await API.patch(`/messenger/messages/${messageId}`, { text });
      setEditingMessageId(null);
      setEditingText("");
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to edit message");
    }
  };

  const openPrivateChat = async (userId) => {
    try {
      const response = await API.post(
        "/messenger/conversations/private",
        { userId }
      );

      const conversation = response.data?.conversation;

      if (!conversation?._id) {
        toast.error("Unable to open conversation");
        return;
      }

      // Open the chat immediately.
      await openConversation(conversation._id);

      // Refresh the list AFTER the chat is selected.
      await loadConversations();

      setSearch("");
    } catch (error) {
      console.error("Open private chat error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to start chat"
      );
    }
  };

  const sendCurrentMessage = async (event) => {
    event?.preventDefault();
    const text = messageText.trim();
    if (!selectedConversationId || sending || (!text && attachments.length === 0)) return;

    try {
      setSending(true);
      let response;
      if (attachments.length > 0) {
        const form = new FormData();
        form.append("text", text);
        attachments.forEach((file) => form.append("attachments", file));
        // Do not set Content-Type header here; the browser will add the correct boundary.
        response = await API.post(`/messenger/conversations/${selectedConversationId}/messages`, form);
      } else {
        response = await API.post(`/messenger/conversations/${selectedConversationId}/messages`, { text });
      }
      setMessageText("");
      setAttachments([]);
      await loadMessages(selectedConversationId, true);
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const toggleRecipient = (id) => {
    setSelectedRecipients((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  };

  const allBroadcastUserIds = users
    .filter((user) => (user._id || user.id) !== currentUserId && user.role !== "admin")
    .map((user) => user._id || user.id);

  const allSelected = allBroadcastUserIds.length > 0 && selectedRecipients.length === allBroadcastUserIds.length;

  const toggleSelectAll = () => {
    setSelectedRecipients(allSelected ? [] : allBroadcastUserIds);
  };

  const sendBroadcast = async (event) => {
    event.preventDefault();
    if (!broadcastText.trim()) return;

    try {
      setSending(true);
      const response = await API.post("/messenger/conversations/broadcast", {
        title: broadcastTitle,
        message: broadcastText.trim(),
        recipientIds: selectedRecipients,
      });
      toast.success(`Message sent to ${response.data?.recipientCount || "selected"} employees`);
      setBroadcastText("");
      setBroadcastTitle("Company Announcement");
      setSelectedRecipients([]);
      setShowBroadcast(false);
      await loadConversations();
      if (response.data?.conversationId) {
        await openConversation(response.data.conversationId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send company message");
    } finally {
      setSending(false);
    }
  };

  const toggleGroupRecipient = (id) => {
    setGroupSelectedRecipients((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  };

  const createGroup = async (event) => {
    event.preventDefault();
    if (!groupTitle.trim() || groupSelectedRecipients.length === 0) return toast.error("Provide a title and at least one member");

    try {
      setSending(true);
      const response = await API.post("/messenger/conversations/group", {
        title: groupTitle.trim(),
        participantIds: groupSelectedRecipients,
      });

      toast.success("Group created");
      setGroupTitle("New Group");
      setGroupSelectedRecipients([]);
      setShowGroup(false);
      await loadConversations();

      if (response.data?.conversation?._id) {
        await openConversation(response.data.conversation._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create group");
    } finally {
      setSending(false);
    }
  };

  const renderAvatar = (person, size = "w-10 h-10") => {
    const image = person?.profileImage;
    const src = image
      ? image.startsWith("http")
        ? image
        : `https://ems.wordlanetech.com/${image.replace(/^\/+/, "")}`
      : null;

    return src ? (
      <img src={src} alt="" className={`${size} rounded-full object-cover border border-slate-200`} />
    ) : (
      <div className={`${size} rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100`}>
        {getInitials(person?.name)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 p-4 md:p-6">
        <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-2xl h-[calc(100vh-7rem)] flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="mx-auto text-blue-500 mb-3 animate-pulse" size={34} />
            <p className="text-sm font-semibold text-slate-600">Loading Messenger...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="max-w-[1500px] mx-auto h-[calc(100vh-7rem)] min-h-[620px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex">
        {/* Conversation / employee list */}
        <aside className={`${showMobileList ? "flex" : "hidden"} md:flex w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-slate-200 flex-col bg-white`}>
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={21} className="text-blue-600" />
                  <h1 className="text-xl font-bold text-slate-900">Messenger</h1>
                </div>
                <p className="text-xs text-slate-500 mt-1">{users.length} active people in Messenger</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowBroadcast(true)}
                  className="h-9 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition"
                >
                  <Plus size={15} />
                  Broadcast
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowGroup(true)}
                  className="ml-2 h-9 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition"
                >
                  <Users size={15} />
                  Create Group
                </button>
              )}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations or employees..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setListTab('recent')} className={`px-3 py-1 rounded-md text-sm font-semibold ${listTab === 'recent' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>Recent</button>
              <button type="button" onClick={() => setListTab('groups')} className={`px-3 py-1 rounded-md text-sm font-semibold ${listTab === 'groups' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>Groups</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listTab === 'recent' && filteredConversations.filter(c => c.type !== 'group').length > 0 && (
              <div className="px-3 pt-3">
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent chats</p>
                {filteredConversations.filter(c => c.type !== 'group').map((conversation) => {
                  const active =
                    String(conversation._id) ===
                    String(selectedConversationId);
                  const other = conversation.participants?.find(
                    (participant) => (participant._id || participant.id) !== currentUserId
                  );
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => {
                        openConversation(conversation._id);
                      }}
                      className={`w-full text-left p-3 rounded-xl flex gap-3 mb-1 transition ${
                        active ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {conversation.type === "broadcast" ? (
                        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center">
                          <Users size={18} />
                        </div>
                      ) : (
                        renderAvatar(other)
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${active ? "text-blue-700" : "text-slate-800"}`}>
                            {getConversationName(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {conversation.lastMessageText || getConversationSubtitle(conversation)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {listTab === 'groups' && groupsList.length > 0 && (
              <div className="px-3 pt-3">
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Groups</p>
                {groupsList.map((conversation) => {
                  const active = String(conversation._id) === String(selectedConversationId);
                  return (
                    <button key={conversation._id} onClick={() => openConversation(conversation._id)} className={`w-full text-left p-3 rounded-xl flex gap-3 mb-1 transition ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                      <div className="w-10 h-10 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${active ? "text-blue-700" : "text-slate-800"}`}>{conversation.title || getConversationName(conversation)}</p>
                          {conversation.unreadCount > 0 && (<span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>)}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{conversation.lastMessageText || `${(conversation.participants?.length || 1) - 1} members`}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="px-3 pt-4 pb-3">
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Start a chat</p>
              {filteredUsers.map((user) => (
                <button
                  key={user._id || user.id}
                  onClick={() => openPrivateChat(user._id || user.id)}
                  className="w-full text-left p-3 rounded-xl flex gap-3 hover:bg-slate-50 transition"
                >
                  {renderAvatar(user)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.designation || user.role} {user.employeeId ? `• ${user.employeeId}` : ""}
                    </p>
                  </div>
                  <MessageCircle size={16} className="text-slate-300 mt-2" />
                </button>
              ))}

              {filteredConversations.length === 0 && filteredUsers.length === 0 && (
                <div className="text-center py-14 px-5 text-slate-400">
                  <Search size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No people or chats found</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Chat */}
        <section className={`${showMobileList ? "hidden" : "flex"} md:flex flex-1 min-w-0 flex-col bg-slate-50`}>
          {activeConversation ? (
            <>
              <header className="h-[72px] shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-6">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <ArrowLeft size={18} />
                </button>
                {activeConversation.type === "broadcast" ? (
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
                    <Users size={18} />
                  </div>
                ) : activeConversation.type === "group" ? (
                  activeConversation.profileImage ? (
                    <img src={activeConversation.profileImage} alt="group" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                      {getInitials(activeConversation.title || "Group")}
                    </div>
                  )
                ) : (
                  renderAvatar(
                    selectedConversationParticipants.find(
                      (participant) => (participant._id || participant.id) !== currentUserId
                    )
                  )
                )}
                <div className="min-w-0 flex-1">
                  <h2
                    onClick={() => {
                      if (activeConversation?.type === "group") setShowInfo(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && activeConversation?.type === "group") setShowInfo(true);
                    }}
                    tabIndex={activeConversation?.type === "group" ? 0 : -1}
                    className={`font-bold text-slate-900 truncate ${activeConversation?.type === "group" ? "cursor-pointer hover:underline" : ""}`}
                    title={activeConversation?.type === "group" ? "View group members" : undefined}
                  >
                    {getConversationName(activeConversation)}
                  </h2>
                  <p className="text-xs text-slate-400 truncate">{getConversationSubtitle(activeConversation)}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  {activeConversation?.type === "private" ? (
                    (() => {
                      const other = selectedConversationParticipants.find((p) => (p._id || p.id) !== currentUserId) || {};
                      const status = other.status || "offline";
                      const color = status === "active" ? "bg-green-500" : "bg-rose-400";
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 ${color} rounded-full`} />
                          <span className="text-xs text-slate-400">{status === "active" ? "Active" : "Offline"}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 bg-slate-300 rounded-full" />
                      Group
                    </div>
                  )}
                </div>
                <button onClick={() => setShowInfo(true)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50">
                  <MoreVertical size={18} />
                </button>
                {activeConversation?.type === "group" && (isAdmin || String(activeConversation.createdBy?._id || activeConversation.createdBy) === String(currentUserId)) && (
                  <button onClick={async () => {
                    if (!confirm('Delete this group? This will remove all messages.')) return;
                    try {
                      await API.delete(`/messenger/conversations/${activeConversation._id}`);
                      toast.success('Group deleted');
                      await loadConversations();
                      setSelectedConversationId(null);
                    } catch (e) {
                      toast.error(e.response?.data?.message || 'Unable to delete group');
                    }
                  }} className="ml-2 px-3 py-1 rounded-md text-sm bg-rose-50 text-rose-600 hover:bg-rose-100">Delete Group</button>
                )}
              </header>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                <div className="max-w-4xl mx-auto space-y-3">
                  {messagesLoading && messages.length === 0 ? (
                    <div className="text-center py-20 text-sm text-slate-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 rounded-full bg-white border border-slate-200 mx-auto flex items-center justify-center mb-3">
                        <MessageCircle className="text-blue-500" size={25} />
                      </div>
                      <p className="font-semibold text-slate-700">Start the conversation</p>
                      <p className="text-xs text-slate-400 mt-1">Send the first message below.</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const senderId = message.sender?._id || message.sender?.id;
                      const mine = senderId === currentUserId;
                      const previous = messages[index - 1];
                      const previousSender = previous?.sender?._id || previous?.sender?.id;
                      const showName = !mine && senderId !== previousSender;

                      // Determine seen/delivered state for my messages
                      let seen = false;
                      let seenCount = 0;
                      try {
                        const readBy = message.readBy || [];
                        const uniqueRead = Array.from(new Set(readBy.map((r) => String(r))));
                        seenCount = uniqueRead.filter((id) => id !== String(currentUserId)).length;

                        if (activeConversation?.type === "private") {
                          const other = selectedConversationParticipants.find((p) => (p._id || p.id) !== currentUserId);
                          const otherId = other?._id || other?.id;
                          if (otherId) {
                            seen = uniqueRead.includes(String(otherId));
                          }
                        } else {
                          // group/broadcast: consider seen if at least one other has read
                          seen = seenCount > 0;
                        }
                      } catch (e) {}

                      return (
                        <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[78%] flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                            {!mine && showName ? renderAvatar(message.sender, "w-8 h-8") : !mine ? <div className="w-8" /> : null}
                            <div>
                              {showName && (
                                <p className="text-[10px] font-bold text-slate-500 mb-1 ml-1">{message.sender?.name}</p>
                              )}

                              {editingMessageId === message._id ? (
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${mine ? "bg-blue-600 text-white rounded-br-md" : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"}`}>
                                  <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full rounded-md p-2 text-sm" rows={3} />
                                  <div className="mt-2 flex gap-2 justify-end">
                                    <button type="button" onClick={cancelEdit} className="px-3 py-1 rounded bg-slate-100 text-slate-700">Cancel</button>
                                    <button type="button" onClick={() => saveEdit(message._id)} className="px-3 py-1 rounded bg-blue-600 text-white">Save</button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                  mine
                                    ? "bg-blue-600 text-white rounded-br-md"
                                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
                                }`}>
                                  <div className="space-y-2">
                                    <div>{message.text}</div>
                                    {message.edited && <div className="text-[10px] text-slate-300">(edited)</div>}
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="mt-2 flex flex-col gap-2">
                                        {message.attachments.map((a, i) => (
                                          a.mimetype && a.mimetype.startsWith("image") ? (
                                            <img key={i} src={a.url} alt={a.filename || 'image'} className="w-48 rounded-md border" />
                                          ) : (
                                            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{a.filename || a.url}</a>
                                          )
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className={`mt-1 flex items-center gap-2 text-[9px] text-slate-400 ${mine ? "justify-end" : ""}`}>
                                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                {mine && (
                                  <>
                                    {activeConversation?.type === "private" ? (
                                      seen ? (
                                        <CheckCheck size={12} className="text-blue-400" />
                                      ) : (
                                        <Check size={12} className="text-slate-300" />
                                      )
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <CheckCheck size={12} className={seen ? "text-blue-400" : "text-slate-300"} />
                                        {seenCount > 0 && <span className="text-[10px] text-slate-400">{seenCount} seen</span>}
                                      </div>
                                    )}

                                    <div className="ml-2 flex items-center gap-1">
                                      <button type="button" onClick={() => startEditMessage(message)} className="text-[11px] text-slate-400 hover:text-slate-600">Edit</button>
                                      <button type="button" onClick={() => deleteMessageById(message._id)} className="text-[11px] text-rose-500 hover:text-rose-600">Delete</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messageEndRef} />
                </div>
              </div>

              <form onSubmit={sendCurrentMessage} className="shrink-0 bg-white border-t border-slate-200 p-3 md:p-4">
                <div className="max-w-4xl mx-auto">
                  {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          {file.type && file.type.startsWith("image") ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-16 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-28 h-10 flex items-center justify-center bg-white border rounded text-[11px] text-slate-600 truncate px-2">{file.name}</div>
                          )}
                          <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-rose-500">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <label className="w-10 h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                      <Paperclip size={16} />
                      <input type="file" multiple onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files).slice(0,5)])} className="hidden" />
                    </label>

                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendCurrentMessage(e);
                        }
                      }}
                      rows={1}
                      placeholder="Type a message..."
                      className="flex-1 max-h-32 min-h-11 resize-none rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                    />

                    <button
                      type="submit"
                      disabled={(!messageText.trim() && attachments.length === 0) || sending}
                      className="w-11 h-11 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Send size={17} />
                    </button>
                  </div>

                  <p className="max-w-4xl mx-auto text-[9px] text-slate-400 mt-1.5 px-1">Enter to send • Shift + Enter for a new line</p>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-sm mx-auto flex items-center justify-center mb-5">
                  <MessageCircle size={36} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Welcome to Messenger</h2>
                <p className="text-sm text-slate-500 mt-2">Select an employee to start a private chat.</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowBroadcast(true)}
                    className="mt-5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                  >
                    Send company announcement
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Admin broadcast modal */}
      {showBroadcast && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Send company message</h2>
                <p className="text-xs text-slate-400 mt-0.5">Send one message to all or selected employees.</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={sendBroadcast} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Title</label>
                <input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Company Announcement"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600">Recipients</label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {allSelected ? "Clear all" : "Select all employees"}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Find employee..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-300"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {broadcastUsers.map((user) => {
                    const id = user._id || user.id;
                    const checked = selectedRecipients.includes(id);
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => toggleRecipient(id)}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left ${checked ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      >
                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${checked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>
                          {checked && <Check size={13} />}
                        </span>
                        {renderAvatar(user, "w-8 h-8")}
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-slate-800 truncate">{user.name}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{user.designation || user.role} • {user.employeeId}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  {selectedRecipients.length === 0
                    ? "No selection means all active non-admin employees will receive the message."
                    : `${selectedRecipients.length} employee${selectedRecipients.length === 1 ? "" : "s"} selected`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Message</label>
                <textarea
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  rows={5}
                  placeholder="Write your announcement..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:bg-white focus:border-blue-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBroadcast(false)}
                  className="px-4 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!broadcastText.trim() || sending}
                  className="px-5 h-10 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-40"
                >
                  <Send size={15} />
                  Send message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin create group modal */}
      {showGroup && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Create Group</h2>
                <p className="text-xs text-slate-400 mt-0.5">Groups are created by admins. Add team members and set a title.</p>
              </div>
              <button onClick={() => setShowGroup(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createGroup} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Group Title</label>
                <input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Team name"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600">Members</label>
                </div>
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={groupUserSearch}
                    onChange={(e) => setGroupUserSearch(e.target.value)}
                    placeholder="Find employee..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-300"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {broadcastUsers.map((user) => {
                    const id = user._id || user.id;
                    const checked = groupSelectedRecipients.includes(id);
                    if (!String(user.name).toLowerCase().includes(groupUserSearch.toLowerCase())) return null;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => toggleGroupRecipient(id)}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left ${checked ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      >
                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${checked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>
                          {checked && <Check size={13} />}
                        </span>
                        {renderAvatar(user, "w-8 h-8")}
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-slate-800 truncate">{user.name}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{user.designation || user.role} • {user.employeeId}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">{groupSelectedRecipients.length} selected</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowGroup(false)} className="px-4 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={!groupTitle.trim() || groupSelectedRecipients.length === 0 || sending} className="px-5 h-10 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-40">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Conversation info modal */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Conversation Info</h2>
                <p className="text-xs text-slate-400 mt-0.5">Participants and details</p>
              </div>
              <button onClick={() => setShowInfo(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                  <div>
                    {activeConversation?.type === "group" && (
                      <div className="mb-3 flex items-center gap-4">
                        {activeConversation.profileImage ? (
                          <img src={activeConversation.profileImage} alt="group" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">{getInitials(activeConversation.title || "Group")}</div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                              {editingTitle ? (
                                <div className="flex gap-2 w-full">
                                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full h-9 px-3 rounded border border-slate-200" />
                                  <button onClick={async () => {
                                    const title = String(newTitle || "").trim();
                                    if (!title) return toast.error('Title cannot be empty');
                                    setInfoLoading(true);
                                    try {
                                      await API.patch(`/messenger/conversations/${activeConversation._id}`, { title });
                                      await loadConversations();
                                      setEditingTitle(false);
                                    } catch (e) {
                                      toast.error(e.response?.data?.message || 'Unable to update title');
                                    } finally { setInfoLoading(false); }
                                  }} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Save</button>
                                  <button onClick={() => { setEditingTitle(false); setNewTitle(""); }} className="px-3 py-1 rounded bg-slate-100 text-sm">Cancel</button>
                                </div>
                              ) : (
                                <div className="text-sm font-bold text-slate-900 truncate">{activeConversation.title || getConversationName(activeConversation)}</div>
                              )}
                              {!editingTitle && ((isAdmin) || (activeConversation?.admins || []).map(a => String(a._id || a)).includes(String(currentUserId)) || String(activeConversation?.createdBy?._id || activeConversation?.createdBy) === String(currentUserId)) && (
                                <button onClick={() => { setEditingTitle(true); setNewTitle(activeConversation.title || getConversationName(activeConversation)); }} className="ml-2 text-xs text-blue-600">Edit</button>
                              )}
                            </div>
                          <div className="text-xs text-slate-400">Group profile image</div>
                        </div>

                        {(isAdmin || String(activeConversation?.createdBy?._id || activeConversation?.createdBy) === String(currentUserId)) && (
                          <label className="px-3 py-1 rounded bg-slate-50 border border-slate-200 text-sm cursor-pointer">
                            {imageUploading ? 'Uploading...' : 'Change image'}
                            <input type="file" accept="image/*" onChange={async (e) => {
                              const file = e.target.files && e.target.files[0];
                              if (!file) return;
                              if (!confirm('Upload new group profile image?')) return;
                              setImageUploading(true);
                              try {
                                const form = new FormData();
                                form.append('profileImage', file);
                                await API.post(`/messenger/conversations/${activeConversation._id}/profile-image`, form);
                                await loadConversations();
                                toast.success('Group image updated');
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Unable to upload image');
                              } finally {
                                setImageUploading(false);
                                e.target.value = '';
                              }
                            }} className="hidden" />
                          </label>
                        )}
                      </div>
                    )}
                    {activeConversation?.type === "group" && (
                      <div className="mb-3">
                        <label className="text-xs font-bold text-slate-600">Add member</label>
                        <div className="relative mt-2">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={infoSearch} onChange={(e) => setInfoSearch(e.target.value)} placeholder="Find employee to add..." className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-300" />
                        </div>
                        <div className="max-h-36 overflow-y-auto mt-2 border border-slate-100 rounded-xl">
                          {users.filter(u => (u._id || u.id) !== currentUserId && u.role !== 'admin' && !(activeConversation?.participants || []).map(p=>String(p._id||p.id)).includes(String(u._id||u.id)) && String(u.name).toLowerCase().includes(infoSearch.toLowerCase())).map((u) => (
                            <div key={u._id || u.id} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50">
                              <div className="flex items-center gap-3">
                                {renderAvatar(u, "w-8 h-8")}
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-800 truncate">{u.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{u.designation || u.role}</div>
                                </div>
                              </div>
                              <div>
                                {(isAdmin || isConversationAdmin || String(activeConversation?.createdBy?._id || activeConversation?.createdBy) === String(currentUserId)) ? (
                                  <button onClick={async () => {
                                    if (!activeConversation?._id) return;
                                    setInfoLoading(true);
                                    try {
                                      await API.post(`/messenger/conversations/${activeConversation._id}/participants`, { participantId: u._id || u.id });
                                      await loadConversations();
                                      setInfoSearch("");
                                    } catch (e) {
                                      toast.error(e.response?.data?.message || 'Unable to add member');
                                    } finally { setInfoLoading(false); }
                                  }} className="px-3 py-1 rounded bg-blue-600 text-white text-xs">Add</button>
                                ) : (
                                  <div className="text-xs text-slate-400">Only admins can add</div>
                                )}
                              </div>
                            </div>
                          ))}
                          {users.filter(u => (u._id || u.id) !== currentUserId && u.role !== 'admin' && !(activeConversation?.participants || []).map(p=>String(p._id||p.id)).includes(String(u._id||u.id)) && String(u.name).toLowerCase().includes(infoSearch.toLowerCase())).length === 0 && (
                            <div className="p-3 text-[12px] text-slate-400">No employees to add</div>
                          )}
                        </div>
                      </div>
                    )}

                    {(activeConversation?.participants || []).map((p) => {
                      const isParticipantAdmin = (activeConversation?.admins || []).map(a => String(a._id || a)).includes(String(p._id || p.id));
                      const isCreator = String(p._id || p.id) === String(activeConversation?.createdBy?._id || activeConversation?.createdBy);
                      const adminCount = (activeConversation?.admins || []).length || 0;

                      return (
                        <div key={p._id || p.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                          {renderAvatar(p, "w-10 h-10")}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-800 truncate">{p.name}</div>
                              {isParticipantAdmin && <div className="text-[11px] text-green-600 font-semibold">Admin</div>}
                              <div className="text-[11px] text-slate-400">{p.designation || p.role}</div>
                            </div>
                            <div className="text-[11px] text-slate-400">{p.employeeId}</div>
                          </div>

                          {/* Admin controls: only visible to system admins */}
                          {activeConversation?.type === 'group' && isAdmin && (
                            <div className="flex items-center gap-2">
                              {!isCreator && (
                                isParticipantAdmin ? (
                                  <button onClick={async () => {
                                    if (!confirm(`Remove ${p.name} as admin?`)) return;
                                    setAdminActionLoading(true);
                                    try {
                                      await API.delete(`/messenger/conversations/${activeConversation._id}/admins/${p._id || p.id}`);
                                      await loadConversations();
                                    } catch (e) {
                                      toast.error(e.response?.data?.message || 'Unable to remove admin');
                                    } finally { setAdminActionLoading(false); }
                                  }} className="ml-2 px-3 py-1 rounded bg-rose-50 text-rose-600 text-xs">Remove admin</button>
                                ) : (
                                  <button onClick={async () => {
                                    if (!confirm(`Make ${p.name} an admin?`)) return;
                                    if (adminCount >= 5) return toast.error('Maximum of 5 admins allowed');
                                    setAdminActionLoading(true);
                                    try {
                                      await API.post(`/messenger/conversations/${activeConversation._id}/admins`, { adminId: p._id || p.id });
                                      await loadConversations();
                                    } catch (e) {
                                      toast.error(e.response?.data?.message || 'Unable to make admin');
                                    } finally { setAdminActionLoading(false); }
                                  }} className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-xs">Make admin</button>
                                )
                              )}
                            </div>
                          )}

                          {/* Remove member button for admins or group creator */}
                          {(activeConversation?.type === 'group') && (isAdmin || isConversationAdmin || String(activeConversation?.createdBy?._id || activeConversation?.createdBy) === String(currentUserId)) && !isCreator && (
                            <button onClick={async () => {
                              if (!confirm(`Remove ${p.name} from group?`)) return;
                              setInfoLoading(true);
                              try {
                                await API.delete(`/messenger/conversations/${activeConversation._id}/participants/${p._id || p.id}`);
                                await loadConversations();
                              } catch (e) {
                                toast.error(e.response?.data?.message || 'Unable to remove member');
                              } finally { setInfoLoading(false); }
                            }} className="ml-2 px-3 py-1 rounded bg-rose-50 text-rose-600 text-xs">Remove</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messenger;
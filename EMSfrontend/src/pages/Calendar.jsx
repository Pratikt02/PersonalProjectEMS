import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Gift,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";


const EVENT_TYPES = [
  { key: "Holiday", label: "Holidays", color: "red", icon: CalendarDays },
  { key: "Leave", label: "Leaves", color: "green", icon: CalendarDays },
  { key: "Company Event", label: "Company Events", color: "indigo", icon: Users },
  { key: "Birthday", label: "Birthdays", color: "pink", icon: Gift },
  { key: "Meeting", label: "Meetings", color: "orange", icon: Clock },
  { key: "Interview", label: "Interviews", color: "blue", icon: Briefcase },
  { key: "Payroll", label: "Payroll", color: "cyan", icon: DollarSign },
];

const COLORS = {
  red: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  green: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  indigo: { dot: "bg-indigo-600", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
  pink: { dot: "bg-pink-500", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-100" },
  orange: { dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
  blue: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  cyan: { dot: "bg-cyan-500", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100" },
};

const SEED_EVENTS = [
  { id: "e1", type: "Meeting", title: "Team Meeting", date: "2026-06-01", time: "11:00 AM" },
  { id: "e2", type: "Holiday", title: "Goa Day", date: "2026-06-02" },
  { id: "e3", type: "Birthday", title: "Rahul Birthday", date: "2026-06-03" },
  { id: "e4", type: "Meeting", title: "Client Call", date: "2026-06-07", time: "10:30 AM" },
  { id: "e5", type: "Meeting", title: "Project Review", date: "2026-06-09", time: "2:00 PM", endTime: "3:00 PM" },
  { id: "e6", type: "Interview", title: "Interview", date: "2026-06-15", time: "11:00 AM" },
  { id: "e7", type: "Company Event", title: "Annual Meetup", date: "2026-06-22", time: "10:00 AM" },
  { id: "e8", type: "Birthday", title: "Sneha Birthday", date: "2026-06-24" },
  { id: "e9", type: "Payroll", title: "Salary Credit", date: "2026-06-30" },
];

const SEED_LEAVES = [
  {
    id: "l1",
    name: "Aman",
    startDate: "2026-06-10",
    endDate: "2026-06-10",
    leaveType: "Casual Leave",
    reason: "Personal work",
    status: "Approved",
    approvedBy: "Shubham Kumar",
  },
  {
    id: "l2",
    name: "Rahul",
    startDate: "2026-06-23",
    endDate: "2026-06-25",
    leaveType: "Casual Leave",
    reason: "Family function",
    status: "Approved",
    approvedBy: "Shubham Kumar",
  },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STORAGE_KEY = "ems-calendar-events";
const DELETED_LEAVES_KEY = "ems-calendar-deleted-leaves";

const typeInfo = (type) => EVENT_TYPES.find((item) => item.key === type) || EVENT_TYPES[0];
const colorFor = (type) => COLORS[typeInfo(type).color];
const isoDate = (date) => date.toLocaleDateString("en-CA");
const formatLongDate = (iso) => new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
const formatShortDate = (iso) => new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const getInitialEvents = () => {
  try {
    const savedEvents = localStorage.getItem(STORAGE_KEY);
    return savedEvents ? JSON.parse(savedEvents) : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
};

const getDeletedLeaveIds = () => {
  try {
    const savedIds = JSON.parse(localStorage.getItem(DELETED_LEAVES_KEY) || "[]");
    return Array.isArray(savedIds) ? savedIds : [];
  } catch {
    return [];
  }
};

const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let index = startOffset - 1; index >= 0; index -= 1) {
    cells.push({ date: new Date(year, month - 1, daysInPreviousMonth - index), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
    nextDay += 1;
  }

  return cells;
};

const Calendar = () => {
  const today = new Date();
  const todayIso = isoDate(today);
  const [events, setEvents] = useState(getInitialEvents);
  const [leaves] = useState(SEED_LEAVES);
  const [deletedLeaveIds, setDeletedLeaveIds] = useState(getDeletedLeaveIds);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [view, setView] = useState("month");
  const [search, setSearch] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  const [filters, setFilters] = useState(
    EVENT_TYPES.reduce((acc, item) => ({ ...acc, [item.key]: true }), {})
  );
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Meeting",
    date: todayIso,
    time: "",
    description: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!event.target.closest(".calendar-add-menu")) setShowAddMenu(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const leaveEvents = useMemo(
    () =>
      leaves
        .filter((leave) => leave.status !== "Rejected" && !deletedLeaveIds.includes(leave.id))
        .map((leave) => ({
          id: leave.id,
          type: "Leave",
          title: `${leave.name} Leave`,
          date: leave.startDate,
          endDate: leave.endDate,
          leaveType: leave.leaveType,
          reason: leave.reason,
          status: leave.status,
          approvedBy: leave.approvedBy,
        })),
    [leaves, deletedLeaveIds]
  );

  const allEvents = useMemo(() => [...events, ...leaveEvents], [events, leaveEvents]);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allEvents.filter((event) => {
      const matchesFilter = filters[event.type];
      const matchesSearch = !query || `${event.title} ${event.type}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [allEvents, filters, search]);

  const eventsByDate = useMemo(() => {
    const groupedEvents = {};
    const addEvent = (date, event) => {
      if (!groupedEvents[date]) groupedEvents[date] = [];
      groupedEvents[date].push(event);
    };

    visibleEvents.forEach((event) => {
      if (event.type === "Leave" && event.endDate && event.endDate !== event.date) {
        const start = new Date(event.date);
        const end = new Date(event.endDate);
        for (let day = start; day <= end; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
          addEvent(isoDate(day), event);
        }
      } else {
        addEvent(event.date, event);
      }
    });

    return groupedEvents;
  }, [visibleEvents]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const weekGrid = useMemo(() => {
    const selected = new Date(selectedDate);
    const weekday = (selected.getDay() + 6) % 7;
    const monday = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - weekday);
    return Array.from({ length: 7 }, (_, index) => ({
      date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
    }));
  }, [selectedDate]);

  const selectedDayEvents = eventsByDate[selectedDate] || [];
  const featuredLeave = selectedDayEvents.find((event) => event.type === "Leave");
  const upcomingEvents = useMemo(
    () =>
      [...visibleEvents]
        .filter((event) => event.date >= selectedDate)
        .sort((first, second) => first.date.localeCompare(second.date))
        .slice(0, 4),
    [visibleEvents, selectedDate]
  );

  const goToday = () => {
    const today = new Date();
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayIso);
  };

  const goPrevious = () => {
    if (view === "week") {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - 7);
      setSelectedDate(isoDate(date));
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
      return;
    }
    setCursor(new Date(year, month - 1, 1));
  };

  const goNext = () => {
    if (view === "week") {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + 7);
      setSelectedDate(isoDate(date));
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
      return;
    }
    setCursor(new Date(year, month + 1, 1));
  };

  const toggleFilter = (key) => {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const clearFilters = () => {
    setFilters(EVENT_TYPES.reduce((acc, item) => ({ ...acc, [item.key]: false }), {}));
  };

  const openAddModal = (type = "Meeting") => {
    setNewEvent({ title: "", type, date: selectedDate, time: "", description: "" });
    setShowAddMenu(false);
    setShowModal(true);
  };

  const addEvent = (event) => {
    event.preventDefault();
    const title = newEvent.title.trim();
    if (!title) return;

    const time = newEvent.time
      ? new Date(`2026-01-01T${newEvent.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "";

    const createdEvent = {
      ...newEvent,
      id: `event-${Date.now()}`,
      title,
      time,
    };

    setEvents((current) => [...current, createdEvent]);
    setSelectedDate(newEvent.date);
    setCursor(new Date(newEvent.date));
    setShowModal(false);
    setToast("Event added successfully");
  };

  const deleteEvent = (eventToDelete) => {
    if (eventToDelete.type === "Leave") {
      const nextDeletedLeaveIds = [...new Set([...deletedLeaveIds, eventToDelete.id])];
      localStorage.setItem(DELETED_LEAVES_KEY, JSON.stringify(nextDeletedLeaveIds));
      setDeletedLeaveIds(nextDeletedLeaveIds);
      setToast("Leave deleted from calendar");
      return;
    }
    setEvents((current) => current.filter((event) => event.id !== eventToDelete.id));
    setToast("Event deleted successfully");
  };

  const renderEventPill = (event, compact = false) => {
    const color = colorFor(event.type);
    const Icon = typeInfo(event.type).icon;
    return (
      <div
        key={`${event.id}-${event.date}-${event.title}`}
        className={`flex items-center gap-1.5 rounded-md ${color.bg} ${color.text} ${color.border} border px-2 py-1 font-semibold ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <Icon size={compact ? 11 : 13} className="shrink-0" />
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-slate-50/70 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Calendar</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              View and manage events, leaves, holidays and important dates.
            </p>
          </div>

          <div className="relative calendar-add-menu">
            <div className="flex overflow-hidden rounded-lg shadow-lg shadow-blue-600/15">
              <button
                onClick={() => openAddModal()}
                className="flex h-11 items-center gap-2 bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} /> Add Event
              </button>
              <button
                onClick={() => setShowAddMenu((current) => !current)}
                className="flex h-11 w-11 items-center justify-center border-l border-blue-500 bg-blue-600 text-white transition hover:bg-blue-700"
                aria-label="Open event type menu"
              >
                <ChevronDown size={17} className={showAddMenu ? "rotate-180 transition" : "transition"} />
              </button>
            </div>

            {showAddMenu && (
              <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                {EVENT_TYPES.filter((item) => item.key !== "Leave").map((item) => {
                  const Icon = item.icon;
                  const color = COLORS[item.color];
                  return (
                    <button
                      key={item.key}
                      onClick={() => openAddModal(item.key)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${color.bg} ${color.text}`}>
                        <Icon size={15} />
                      </span>
                      {item.label.replace(/s$/, "")}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[210px_minmax(640px,1fr)_300px]">
          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-xs font-extrabold uppercase tracking-wide text-slate-500">Event Filters</h2>
              <div className="space-y-3.5">
                {EVENT_TYPES.map((item) => {
                  const color = COLORS[item.color];
                  return (
                    <label key={item.key} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={filters[item.key]}
                        onChange={() => toggleFilter(item.key)}
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                      {item.label}
                    </label>
                  );
                })}
              </div>
              <button onClick={clearFilters} className="mt-5 w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700">
                Clear All
              </button>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Upcoming Events</h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const color = colorFor(event.type);
                  const Icon = typeInfo(event.type).icon;
                  const date = new Date(event.date);
                  return (
                    <button
                      key={`${event.id}-${event.date}`}
                      onClick={() => setSelectedDate(event.date)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${color.bg} ${color.text}`}>
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">{event.title}</span>
                        <span className="block text-xs font-medium text-slate-500">{event.type}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-bold text-slate-700">{date.getDate()}</span>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setView("list")} className="mt-4 w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700">
                View all events
              </button>
            </section>
          </aside>

          <main className="min-w-0">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={goPrevious} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Previous period">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={goNext} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Next period">
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={goToday} className="h-9 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Today
                  </button>
                </div>

                <h2 className="text-center text-xl font-extrabold text-slate-950">{monthLabel}</h2>

                <div className="flex items-center justify-between gap-3">
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search events"
                      className="h-9 w-40 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                    />
                  </div>
                  <div className="flex rounded-md border border-slate-200">
                    {["month", "week", "list"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setView(item)}
                        className={`h-9 px-4 text-sm font-semibold capitalize transition ${
                          view === item ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_#60a5fa]" : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {view === "month" && (
                <>
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="px-3 py-3 text-center text-sm font-bold text-slate-900">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {monthGrid.map(({ date, inMonth }, index) => {
                      const currentIso = isoDate(date);
                      const dayEvents = eventsByDate[currentIso] || [];
                      const isSelected = currentIso === selectedDate;
                      const isToday = currentIso === todayIso;
                      const isSunday = date.getDay() === 0;

                      return (
                        <button
                          key={currentIso + index}
                          onClick={() => setSelectedDate(currentIso)}
                          className={`min-h-[112px] border-b border-r border-slate-200 p-3 text-left transition hover:bg-blue-50/30 ${
                            index % 7 === 6 ? "border-r-0" : ""
                          } ${inMonth ? "bg-white" : "bg-slate-50/50"}`}
                        >
                          <span
                            className={`mb-3 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                              isToday || isSelected
                                ? "bg-blue-600 text-white"
                                : !inMonth
                                  ? "text-slate-400"
                                  : isSunday
                                    ? "text-red-500"
                                    : "text-slate-900"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          <div className="space-y-1.5">
                            {dayEvents.slice(0, 2).map((event) => renderEventPill(event, true))}
                            {dayEvents.length > 2 && (
                              <p className="px-1 text-[10px] font-bold text-slate-400">+{dayEvents.length - 2} more</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {view === "week" && (
                <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-7 md:divide-x md:divide-y-0">
                  {weekGrid.map(({ date }, index) => {
                    const currentIso = isoDate(date);
                    const dayEvents = eventsByDate[currentIso] || [];
                    return (
                      <button
                        key={currentIso}
                        onClick={() => setSelectedDate(currentIso)}
                        className={`min-h-[300px] p-4 text-left transition hover:bg-blue-50/30 ${currentIso === selectedDate ? "bg-blue-50/50" : "bg-white"}`}
                      >
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{WEEKDAYS[index]}</p>
                        <p className="mt-1 text-xl font-extrabold text-slate-900">{date.getDate()}</p>
                        <div className="mt-4 space-y-2">{dayEvents.map((event) => renderEventPill(event))}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {view === "list" && (
                <div className="divide-y divide-slate-200">
                  {[...visibleEvents].sort((first, second) => first.date.localeCompare(second.date)).map((event) => {
                    const color = colorFor(event.type);
                    const Icon = typeInfo(event.type).icon;
                    return (
                      <button
                        key={`${event.id}-${event.title}`}
                        onClick={() => setSelectedDate(event.date)}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                      >
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${color.bg} ${color.text}`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-950">{event.title}</span>
                          <span className="block text-xs font-semibold text-slate-500">
                            {event.type}{event.time ? ` | ${event.time}` : ""}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-slate-500">{formatShortDate(event.date)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 rounded-lg bg-white px-4 py-3 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
              {EVENT_TYPES.map((item) => (
                <span key={item.key} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${COLORS[item.color].dot}`} />
                  {item.label.replace(/s$/, "")}
                </span>
              ))}
            </div>
          </main>

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-base font-extrabold text-slate-950">{formatLongDate(selectedDate)}</h2>
                <button onClick={() => setSelectedDate(todayIso)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600" aria-label="Reset selected date">
                  <X size={18} />
                </button>
              </div>

              {featuredLeave ? (
                <>
                  <div className="border-y border-emerald-100 bg-emerald-50 px-5 py-5">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-emerald-600 shadow-sm">
                        <CalendarDays size={24} />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-950">{featuredLeave.title}</p>
                        <span className="mt-2 inline-flex rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          {featuredLeave.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 px-5 py-5">
                    <Detail label="Type" value={featuredLeave.leaveType} />
                    <Detail label="Date" value={`${formatShortDate(featuredLeave.date)}${featuredLeave.endDate !== featuredLeave.date ? ` - ${formatShortDate(featuredLeave.endDate)}` : ""}`} />
                    <Detail label="Reason" value={featuredLeave.reason} />
                    <div>
                      <p className="text-xs font-bold text-slate-500">Approved By</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">SK</span>
                        <div>
                          <p className="text-sm font-bold text-slate-950">{featuredLeave.approvedBy}</p>
                          <p className="text-xs font-medium text-slate-500">Admin</p>
                        </div>
                      </div>
                    </div>
                    <Detail label="Status" value={featuredLeave.status} badge />
                    <button className="h-10 w-full rounded-md border border-blue-200 bg-blue-50/40 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
                      View Leave Details
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-5 py-8 text-center">
                  <Sparkles className="mx-auto text-slate-300" size={28} />
                  <p className="mt-3 text-sm font-semibold text-slate-500">No leave details for this day.</p>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Events On This Day</h2>
              {selectedDayEvents.length ? (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {selectedDayEvents.map((event) => (
                    <div key={`${event.id}-${event.title}`} className="flex gap-3 px-4 py-4">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${colorFor(event.type).dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-950">{event.title}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {event.time ? `${event.time}${event.endTime ? ` - ${event.endTime}` : ""}` : "All Day"}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteEvent(event)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${event.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                  No events scheduled.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-extrabold text-slate-950">Add Event</h2>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600" aria-label="Close add event modal">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addEvent} className="space-y-4 px-6 py-5">
              <Field label="Title">
                <input
                  value={newEvent.title}
                  onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))}
                  className="calendar-input"
                  placeholder="Client Call"
                  required
                />
              </Field>
              <Field label="Type">
                <select
                  value={newEvent.type}
                  onChange={(event) => setNewEvent((current) => ({ ...current, type: event.target.value }))}
                  className="calendar-input"
                >
                  {EVENT_TYPES.filter((item) => item.key !== "Leave").map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label.replace(/s$/, "")}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(event) => setNewEvent((current) => ({ ...current, date: event.target.value }))}
                    className="calendar-input"
                    required
                  />
                </Field>
                <Field label="Time">
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(event) => setNewEvent((current) => ({ ...current, time: event.target.value }))}
                    className="calendar-input"
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={newEvent.description}
                  onChange={(event) => setNewEvent((current) => ({ ...current, description: event.target.value }))}
                  className="calendar-input min-h-24 resize-none py-3"
                  placeholder="Optional notes"
                />
              </Field>
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="h-10 rounded-md bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .calendar-input {
          width: 100%;
          height: 2.5rem;
          border-radius: 0.375rem;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }
        .calendar-input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
      `}</style>
    </div>
  );
};

const Detail = ({ label, value, badge = false }) => (
  <div>
    <p className="text-xs font-bold text-slate-500">{label}</p>
    {badge ? (
      <span className="mt-2 inline-flex rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{value}</span>
    ) : (
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    )}
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);

export default Calendar;

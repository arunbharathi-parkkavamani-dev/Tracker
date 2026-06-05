import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LogIn, LogOut, CheckCircle, XCircle,
  Clock, TrendingUp, Zap, ChevronLeft, ChevronRight, Plus,
} from "lucide-react";

/* ════════════════════════════════
   HELPERS
════════════════════════════════ */
const fmt12 = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtHM = (hrs) => {
  const h = Math.floor(hrs);
  const m = Math.floor((hrs - h) * 60);
  return h === 0 && m === 0 ? "—" : `${h}h ${m}m`;
};

const getWeekDays = (offset = 0) => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const isToday = (d) => isSameDay(d, new Date());
const isFuture = (d) => new Date(d) > new Date() && !isToday(d);
const isWeekend = (d) => [0, 6].includes(new Date(d).getDay());
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TARGET = 8;

/* ════════════════════════════════
   CIRCULAR RING
════════════════════════════════ */
const Ring = ({ pct, size = 52, sw = 5, color }) => {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-[#ebe7e1]" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw}
        strokeDasharray={c} strokeDashoffset={c - (Math.min(pct, 100) / 100) * c}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
};

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();

  const [todayRec, setTodayRec]         = useState(null);
  const [weekRecs, setWeekRecs]         = useState([]);
  const [pageLoading, setPageLoading]   = useState(true);
  const [actionBusy, setActionBusy]     = useState(false);
  const navigate = useNavigate();
  const [now, setNow]                   = useState(new Date());
  const [activeHours, setActiveHours]   = useState(0);
  const [weekOffset, setWeekOffset]     = useState(0);

  const weekDays = getWeekDays(weekOffset);
  const isCurrentWeek = weekOffset === 0;

  /* clock */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* active hours */
  const calcHours = useCallback(() => {
    if (!todayRec?.checkIn) return 0;
    const end = todayRec.checkOut ? new Date(todayRec.checkOut) : new Date();
    return Math.max(0, (end - new Date(todayRec.checkIn)) / 3_600_000);
  }, [todayRec]);

  useEffect(() => { setActiveHours(calcHours()); }, [calcHours, now]);

  /* fetch */
  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const days   = getWeekDays(weekOffset);
      const monISO = new Date(days[0]); monISO.setHours(0, 0, 0, 0);
      const satISO = new Date(days[5]); satISO.setHours(23, 59, 59, 999);

      const filter = JSON.stringify({
        employee: user.id,
        date: { $gte: monISO.toISOString(), $lte: satISO.toISOString() },
      });
      const res = await axiosInstance.get(
        `/populate/read/attendances?filter=${encodeURIComponent(filter)}`
      );
      const recs = res.data?.data || [];
      setWeekRecs(recs);

      const todayMatch = recs.find((r) => isSameDay(r.date, new Date()));
      setTodayRec(todayMatch || null);
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  }, [user, weekOffset]);

  useEffect(() => {
    if (!user || authLoading) return;
    fetchAll();
  }, [user, authLoading, fetchAll]);

  /* check in */
  const handleCheckIn = async () => {
    if (!user || actionBusy) return;
    setActionBusy(true);
    try {
      const res = await axiosInstance.post("/populate/create/attendances", {
        employee: user.id, employeeName: user.name,
        date: new Date().toISOString().split("T")[0],
        checkIn: new Date().toISOString(), status: "Present",
        managerId: user.managerId, workType: "fixed",
        location: { latitude: 10.9338987, longitude: 76.9839277 },
      });
      if (res.data.success) { await fetchAll(); toast.success("Checked in!"); }
    } catch (e) { toast.error(e.response?.data?.message || "Check-in failed"); }
    finally { setActionBusy(false); }
  };

  /* check out */
  const handleCheckOut = async () => {
    if (!todayRec || actionBusy) return;
    setActionBusy(true);
    try {
      const res = await axiosInstance.put(`/populate/update/attendances/${todayRec._id}`, {
        checkOut: new Date().toISOString(),
        location: { latitude: 10.9338987, longitude: 76.9839277 },
      });
      if (res.data.success) { await fetchAll(); toast.success("Checked out!"); }
    } catch (e) { toast.error(e.response?.data?.message || "Check-out failed"); }
    finally { setActionBusy(false); }
  };

  /* week stats */
  const presentDays  = weekRecs.filter((r) => r.status === "Present" || r.checkIn).length;
  const totalHrsWeek = weekRecs.reduce((acc, r) => {
    if (!r.checkIn) return acc;
    const end = r.checkOut ? new Date(r.checkOut) : (isSameDay(r.date, new Date()) ? new Date() : new Date(r.checkIn));
    return acc + Math.max(0, (end - new Date(r.checkIn)) / 3_600_000);
  }, 0);
  const workDaysPassed = weekDays.filter((d) => !isFuture(d) && !isWeekend(d)).length;
  const attendRate     = workDaysPassed > 0 ? Math.round((presentDays / workDaysPassed) * 100) : 0;

  /* day helpers */
  const getDayRec  = (d) => weekRecs.find((r) => isSameDay(r.date, d));
  const getDayHrs  = (d) => {
    const r = getDayRec(d);
    if (!r?.checkIn) return null;
    const end = r.checkOut ? new Date(r.checkOut) : (isToday(d) ? new Date() : new Date(r.checkIn));
    return Math.max(0, (end - new Date(r.checkIn)) / 3_600_000);
  };

  const dayStatus = (d) => {
    if (isFuture(d))  return "future";
    if (isWeekend(d)) return "weekend";
    const r = getDayRec(d);
    if (!r)            return "absent";
    if (r.status === "Leave") return "leave";
    if (r.checkIn)    return "present";
    return "absent";
  };

  const STATUS = {
    present: { bg: "bg-[#0bdf50]/10", text: "text-[#0bdf50]", label: "P" },
    absent:  { bg: "bg-[#c41c1c]/10", text: "text-[#c41c1c]", label: "A" },
    leave:   { bg: "bg-[#ff5600]/10", text: "text-[#ff5600]", label: "L" },
    weekend: { bg: "bg-[#ebe7e1]", text: "text-[#7b7b78]", label: "—" },
    future:  { bg: "bg-transparent", text: "text-[#9c9fa5]", label: "·" },
  };

  const hasIn  = !!todayRec?.checkIn;
  const hasOut = !!todayRec?.checkOut;
  const pct    = Math.min((activeHours / TARGET) * 100, 100);
  const ringColor = pct >= 100 ? "#0bdf50" : pct >= 60 ? "#111111" : "#7b7b78";

  const weekLabel = () => {
    const mon = weekDays[0];
    const sat = weekDays[5];
    const mStr = mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const sStr = sat.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${mStr} – ${sStr}`;
  };

  /* ── loading ── */
  if (pageLoading) return (
    <div className="flex items-center justify-center h-full bg-[#f5f1ec]">
      <div className="h-8 w-8 border-4 border-[#ebe7e1] border-t-[#111111] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-6 overflow-y-auto bg-[#f5f1ec]" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>


      {/* ─── TODAY CARD ─── */}
      <div className="bg-white rounded-[16px] border border-[#d3cec6] p-5 lg:p-6 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#111111]" />
            <span className="text-[16px] font-medium text-[#111111] leading-tight">Today</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium ${hasIn ? 'bg-[#0bdf50]/10 text-[#0bdf50]' : 'bg-[#c41c1c]/10 text-[#c41c1c]'}`}>
            {hasIn ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {hasIn ? "Present" : "Absent"}
          </div>
        </div>

        {/* Horizontal layout: check in | check out | hours ring | action */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-10">
          {/* Check In */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-[#f5f1ec] flex items-center justify-center">
              <LogIn className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-[12px] text-[#7b7b78] mb-0.5">Check In</p>
              <p className={`text-[15px] font-medium tabular-nums leading-none ${hasIn ? 'text-[#111111]' : 'text-[#9c9fa5]'}`}>
                {hasIn ? fmt12(todayRec.checkIn) : "--:--"}
              </p>
            </div>
          </div>

          {/* Check Out */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-[#f5f1ec] flex items-center justify-center">
              <LogOut className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-[12px] text-[#7b7b78] mb-0.5">Check Out</p>
              <p className={`text-[15px] font-medium tabular-nums leading-none ${hasOut ? 'text-[#111111]' : 'text-[#9c9fa5]'}`}>
                {hasOut ? fmt12(todayRec.checkOut) : "--:--"}
              </p>
            </div>
          </div>

          {/* Hours Ring */}
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center justify-center">
              <Ring pct={pct} size={44} sw={4} color={ringColor} />
              <span className="absolute text-[11px] font-medium text-[#111111]">
                {Math.floor(activeHours)}h
              </span>
            </div>
            <div>
              <p className="text-[12px] text-[#7b7b78] mb-0.5">Active</p>
              <p className="text-[15px] font-medium text-[#111111] leading-none">{fmtHM(activeHours)}</p>
            </div>
          </div>

          {/* Spacer + Action */}
          <div className="ml-auto flex-shrink-0 mt-2 sm:mt-0">
            {!hasIn ? (
              <button onClick={handleCheckIn} disabled={actionBusy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#111111] hover:bg-[#313130] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50">
                <LogIn className="h-4 w-4" />
                {actionBusy ? "..." : "Check In"}
              </button>
            ) : !hasOut ? (
              <button onClick={handleCheckOut} disabled={actionBusy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-white border border-[#d3cec6] hover:bg-[#f5f1ec] text-[#111111] text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50">
                <LogOut className="h-4 w-4" />
                {actionBusy ? "..." : "Check Out"}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] bg-[#0bdf50]/10 border border-[#0bdf50]/20 text-[#0bdf50] text-[14px] font-medium">
                <CheckCircle className="h-4 w-4" />
                Done — {fmtHM(activeHours)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── STATS ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <StatCard icon={CheckCircle} value={`${presentDays}/${workDaysPassed}`} label="Days Present" />
        <StatCard icon={Clock}       value={fmtHM(totalHrsWeek)}               label="Week Hours" />
        <StatCard icon={TrendingUp}  value={`${attendRate}%`}                  label="Attendance" />
        <StatCard icon={Zap}         value={fmtHM(activeHours)}                label="Today Active" />
      </div>

      {/* ─── WEEKLY ATTENDANCE (Horizontal Rows) ─── */}
      <div className="bg-white rounded-[16px] border border-[#d3cec6] flex-1 min-h-0 flex flex-col shadow-sm">
        {/* Week header with navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ebe7e1]">
          <div className="flex items-center gap-4">
            <span className="text-[16px] font-medium text-[#111111]">Weekly Attendance</span>
            <button
              onClick={() => navigate('/Attendance/leave-regularization')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[6px] bg-white border border-[#d3cec6] hover:bg-[#ebe7e1] text-[#111111] transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Request Leave
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/Attendance/leave-regularization')}
              className="sm:hidden p-1.5 rounded-[6px] bg-[#f5f1ec] text-[#111111] mr-1"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-[6px] hover:bg-[#f5f1ec] text-[#626260] transition-colors cursor-pointer"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => isCurrentWeek ? null : setWeekOffset(0)}
              className={`px-3 py-1 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${isCurrentWeek ? 'bg-[#f5f1ec] text-[#111111]' : 'text-[#626260] hover:bg-[#f5f1ec]'}`}
            >
              {isCurrentWeek ? "This Week" : weekLabel()}
            </button>
            <button
              onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
              disabled={isCurrentWeek}
              className="p-1.5 rounded-[6px] hover:bg-[#f5f1ec] text-[#626260] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontal day rows */}
        <div className="flex-1 overflow-y-auto">
          {weekDays.map((d, i) => {
            const st  = dayStatus(d);
            const hrs = getDayHrs(d);
            const rec = getDayRec(d);
            const sty = STATUS[st];
            const tod = isToday(d);

            return (
              <div
                key={i}
                className={`
                  flex items-center gap-4 px-5 py-3.5 border-b border-[#ebe7e1] last:border-0
                  transition-colors
                  ${tod ? 'bg-[#f5f1ec]/50' : 'hover:bg-[#f5f1ec]/30'}
                `}
              >
                {/* Day label + date */}
                <div className={`w-16 flex-shrink-0 ${tod ? 'text-[#111111]' : 'text-[#626260]'}`}>
                  <span className="text-[13px] font-medium">{DAY_LABELS[i]}</span>
                  <span className="text-[12px] ml-1.5 font-normal">{d.getDate()}</span>
                </div>

                {/* Status badge */}
                <div className={`w-7 h-5 rounded-[4px] flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${sty.bg} ${sty.text}`}>
                  {sty.label}
                </div>

                {/* Check In */}
                <div className="flex items-center gap-2 w-24 flex-shrink-0">
                  <LogIn className="h-3.5 w-3.5 text-[#7b7b78] flex-shrink-0" />
                  <span className={`text-[13px] tabular-nums ${rec?.checkIn ? 'text-[#111111] font-medium' : 'text-[#9c9fa5]'}`}>
                    {rec?.checkIn ? fmt12(rec.checkIn) : "--:--"}
                  </span>
                </div>

                {/* Check Out */}
                <div className="flex items-center gap-2 w-24 flex-shrink-0">
                  <LogOut className="h-3.5 w-3.5 text-[#7b7b78] flex-shrink-0" />
                  <span className={`text-[13px] tabular-nums ${rec?.checkOut ? 'text-[#111111] font-medium' : 'text-[#9c9fa5]'}`}>
                    {rec?.checkOut ? fmt12(rec.checkOut) : "--:--"}
                  </span>
                </div>

                {/* Hours */}
                <div className="flex-1 min-w-0 flex items-center">
                  {hrs != null ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 h-2 bg-[#ebe7e1] rounded-full overflow-hidden max-w-[140px]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((hrs / TARGET) * 100, 100)}%`,
                            background: hrs >= TARGET ? '#0bdf50' : '#111111',
                          }}
                        />
                      </div>
                      <span className="text-[13px] font-medium text-[#111111] tabular-nums">{fmtHM(hrs)}</span>
                    </div>
                  ) : (
                    <span className="text-[13px] text-[#9c9fa5]">
                      {st === "weekend" ? "Off" : st === "future" ? "" : "—"}
                    </span>
                  )}
                </div>

                {/* Today indicator */}
                {tod && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111111] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Sub Components ── */
const StatCard = ({ icon: Icon, value, label }) => (
  <div className="bg-white rounded-[12px] border border-[#d3cec6] p-4 flex items-center gap-3 shadow-sm">
    <div className={`h-10 w-10 rounded-[8px] bg-[#f5f1ec] flex items-center justify-center flex-shrink-0`}>
      <Icon className={`h-5 w-5 text-[#111111]`} />
    </div>
    <div>
      <p className="text-[18px] font-medium text-[#111111] leading-[1.20]">{value}</p>
      <p className="text-[12px] text-[#626260] mt-0.5">{label}</p>
    </div>
  </div>
);

export default AttendancePage;
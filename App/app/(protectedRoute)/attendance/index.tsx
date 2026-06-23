import React, {
    useState,
    useEffect,
    useContext,
    useCallback,
} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext";
import { Link } from "expo-router";
import {
    LogIn, LogOut, CheckCircle2, MapPin, Clock, Calendar,
    AlertCircle, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekRange(referenceDate: Date) {
    const date = new Date(referenceDate);
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
}

function getMonthRange(referenceDate: Date) {
    const d = new Date(referenceDate);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function statusDotColor(status: string) {
    const s = (status || '').toLowerCase();
    if (s.includes('present') || s.includes('check-out') || s.includes('late entry')) return '#10B981';
    if (s.includes('absent')) return '#EF4444';
    if (s.includes('leave')) return '#3B82F6';
    return '#D1D5DB';
}

function formatTime(value?: string) {
    if (!value) return '--:--';
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function calcDuration(checkIn?: string, checkOut?: string | Date) {
    if (!checkIn || !checkOut) return null;
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diffMs <= 0) return null;
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
}

function fmtWeekLabel(start: Date, end: Date) {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
}

function fmtMonthLabel(date: Date) {
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Attendance() {
    const { user, loading } = useContext(AuthContext);
    const TODAY = new Date();

    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [timeNow, setTimeNow] = useState(new Date());

    const [locationCoords, setLocationCoords] = useState<any>(null);
    const [locationLabel, setLocationLabel] = useState("Fetching location…");
    const [isFetchingToday, setIsFetchingToday] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // ── View mode: 'week' | 'month' ──
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // ── Navigation reference dates ──
    const [weekRef, setWeekRef] = useState(TODAY);           // any date in the target week
    const [monthRef, setMonthRef] = useState(TODAY);         // any date in the target month

    const isCurrentWeek = getWeekRange(weekRef).start.toDateString() === getWeekRange(TODAY).start.toDateString();
    const isCurrentMonth = monthRef.getFullYear() === TODAY.getFullYear() && monthRef.getMonth() === TODAY.getMonth();

    const hasCheckedIn = !!todayRecord?.checkIn;
    const hasCheckedOut = !!todayRecord?.checkOut;

    // ─── Live clock ────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => setTimeNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ─── Location ───────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') { setLocationLabel('Permission denied'); return; }
                const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocationCoords({ latitude: coords.latitude, longitude: coords.longitude });
                const places = await Location.reverseGeocodeAsync(coords);
                if (places?.length > 0) {
                    const p = places[0];
                    setLocationLabel(p.name || p.street || `${p.city || ''} ${p.region || ''}`.trim() || 'Current location');
                } else {
                    setLocationLabel('Current location');
                }
            } catch { setLocationLabel('Unable to fetch location'); }
        })();
    }, []);

    // ─── Fetch TODAY's record ────────────────────────────────────
    const fetchTodayAttendance = useCallback(async () => {
        if (!user) return;
        setIsFetchingToday(true);
        setError('');
        try {
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
            const filter = JSON.stringify({ employee: user.id, date: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() } });
            const res = await axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`);
            const records: any[] = res?.data?.data || [];
            const todayStr = TODAY.toISOString().split('T')[0];
            const todayRecords = records.filter(r => r.date && new Date(r.date).toISOString().split('T')[0] === todayStr && r.employee._id === user.id);
            setTodayRecord(todayRecords.length > 0 ? todayRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null);
        } catch { setError("Failed to load today's attendance"); }
        finally { setIsFetchingToday(false); }
    }, [user]);

    // ─── Fetch WEEK or MONTH data ────────────────────────────────
    const fetchRangeData = useCallback(async (mode: 'week' | 'month', ref: Date) => {
        if (!user) return;
        setIsFetching(true);
        try {
            const range = mode === 'week' ? getWeekRange(ref) : getMonthRange(ref);
            const filter = JSON.stringify({ employee: user.id, date: { $gte: range.start.toISOString(), $lte: range.end.toISOString() } });
            const res = await axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`);
            setAttendanceData(res?.data?.data || []);
        } catch { } finally { setIsFetching(false); }
    }, [user]);

    // ─── Initial load ────────────────────────────────────────────
    useEffect(() => {
        if (loading || !user) return;
        fetchTodayAttendance();
        fetchRangeData('week', TODAY);
    }, [user, loading]);

    // ─── Refetch on navigation ────────────────────────────────────
    useEffect(() => {
        if (!user || loading) return;
        if (viewMode === 'week') fetchRangeData('week', weekRef);
    }, [weekRef, viewMode]);

    useEffect(() => {
        if (!user || loading) return;
        if (viewMode === 'month') fetchRangeData('month', monthRef);
    }, [monthRef, viewMode]);

    useEffect(() => {
        if (!user || loading) return;
        if (viewMode === 'week') fetchRangeData('week', weekRef);
        else fetchRangeData('month', monthRef);
    }, [viewMode]);

    // ─── Navigation helpers ──────────────────────────────────────
    const goWeekBack = () => setWeekRef(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    const goWeekFwd = () => setWeekRef(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    const goWeekToday = () => setWeekRef(TODAY);

    const goMonthBack = () => setMonthRef(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
    const goMonthFwd = () => setMonthRef(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });
    const goMonthToday = () => setMonthRef(TODAY);

    // ─── Build week day rows ─────────────────────────────────────
    const buildWeekDays = useCallback(() => {
        const { start } = getWeekRange(weekRef);
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const todayStr = TODAY.toDateString();
        return labels.map((label, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const record = attendanceData.find((r: any) => r.date && new Date(r.date).toDateString() === date.toDateString());
            const dotColor = record ? statusDotColor(record.status) : '#D1D5DB';
            const isFuture = date > TODAY;
            return {
                key: date.toISOString().slice(0, 10),
                label,
                dateNum: date.getDate(),
                dateLabel: date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
                status: record?.status || 'No Record',
                dotColor: isFuture ? '#E5E7EB' : dotColor,
                checkIn: record?.checkIn ? formatTime(record.checkIn) : null,
                checkOut: record?.checkOut ? formatTime(record.checkOut) : null,
                duration: calcDuration(record?.checkIn, record?.checkOut) || null,
                isToday: date.toDateString() === todayStr,
                isFuture,
            };
        });
    }, [attendanceData, weekRef]);

    // ─── Summary ─────────────────────────────────────────────────
    const getSummary = useCallback(() => {
        const s = { present: 0, absent: 0, leave: 0, others: 0 };
        if (viewMode === 'week') {
            const { start } = getWeekRange(weekRef);
            for (let i = 0; i < 7; i++) {
                const day = new Date(start);
                day.setDate(start.getDate() + i);
                if (day > TODAY) continue;
                const record = attendanceData.find((r: any) => r.date && new Date(r.date).toDateString() === day.toDateString());
                if (!record) { s.absent += 1; continue; }
                const st = (record.status || '').toLowerCase();
                if (st.includes('present') || st.includes('check-out') || st.includes('late entry')) s.present += 1;
                else if (st.includes('leave')) s.leave += 1;
                else if (st.includes('absent')) s.absent += 1;
                else s.others += 1;
            }
        } else {
            // For month, count from data directly
            attendanceData.forEach((r: any) => {
                const st = (r.status || '').toLowerCase();
                if (st.includes('present') || st.includes('check-out') || st.includes('late entry')) s.present += 1;
                else if (st.includes('leave')) s.leave += 1;
                else if (st.includes('absent')) s.absent += 1;
                else s.others += 1;
            });
        }
        return s;
    }, [attendanceData, viewMode, weekRef]);

    // ─── Build month calendar grid ───────────────────────────────
    const buildMonthGrid = useCallback(() => {
        const year = monthRef.getFullYear();
        const month = monthRef.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        // Monday-start offset
        const startOffset = (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1);
        const cells: Array<{ date: Date | null; record: any; isToday: boolean; isFuture: boolean }> = [];

        // Empty leading cells
        for (let i = 0; i < startOffset; i++) cells.push({ date: null, record: null, isToday: false, isFuture: false });

        const todayStr = TODAY.toDateString();
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const record = attendanceData.find((r: any) => r.date && new Date(r.date).toDateString() === date.toDateString());
            cells.push({ date, record, isToday: date.toDateString() === todayStr, isFuture: date > TODAY });
        }
        return cells;
    }, [attendanceData, monthRef]);

    // ─── Check-In ────────────────────────────────────────────────
    const handleCheckIn = async () => {
        if (!user || hasCheckedIn || isSubmitting) return;
        setIsSubmitting(true); setError('');
        try {
            const now = new Date();
            await axiosInstance.post('/populate/create/attendances', {
                employee: user.id, employeeName: user.name, date: now.toISOString(), checkIn: now.toISOString(),
                status: 'Present', managerId: user?.managerId, workType: 'fixed', location: locationCoords || null,
            });
            await fetchTodayAttendance();
            await fetchRangeData(viewMode, viewMode === 'week' ? weekRef : monthRef);
            Toast.show({ type: 'success', text1: 'Checked in ✓', text2: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        } catch { setError('Check-in failed'); Toast.show({ type: 'error', text1: 'Check-in failed', text2: 'Please try again.' }); }
        finally { setIsSubmitting(false); }
    };

    // ─── Check-Out ───────────────────────────────────────────────
    const handleCheckOut = async () => {
        if (!user || !todayRecord || !hasCheckedIn || hasCheckedOut || isSubmitting) return;
        setIsSubmitting(true); setError('');
        try {
            const now = new Date();
            await axiosInstance.put(`/populate/update/attendances/${todayRecord._id}`, {
                employee: user.id, employeeName: user.name, date: todayRecord.date || now.toISOString(),
                checkIn: todayRecord.checkIn, checkOut: now.toISOString(), status: todayRecord.status || 'Present',
                managerId: todayRecord.managerId || user.managerId, workType: todayRecord.workType || 'fixed',
                location: locationCoords || todayRecord.location || null,
            });
            await fetchTodayAttendance();
            await fetchRangeData(viewMode, viewMode === 'week' ? weekRef : monthRef);
            Toast.show({ type: 'success', text1: 'Checked out ✓', text2: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        } catch { setError('Check-out failed'); Toast.show({ type: 'error', text1: 'Check-out failed', text2: 'Please try again.' }); }
        finally { setIsSubmitting(false); }
    };

    // ─── State config ────────────────────────────────────────────
    const getStateConfig = () => {
        if (!hasCheckedIn) return {
            gradient: ['#F59E0B', '#D97706'] as const, icon: LogIn,
            title: 'Not Checked In', sub: 'Tap to mark your attendance',
            btnLabel: 'Check In', btnGrad: ['#10B981', '#059669'] as const, action: handleCheckIn,
        };
        if (!hasCheckedOut) return {
            gradient: ['#10B981', '#059669'] as const, icon: LogOut,
            title: 'Checked In', sub: `Since ${formatTime(todayRecord?.checkIn)}`,
            btnLabel: 'Check Out', btnGrad: ['#EF4444', '#DC2626'] as const, action: handleCheckOut,
        };
        return {
            gradient: ['#7C3AED', '#6D28D9'] as const, icon: CheckCircle2,
            title: 'Day Complete', sub: `${formatTime(todayRecord?.checkIn)} – ${formatTime(todayRecord?.checkOut)} · ${calcDuration(todayRecord?.checkIn, todayRecord?.checkOut) || ''}`,
            btnLabel: null, btnGrad: null, action: null,
        };
    };

    if (loading) return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC' }}>
            <ActivityIndicator color="#7C3AED" />
        </View>
    );

    const state = getStateConfig();
    const StateIcon = state.icon;
    const weekDays = buildWeekDays();
    const monthGrid = buildMonthGrid();
    const summary = getSummary();
    const { start: wkStart, end: wkEnd } = getWeekRange(weekRef);
    const isFutureWeek = wkStart > TODAY;
    const isFutureMonth = monthRef.getFullYear() > TODAY.getFullYear() ||
        (monthRef.getFullYear() === TODAY.getFullYear() && monthRef.getMonth() > TODAY.getMonth());

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FC' }} edges={['bottom', 'left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* ── Error banner ── */}
                {!!error && (
                    <View style={{ marginHorizontal: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10 }}>
                        <AlertCircle size={14} color="#EF4444" />
                        <Text style={{ color: '#B91C1C', fontSize: 13 }}>{error}</Text>
                    </View>
                )}

                {/* ── TODAY CHECK-IN CARD ── */}
                <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                    <LinearGradient
                        colors={[...state.gradient]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}
                    >
                        <View style={{ position: 'absolute', right: -20, bottom: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                        {/* Status row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                    <StateIcon size={20} color="white" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{state.title}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>{state.sub}</Text>
                                </View>
                            </View>
                            {/* Live clock */}
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>NOW</Text>
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18, fontVariant: ['tabular-nums'] }}>
                                    {timeNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </Text>
                            </View>
                        </View>

                        {/* Location strip */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' }}>
                            <MapPin size={12} color="rgba(255,255,255,0.5)" />
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, flex: 1 }} numberOfLines={1}>{locationLabel}</Text>
                        </View>

                        {/* CTA */}
                        {state.btnLabel && state.btnGrad && (
                            <TouchableOpacity disabled={isSubmitting} onPress={state.action!} activeOpacity={0.85} style={{ marginTop: 14 }}>
                                <LinearGradient
                                    colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : [...state.btnGrad]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                                >
                                    {isSubmitting
                                        ? <ActivityIndicator size="small" color="white" />
                                        : <><StateIcon size={16} color="white" /><Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>{state.btnLabel}</Text></>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {/* In/Duration/Out row (day complete) */}
                        {hasCheckedIn && hasCheckedOut && (
                            <View style={{ flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', justifyContent: 'space-between' }}>
                                {[{ label: 'CHECK IN', val: formatTime(todayRecord?.checkIn) }, { label: 'DURATION', val: calcDuration(todayRecord?.checkIn, todayRecord?.checkOut) || '--' }, { label: 'CHECK OUT', val: formatTime(todayRecord?.checkOut) }].map(({ label, val }) => (
                                    <View key={label} style={{ alignItems: 'center' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>{label}</Text>
                                        <Text style={{ color: 'white', fontSize: 15, fontWeight: '700', marginTop: 2 }}>{val}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Elapsed timer (checked in, not out) */}
                        {hasCheckedIn && !hasCheckedOut && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>CHECK IN</Text>
                                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginTop: 2 }}>{formatTime(todayRecord?.checkIn)}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>ELAPSED</Text>
                                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginTop: 2 }}>{calcDuration(todayRecord?.checkIn, timeNow.toISOString()) || '--'}</Text>
                                </View>
                            </View>
                        )}
                    </LinearGradient>
                </View>

                {/* ═══════════════════════════════════════════════
                    HISTORY SECTION
                ═══════════════════════════════════════════════ */}
                <View style={{ marginHorizontal: 20, marginTop: 20 }}>

                    {/* ── View mode toggle: Week / Month ── */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#B4BACC', letterSpacing: 0.5 }}>ATTENDANCE HISTORY</Text>
                        <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 3 }}>
                            {(['week', 'month'] as const).map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    onPress={() => setViewMode(mode)}
                                    style={{
                                        paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8,
                                        backgroundColor: viewMode === mode ? '#7C3AED' : 'transparent',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: viewMode === mode ? '#FFFFFF' : '#8890A8' }}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ── Navigation bar (Week) ── */}
                    {viewMode === 'week' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 }}>
                            <TouchableOpacity onPress={goWeekBack} style={{ padding: 4 }}>
                                <ChevronLeft size={18} color="#7C3AED" />
                            </TouchableOpacity>

                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1D2E' }}>
                                    {fmtWeekLabel(wkStart, wkEnd)}
                                </Text>
                                {!isCurrentWeek && (
                                    <TouchableOpacity onPress={goWeekToday}>
                                        <Text style={{ fontSize: 10, color: '#7C3AED', fontWeight: '600', marginTop: 1 }}>Back to this week</Text>
                                    </TouchableOpacity>
                                )}
                                {isCurrentWeek && (
                                    <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 1 }}>Current week</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={goWeekFwd}
                                disabled={isCurrentWeek}
                                style={{ padding: 4, opacity: isCurrentWeek ? 0.3 : 1 }}
                            >
                                <ChevronRightIcon size={18} color="#7C3AED" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Navigation bar (Month) ── */}
                    {viewMode === 'month' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 }}>
                            <TouchableOpacity onPress={goMonthBack} style={{ padding: 4 }}>
                                <ChevronLeft size={18} color="#7C3AED" />
                            </TouchableOpacity>

                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1D2E' }}>
                                    {fmtMonthLabel(monthRef)}
                                </Text>
                                {!isCurrentMonth && (
                                    <TouchableOpacity onPress={goMonthToday}>
                                        <Text style={{ fontSize: 10, color: '#7C3AED', fontWeight: '600', marginTop: 1 }}>Back to this month</Text>
                                    </TouchableOpacity>
                                )}
                                {isCurrentMonth && (
                                    <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 1 }}>Current month</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={goMonthFwd}
                                disabled={isCurrentMonth}
                                style={{ padding: 4, opacity: isCurrentMonth ? 0.3 : 1 }}
                            >
                                <ChevronRightIcon size={18} color="#7C3AED" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Summary pills ── */}
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                            {[
                                { label: 'Present', value: summary.present, color: '#10B981' },
                                { label: 'Absent', value: summary.absent, color: '#EF4444' },
                                { label: 'Leave', value: summary.leave, color: '#3B82F6' },
                                { label: 'Other', value: summary.others, color: '#F59E0B' },
                            ].map(({ label, value, color }) => (
                                <View key={label} style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
                                    <Text style={{ fontSize: 10, color: '#8890A8', marginTop: 1 }}>{label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Progress bar — week only (out of 5 workdays) */}
                        {viewMode === 'week' && (
                            <View style={{ marginTop: 10 }}>
                                <View style={{ height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                                    <View style={{ height: 4, width: `${Math.min(100, Math.round((summary.present / 5) * 100))}%`, backgroundColor: '#10B981', borderRadius: 2 }} />
                                </View>
                                <Text style={{ fontSize: 10, color: '#8890A8', marginTop: 4, textAlign: 'right' }}>{summary.present}/5 work days</Text>
                            </View>
                        )}
                    </View>

                    {/* Loading spinner for history */}
                    {isFetching && (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator color="#7C3AED" />
                        </View>
                    )}

                    {/* ══════════════════ WEEK VIEW ══════════════════ */}
                    {viewMode === 'week' && !isFetching && (
                        <>
                            {/* Day dot strip */}
                            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {weekDays.map((day) => (
                                        <View key={day.key} style={{ alignItems: 'center', flex: 1 }}>
                                            <Text style={{ fontSize: 10, color: day.isToday ? '#7C3AED' : '#8890A8', fontWeight: day.isToday ? '700' : '500', marginBottom: 6 }}>
                                                {day.label}
                                            </Text>
                                            <View style={{
                                                width: 30, height: 30, borderRadius: 9,
                                                backgroundColor: day.isToday ? '#EDE9FE' : `${day.dotColor}18`,
                                                alignItems: 'center', justifyContent: 'center',
                                                borderWidth: day.isToday ? 1.5 : 0, borderColor: day.isToday ? '#7C3AED' : 'transparent',
                                            }}>
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: day.dotColor }} />
                                            </View>
                                            <Text style={{ fontSize: 10, color: day.isToday ? '#7C3AED' : '#B4BACC', marginTop: 4, fontWeight: day.isToday ? '700' : '400' }}>
                                                {day.dateNum}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Day detail rows */}
                            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden' }}>
                                {weekDays.map((day, idx) => (
                                    <View key={day.key} style={{
                                        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
                                        borderBottomWidth: idx < weekDays.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9',
                                        backgroundColor: day.isToday ? '#F5F3FF' : '#FFFFFF',
                                    }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: day.dotColor, marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: day.isToday ? '700' : '500', color: day.isToday ? '#1A1D2E' : '#4B5068' }}>
                                                {day.label} · {day.dateLabel}{day.isToday ? <Text style={{ color: '#7C3AED', fontSize: 11 }}> (Today)</Text> : null}
                                            </Text>
                                            {!day.isFuture && (
                                                <Text style={{ fontSize: 11, color: '#8890A8', marginTop: 1 }}>
                                                    {day.checkIn && day.checkOut
                                                        ? `${day.checkIn} – ${day.checkOut}${day.duration ? ` · ${day.duration}` : ''}`
                                                        : day.checkIn ? `In at ${day.checkIn}` : 'No record'}
                                                </Text>
                                            )}
                                        </View>
                                        {!day.isFuture && (
                                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${day.dotColor}18` }}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: day.dotColor }}>
                                                    {day.status === 'No Record' ? 'Absent' : day.status}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* ══════════════════ MONTH VIEW ══════════════════ */}
                    {viewMode === 'month' && !isFetching && (
                        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }}>
                            {/* Day-of-week header */}
                            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: i >= 5 ? '#EF4444' : '#8890A8' }}>{d}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Calendar grid */}
                            {(() => {
                                const rows: JSX.Element[] = [];
                                for (let i = 0; i < monthGrid.length; i += 7) {
                                    const rowCells = monthGrid.slice(i, i + 7);
                                    rows.push(
                                        <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                                            {rowCells.map((cell, j) => {
                                                if (!cell.date) return <View key={j} style={{ flex: 1 }} />;
                                                const dot = cell.isFuture ? '#E5E7EB' : (cell.record ? statusDotColor(cell.record.status) : '#EF4444');
                                                return (
                                                    <View key={j} style={{ flex: 1, alignItems: 'center' }}>
                                                        <View style={{
                                                            width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                                            backgroundColor: cell.isToday ? '#EDE9FE' : 'transparent',
                                                            borderWidth: cell.isToday ? 1.5 : 0, borderColor: '#7C3AED',
                                                        }}>
                                                            <Text style={{ fontSize: 12, fontWeight: cell.isToday ? '800' : '500', color: cell.isToday ? '#7C3AED' : '#4B5068' }}>
                                                                {cell.date.getDate()}
                                                            </Text>
                                                            {!cell.isFuture && (
                                                                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dot, marginTop: 1 }} />
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                            {/* Pad row if needed */}
                                            {rowCells.length < 7 && Array.from({ length: 7 - rowCells.length }).map((_, k) => (
                                                <View key={`pad-${k}`} style={{ flex: 1 }} />
                                            ))}
                                        </View>
                                    );
                                }
                                return rows;
                            })()}

                            {/* Legend */}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                {[{ label: 'Present', color: '#10B981' }, { label: 'Absent', color: '#EF4444' }, { label: 'Leave', color: '#3B82F6' }].map(({ label, color }) => (
                                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                                        <Text style={{ fontSize: 10, color: '#8890A8' }}>{label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* ── LEAVE & REGULARIZATION ENTRY ── */}
                <View style={{ marginHorizontal: 20, marginTop: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#B4BACC', letterSpacing: 0.5, marginBottom: 8 }}>REQUESTS</Text>
                    <Link href="/(protectedRoute)/attendance/leave-and-regularization" asChild>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <Calendar size={16} color="#7C3AED" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1D2E' }}>Leave & Regularization</Text>
                                <Text style={{ fontSize: 11, color: '#8890A8', marginTop: 1 }}>Apply for leave or correct attendance records</Text>
                            </View>
                            <ChevronRight size={16} color="#B4BACC" />
                        </TouchableOpacity>
                    </Link>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

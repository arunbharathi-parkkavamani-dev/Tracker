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
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext";
import { Link } from "expo-router";

export default function Attendance() {
    const { user, loading } = useContext(AuthContext);

    const [todayRecord, setTodayRecord] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [timeNow, setTimeNow] = useState(new Date());

    const [locationCoords, setLocationCoords] = useState(null);
    const [locationLabel, setLocationLabel] = useState("Fetching location...");
    const [isFetchingToday, setIsFetchingToday] = useState(false);
    const [isFetchingWeek, setIsFetchingWeek] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const hasCheckedIn = !!todayRecord?.checkIn;
    const hasCheckedOut = !!todayRecord?.checkOut;

    // ------------------ REAL-TIME CLOCK ------------------
    useEffect(() => {
        const interval = setInterval(() => setTimeNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ------------------ LOCATION LOGIC ------------------
    useEffect(() => {
        const requestLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    setLocationLabel("Location permission denied");
                    return;
                }

                const { coords } = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const coordPayload = {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                };
                setLocationCoords(coordPayload);

                // Reverse geocode to human readable address
                const places = await Location.reverseGeocodeAsync(coords);
                if (places && places.length > 0) {
                    const place = places[0];
                    const label =
                        place.name ||
                        place.street ||
                        `${place.city || ""} ${place.region || ""}`.trim() ||
                        "Current location";
                    setLocationLabel(label);
                } else {
                    setLocationLabel("Current location");
                }
            } catch (err) {
                console.log("Error fetching location:", err);
                setLocationLabel("Unable to fetch location");
            }
        };

        requestLocation();
    }, []);

    // ------------------ WEEK RANGE UTIL ------------------
    const getWeekRange = useCallback((referenceDate: Date) => {
        const date = new Date(referenceDate);
        const day = date.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
        const monday = new Date(date);
        monday.setDate(diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { start: monday, end: sunday };
    }, []);

    // ------------------ API: TODAY ATTENDANCE ------------------
    const fetchTodayAttendance = useCallback(async () => {
        if (!user) return;
        setIsFetchingToday(true);
        setError("");

        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const response = await axiosInstance.get(`/populate/read/attendances`, {
                params: {
                    employee: user.id,
                    "filter[date][$gte]": startOfDay.toISOString(),
                    "filter[date][$lte]": endOfDay.toISOString(),
                },
            });

            const records = response?.data?.data || [];
            const record = records[0] || null;
            setTodayRecord(record);
        } catch (err) {
            console.log("Failed to fetch today's attendance:", err);
            setError("Failed to load today's attendance");
        } finally {
            setIsFetchingToday(false);
        }
    }, [user]);

    // ------------------ API: WEEKLY ATTENDANCE ------------------
    const fetchWeeklyData = useCallback(
        async (referenceDate: Date = new Date()) => {
            if (!user) return;

            setIsFetchingWeek(true);
            try {
                const { start, end } = getWeekRange(referenceDate);
                const response = await axiosInstance.get(
                    "/populate/read/attendances",
                    {
                        params: {
                            employee: user.id,
                            "filter[date][$gte]": start.toISOString(),
                            "filter[date][$lte]": end.toISOString(),
                        },
                    }
                );

                setWeeklyData(response?.data?.data || []);
            } catch (err) {
                console.log("Failed to fetch weekly data:", err);
            } finally {
                setIsFetchingWeek(false);
            }
        },
        [user, getWeekRange]
    );

    // ------------------ INITIAL LOAD ------------------
    useEffect(() => {
        if (loading || !user) return;
        (async () => {
            await fetchTodayAttendance();
            await fetchWeeklyData(new Date());
        })();
    }, [user, loading, fetchTodayAttendance, fetchWeeklyData]);

    // ------------------ HELPERS ------------------
    const formatTime = (value?: string) => {
        if (!value) return "--:--";
        return new Date(value).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getWeeklySummary = () => {
        const summary = {
            totalDays: 7,
            present: 0,
            absent: 0,
            leave: 0,
            others: 0,
        };

        const { start } = getWeekRange(new Date());

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);

            const dateKey = day.toDateString();

            // Find attendance record for this exact date
            const record = weeklyData.find((r: any) => {
                if (!r.date) return false;
                return new Date(r.date).toDateString() === dateKey;
            });

            // No record = marked absent automatically
            if (!record) {
                summary.absent += 1;
                continue;
            }

            // Record exists, check status
            const status = (record.status || "").toLowerCase();

            if (status.includes("present")) summary.present += 1;
            else if (status.includes("leave")) summary.leave += 1;
            else if (status.includes("absent")) summary.absent += 1;
            else summary.others += 1;
        }

        return summary;
    };

    const buildWeekDays = useCallback(() => {
        const { start } = getWeekRange(new Date());
        const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            const dateString = date.toDateString();

            const record = weeklyData.find((r: any) => {
                if (!r.date) return false;
                const rd = new Date(r.date).toDateString();
                return rd === dateString;
            });

            const statusRaw = record?.status || "No Record";
            const statusLower = statusRaw.toLowerCase();

            let statusColor = { bg: "#e5e7eb", text: "#111827" }; // default gray
            if (statusLower.includes("present"))
                statusColor = { bg: "#dcfce7", text: "#166534" };
            else if (statusLower.includes("absent"))
                statusColor = { bg: "#fee2e2", text: "#b91c1c" };
            else if (statusLower.includes("leave"))
                statusColor = { bg: "#dbeafe", text: "#1d4ed8" };

            const checkIn = record?.checkIn ? formatTime(record.checkIn) : null;
            const checkOut = record?.checkOut ? formatTime(record.checkOut) : null;

            let duration = null;
            if (record?.checkIn && record?.checkOut) {
                const diffMs =
                    new Date(record.checkOut).getTime() -
                    new Date(record.checkIn).getTime();
                const hrs = Math.floor(diffMs / (1000 * 60 * 60));
                const mins = Math.floor(
                    (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                );
                duration = `${hrs}h ${mins}m`;
            }

            days.push({
                key: date.toISOString().slice(0, 10),
                label: labels[i],
                dateLabel: date.toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                }),
                status: statusRaw,
                statusColor,
                checkIn,
                checkOut,
                duration,
            });
        }

        return days;
    }, [weeklyData, getWeekRange]);

    const weekDays = buildWeekDays();
    const weeklySummary = getWeeklySummary();

    // ------------------ CHECK-IN ------------------
    const handleCheckIn = async () => {
        if (!user || hasCheckedIn || isSubmitting) return;

        setIsSubmitting(true);
        setError("");

        try {
            const now = new Date();
            const payload = {
                employee: user.id,
                employeeName: user.name,
                date: now.toISOString(),
                checkIn: now.toISOString(),
                status: "Present",
                managerId: user?.managerId,
                workType: "fixed",
                location: locationCoords || null,
            };

            await axiosInstance.post("/populate/create/attendances", payload);
            await fetchTodayAttendance();
            await fetchWeeklyData(new Date());

            Toast.show({
                type: "success",
                text1: "Checked in successfully",
                text2: now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } catch (err) {
            console.log("Check-in failed:", err);
            setError("Check-in failed");
            Toast.show({
                type: "error",
                text1: "Check-in failed",
                text2: "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ------------------ CHECK-OUT ------------------
    const handleCheckOut = async () => {
        if (!user || !todayRecord || !hasCheckedIn || hasCheckedOut || isSubmitting)
            return;

        setIsSubmitting(true);
        setError("");

        try {
            const now = new Date();
            const payload = {
                employee: user.id,
                employeeName: user.name,
                date: todayRecord.date || now.toISOString(),
                checkIn: todayRecord.checkIn,
                checkOut: now.toISOString(),
                status: todayRecord.status || "Present",
                managerId: todayRecord.managerId || user.managerId,
                workType: todayRecord.workType || "fixed",
                location: locationCoords || todayRecord.location || null,
            };

            await axiosInstance.put(
                `/populate/update/attendances/${todayRecord._id}`,
                payload
            );

            await fetchTodayAttendance();
            await fetchWeeklyData(new Date());

            Toast.show({
                type: "success",
                text1: "Checked out successfully",
                text2: now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } catch (err) {
            console.log("Check-out failed:", err);
            setError("Check-out failed");
            Toast.show({
                type: "error",
                text1: "Check-out failed",
                text2: "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ------------------ RENDER ------------------
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-950">
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                className="flex-1"
            >
                <Text className="text-2xl font-bold mb-4 pl-4 pt-4 text-white">
                    Attendance
                </Text>

                {error ? (
                    <Text className="text-red-400 px-4 mb-2">{error}</Text>
                ) : null}

                <View className="px-4 gap-4">
                    {/* TODAY CARD */}
                    <View className="bg-white/90 rounded-2xl p-5 shadow-lg">
                        {isFetchingToday ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator />
                                <Text className="ml-2 text-gray-600">
                                    Loading today&apos;s attendance...
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View className="flex-row justify-between items-center mb-3">
                                    <View>
                                        <Text className="text-base text-gray-500">
                                            Welcome back,
                                        </Text>
                                        <Text className="text-xl font-semibold text-gray-900">
                                            {user?.name}
                                        </Text>
                                        <Text className="text-sm text-gray-500 mt-1">
                                            Current Time:{" "}
                                            {timeNow.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-xs text-gray-400">
                                            {new Date().toLocaleDateString(undefined, {
                                                weekday: "short",
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </Text>
                                        <Text className="mt-1 text-xs text-gray-500 max-w-[150px] text-right">
                                            {locationLabel}
                                        </Text>
                                    </View>
                                </View>

                                <View className="border-t border-gray-200 my-3" />

                                {/* State-based actions */}
                                {!hasCheckedIn ? (
                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-base text-gray-800">
                                                You haven&apos;t checked in yet.
                                            </Text>
                                            <Text className="text-xs text-gray-500 mt-1">
                                                Tap the button to mark your attendance.
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            disabled={isSubmitting}
                                            onPress={handleCheckIn}
                                            className={`px-4 py-2 rounded-xl ${isSubmitting
                                                ? "bg-gray-400"
                                                : "bg-emerald-500 active:bg-emerald-600"
                                                }`}
                                        >
                                            <Text className="text-white font-semibold">
                                                {isSubmitting ? "Processing..." : "Check In"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : hasCheckedIn && !hasCheckedOut ? (
                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-1">
                                                Checked In At
                                            </Text>
                                            <Text className="text-2xl font-semibold text-emerald-600">
                                                {formatTime(todayRecord?.checkIn)}
                                            </Text>
                                            <Text className="text-xs text-gray-500 mt-2">
                                                Location: {locationLabel}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            disabled={isSubmitting}
                                            onPress={handleCheckOut}
                                            className={`px-4 py-2 rounded-xl ${isSubmitting
                                                ? "bg-gray-400"
                                                : "bg-rose-500 active:bg-rose-600"
                                                }`}
                                        >
                                            <Text className="text-white font-semibold">
                                                {isSubmitting ? "Processing..." : "Check Out"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-xs text-gray-500">
                                                Today&apos;s status
                                            </Text>
                                            <Text className="text-2xl font-semibold text-gray-900 mt-1">
                                                Checked Out
                                            </Text>
                                            <Text className="text-sm text-gray-600 mt-1">
                                                Out at {formatTime(todayRecord?.checkOut)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            disabled
                                            className="px-4 py-2 rounded-xl bg-gray-200"
                                        >
                                            <Text className="text-gray-500 font-semibold">
                                                Completed
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>

                    {/* WEEKLY SUMMARY CARD */}
                    <View className="bg-white/90 rounded-2xl p-5 shadow-lg mt-2">
                        <View className="flex-row justify-between items-center lg-3">
                            <View>
                                <Text className="p-2 text-md font-semibold text-gray-900">
                                    This Week Summary
                                </Text>
                            </View>
                            {isFetchingWeek && <ActivityIndicator size="small" />}
                        </View>

                        {/* Summary stats */}
                        <View className="p-2 flex-row justify-between mb-3">
                            <View className="flex-1 items-center">
                                <Text className="text-xs text-gray-500">Present</Text>
                                <Text className="text-lg font-bold text-emerald-600">
                                    {weeklySummary.present}
                                </Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-xs text-gray-500">Absent</Text>
                                <Text className="text-lg font-bold text-rose-500">
                                    {weeklySummary.absent}
                                </Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-xs text-gray-500">Leave</Text>
                                <Text className="text-lg font-bold text-blue-500">
                                    {weeklySummary.leave}
                                </Text>
                            </View>
                            <View className="flex-1 items-center">
                                <Text className="text-xs text-gray-500">Others</Text>
                                <Text className="text-lg font-bold text-amber-500">
                                    {weeklySummary.others}
                                </Text>
                            </View>
                        </View>

                        <View className="border-t border-gray-200 my-3" />

                        {/* Weekly list (independent view inside scroll) */}
                        <View>
                            {weekDays.map((day) => (
                                <View
                                    key={day.key}
                                    className="flex-row items-center justify-between py-2"
                                >
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-900">
                                            {day.label} • {day.dateLabel}
                                        </Text>
                                        <Text className="text-xs text-gray-500 mt-1">
                                            {day.checkIn && day.checkOut
                                                ? `${day.checkIn} - ${day.checkOut}${day.duration ? ` (${day.duration})` : ""
                                                }`
                                                : day.checkIn
                                                    ? `In at ${day.checkIn}`
                                                    : "No record"}
                                        </Text>
                                    </View>
                                    <View
                                        className="px-3 py-1 rounded-full ml-2"
                                        style={{
                                            backgroundColor: day.statusColor.bg,
                                        }}
                                    >
                                        <Text
                                            className="text-xs font-semibold"
                                            style={{ color: day.statusColor.text }}
                                        >
                                            {day.status}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View>
                            <Link href="/(protectedRoute)/attendance/leave-and-regularization" asChild>
                                <Text>Leave & Regularization</Text>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

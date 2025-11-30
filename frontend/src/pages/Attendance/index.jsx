import { useEffect, useState, useCallback } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { Badge } from "@mui/material";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import LeaveAndRegularization from "./Leave&Regularization.jsx";
import toast, { Toaster } from "react-hot-toast";

const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();

  // 📊 State
  const [todayRecord, setTodayRecord] = useState(null);
  const [dayData, setDayData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [isFetchingToday, setIsFetchingToday] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState("");
  const [timeNow, setTimeNow] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  // 🕐 Realtime clock
  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 🧭 Fetch location name
  useEffect(() => {
    const fetchLocation = async () => {
      if (!todayRecord?.location) return;
      const { latitude, longitude } = todayRecord.location;
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "Logimax-HR/1.0" },
        });
        const data = await response.json();
        setLocation(data?.display_name || "Unknown location");
      } catch (err) {
        console.error("Error fetching location:", err);
        setLocation("Error fetching location");
      }
    };
    fetchLocation();
  }, [todayRecord]);

  // 🧩 Utility: Get month start & end
  const getMonthRange = useCallback((date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return { start, end };
  }, []);

  // 📅 Fetch attendance for selected date only
  const fetchTodayAttendance = useCallback(async () => {
    if (!user || !selectedDate) return;

    setIsFetchingToday(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filter = JSON.stringify({
        employee: user.id,
        date: {
          $gte: startOfDay.toISOString(),
          $lte: endOfDay.toISOString()
        }
      });
      const response = await axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`);

      const records = response.data?.data || [];
      const record = records.find(
        (r) =>
          new Date(r.date).toDateString() ===
          new Date(selectedDate).toDateString()
      );
      setTodayRecord(record || null);
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err);
      setError("Failed to load today's attendance");
    } finally {
      setIsFetchingToday(false);
    }
  }, [user, selectedDate]);

  // 📆 Fetch monthly attendance data
  const fetchDayData = useCallback(
    async (monthDate) => {
      if (!user) return;
      try {
        const { start, end } = getMonthRange(monthDate);
        const filter = JSON.stringify({
          employee: user.id,
          date: { $gte: start, $lte: end }
        });
        const response = await axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`);
        setDayData(response.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch monthly data:", err);
      }
    },
    [user, getMonthRange]
  );

  // 🔁 Initial data fetch (once)
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      setLoading(true);
      await fetchTodayAttendance();
      await fetchDayData(new Date());
      setLoading(false);
    })();
  }, [user, authLoading, fetchTodayAttendance, fetchDayData]);

  // 📅 Fetch only today's data when selectedDate changes
  useEffect(() => {
    if (!user || authLoading) return;
    fetchTodayAttendance();
  }, [authLoading, fetchTodayAttendance, selectedDate, user]);

  // 🟢 Check-In
  const handleCheckIn = async () => {
    if (!user) return;
    const payload = {
      employee: user.id,
      employeeName: user.name,
      date: selectedDate,
      checkIn: new Date().toISOString(),
      status: "Present",
      managerId: user.managerId,
      workType: "fixed",
      location: { latitude: 10.9338987, longitude: 76.9839277 },
    };
    try {
      const response = await axiosInstance.post(`/populate/create/attendances`, payload);
      if (response.data.success) {
        await fetchTodayAttendance();
        handleSuccess("Successfully checked in!");
        await fetchDayData(new Date(selectedDate));
      } else {
        throw new Error(response.data.message || "Check-in failed");
      }
    } catch (err) {
      console.error("Check-in failed:", err);
      const errorMessage = err.response?.data?.message || err.message || "Check-in failed";
      handleFailed(errorMessage);
      setError(errorMessage);
    }
  };

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axiosInstance.get(
          "/populate/read/leaves?fields=employeeId,departmentId,status,managerId"
        );
      } catch (error) {
        console.log(error);
      }
    };

    fetchLeaves();
  }, []); // <-- dependency array

  // 🔴 Check-Out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      const response = await axiosInstance.put(
        `/populate/update/attendances/${todayRecord._id}`,
        {
          checkOut: new Date().toISOString(),
          location: { latitude: 10.9338987, longitude: 76.9839277 },
        }
      );
      if (response.data.success) {
        await fetchTodayAttendance();
        handleSuccess("Successfully checked out!");
        await fetchDayData(new Date(selectedDate));
      } else {
        throw new Error(response.data.message || "Check-out failed");
      }
    } catch (err) {
      console.error("Check-out failed:", err);
      const errorMessage = err.response?.data?.message || err.message || "Check-out failed";
      handleFailed(errorMessage);
      setError(errorMessage);
    }
  };

  const handleOpenAdd = () => {
    setShowModal(true);
    window.history.pushState(null, "", `/attendance/add`);
  };

  const handleCloseAdd = () => {
    setShowModal(false);
    window.history.pushState(null, "", `/attendance`);
  };

  const handleSuccess = (message = "Operation completed successfully!") => {
    toast.success(message);
  };

  const handleFailed = (message = "Operation failed. Please try again.") => {
    toast.error(message);
  };

  // 🎨 Custom MUI Calendar Day renderer
  const renderDay = (dayProps) => {
    const { day, outsideCurrentMonth, ...other } = dayProps;
    const date = day;
    const record = dayData.find(
      (rec) => new Date(rec.date).toDateString() === date.toDateString()
    );

    let bgColor = "";
    if (record?.status) {
      const status = record.status.trim().toLowerCase();
      const map = {
        present: "#16a34a",
        absent: "#dc2626",
        leave: "#22c55e",
        "half day": "#fb923c",
        "work from home": "#3b82f6",
        "early check-out": "#8b5cf6",
        "check-out": "#14b8a6",
        lop: "#7f1d1d",
      };
      bgColor = map[status] || "";
    }

    return (
      <Badge
        key={date.toISOString()}
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          "& .MuiBadge-badge": {
            backgroundColor: bgColor,
            color: "#fff",
            borderRadius: "50%",
            width: 8,
            height: 8,
          },
        }}
      >
        <PickersDay
          {...other}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          sx={{
            borderRadius: "12px",
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              backgroundColor: "#2563eb !important",
              color: "#fff",
            },
            "&:hover": {
              backgroundColor: "rgba(37,99,235,0.15)",
            },
            ...(bgColor && {
              border: `2px solid ${bgColor}`,
            }),
          }}
        />
      </Badge>
    );
  };

  // ⏳ Loading / Error
  if (loading || authLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading attendance...</p>
        </div>
      </div>
    );
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Attendance Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Track your daily attendance and manage leave requests
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Attendance Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20">
            {isFetchingToday ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600 dark:text-gray-300">Loading attendance data...</span>
              </div>
            ) : !hasCheckedIn ? (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    Welcome back, {user.name}! 👋
                  </h2>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-6 mb-6">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {timeNow.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCheckIn}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Check In</span>
                </button>
              </div>
            ) : hasCheckedIn && !hasCheckedOut ? (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Checked In</h2>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-2xl p-6 mb-6">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {new Date(todayRecord.checkIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">Check-in Location:</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{location || 'Loading location...'}</p>
                  </div>
                </div>
                <button
                  onClick={handleCheckOut}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check Out</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Day Complete</h2>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 mb-6">
                    <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                      Checked out at {new Date(todayRecord.checkOut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">Have a great day!</p>
                  </div>
                </div>
                <button
                  disabled
                  className="bg-gray-400 text-white font-bold py-4 px-8 rounded-2xl cursor-not-allowed opacity-50 flex items-center space-x-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Checked Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar & Actions Panel */}
        <div className="space-y-6">
          {/* Leave & Regularization Button */}
          <button
            onClick={handleOpenAdd}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Leave & Regularization</span>
          </button>

          {/* Calendar */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-3xl p-6 border border-white/20">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={new Date(selectedDate)}
                onChange={(date) =>
                  date && setSelectedDate(date.toISOString().slice(0, 10))
                }
                onMonthChange={(monthDate) => fetchDayData(monthDate)}
                slots={{ day: renderDay }}
                sx={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  '& .MuiPickersCalendarHeader-root': {
                    paddingLeft: 1,
                    paddingRight: 1,
                    marginTop: 1
                  },
                  '& .MuiDayCalendar-header': {
                    paddingLeft: 1,
                    paddingRight: 1
                  },
                  '& .MuiPickersDay-root': {
                    borderRadius: '12px',
                    margin: '2px',
                    fontSize: '0.875rem'
                  }
                }}
              />
            </LocalizationProvider>
          </div>
        </div>
      </div>

      {showModal && (
        <FloatingCard onClose={handleCloseAdd}>
          <LeaveAndRegularization
            onClose={handleCloseAdd}
            onSuccess={handleSuccess}
            onFailed={handleFailed}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default AttendancePage;

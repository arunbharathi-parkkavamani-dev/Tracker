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
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance</h1>
          <p className="text-gray-600">Track your daily attendance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Attendance Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border p-8 transition-all duration-300 hover:shadow-md">
              {isFetchingToday ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              ) : !hasCheckedIn ? (
                <div className="text-center animate-slide-up">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Welcome back, {user.name}
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-xl font-mono text-blue-600 mb-1">
                        {timeNow.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckIn}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Check In
                  </button>
                </div>
              ) : hasCheckedIn && !hasCheckedOut ? (
                <div className="text-center animate-slide-up">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                      <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Checked In
                    </h2>
                    <div className="bg-green-50 rounded-xl p-4 mb-6">
                      <p className="text-lg font-medium text-green-700 mb-1">
                        {new Date(todayRecord.checkIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      <p className="text-sm text-gray-600">Check-in time</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckOut}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Check Out
                  </button>
                </div>
              ) : (
                <div className="text-center animate-slide-up">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Day Complete
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-lg font-medium text-gray-700 mb-1">
                        {new Date(todayRecord.checkOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      <p className="text-sm text-gray-500">Checked out</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-xl cursor-not-allowed"
                  >
                    Checked Out
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Leave & Regularization</span>
            </button>

            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm border p-4 transition-all duration-300 hover:shadow-md">
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
                    '& .MuiPickersDay-root': {
                      borderRadius: '8px',
                      margin: '1px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    },
                    '& .MuiPickersCalendarHeader-root': {
                      paddingLeft: 1,
                      paddingRight: 1
                    }
                  }}
                />
              </LocalizationProvider>
            </div>
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
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AttendancePage;

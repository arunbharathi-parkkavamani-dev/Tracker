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
import toast, {Toaster} from "react-hot-toast";

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

      const response = await axiosInstance.get(`/populate/read/attendances`, {
        params: {
          employee: user.id,
          "filter[date][$gte]": startOfDay.toISOString(),
          "filter[date][$lte]": endOfDay.toISOString(),
        },
      });

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
        const response = await axiosInstance.get(`/populate/read/attendances`, {
          params: {
            employee: user.id,
            "filter[date][$gte]": start,
            "filter[date][$lte]": end,
          },
        });
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
      workType : "fixed",
      location: { latitude: 10.9338987, longitude: 76.9839277 },
    };
    try {
      await axiosInstance.post(`/populate/create/attendances`, payload);
      alert("Checked in successfully");
      await fetchTodayAttendance();
      await fetchDayData(new Date(selectedDate));
    } catch (err) {
      console.error("Check-in failed:", err);
      setError("Check-in failed");
    }
  };

  // 🔴 Check-Out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      await axiosInstance.put(
        `/populate/update/attendances/${todayRecord._id}`,
        {
          employee: user.id,
          employeeName: user.name,
          date: selectedDate,
          checkOut: new Date().toISOString(),
          location: { latitude: 10.9338987, longitude: 76.9839277 },
        }
      );
      await fetchTodayAttendance();
      await fetchDayData(new Date(selectedDate));
    } catch (err) {
      console.error("Check-out failed:", err);
      setError("Check-out failed");
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

  const handleLeaveSuccess = () => {
    toast.success("Leave request submitted successfully!");
  };

  const handleLeaveFailed = () => {
    toast.error("You Can't make a leave request")
  }

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
    return <p className="text-gray-600 dark:text-gray-300">Loading attendance...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="dark:text-white text-black">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-4 pl-4 pt-4">Attendance</h2>

      {/* Layout Wrapper */}
      <div className="flex flex-wrap justify-between items-start gap-6 px-6">
        {/* LEFT PANEL */}
        <div className="flex-1 min-w-[55%] bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-6">
          {isFetchingToday ? (
            <p className="text-gray-500">Loading selected day...</p>
          ) : !hasCheckedIn ? (
            <div className="flex justify-between items-center">
              <div>
                <p>Welcome back, {user.name}! 🖐️</p>
                <p className="text-lg text-gray-700">
                  Current Time:{" "}
                  <b>
                    {timeNow.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </b>
                </p>
                <p>Checked in Location:</p>
                <p>Loading...</p>
              </div>
              <button
                onClick={handleCheckIn}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Check In
              </button>
            </div>
          ) : hasCheckedIn && !hasCheckedOut ? (
            <div className="flex justify-between items-center w-full">
              <div>
                <p className="text-2xl font-bold">Check In</p>
                <p className="text-lg text-gray-700">
                  {new Date(todayRecord.checkIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
                <p>Checked in Location:</p>
                <p className="pr-4">{location}</p>
              </div>
              <button
                onClick={handleCheckOut}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                Check Out
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">Checked Out</p>
                <p className="text-lg text-gray-700">
                  {new Date(todayRecord.checkOut).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
              <button
                disabled
                className="bg-gray-400 text-black font-bold py-2 px-4 rounded cursor-not-allowed"
              >
                Checked Out
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[40%] flex flex-col items-center rounded-2xl pl-5 h-fit">
          <button
            onClick={handleOpenAdd}
            className="mb-5 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Leave & Regularization
          </button>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={new Date(selectedDate)}
              onChange={(date) =>
                date && setSelectedDate(date.toISOString().slice(0, 10))
              }
              onMonthChange={(monthDate) => fetchDayData(monthDate)}
              slots={{ day: renderDay }}
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(30,30,30,0.8)"
                    : "rgba(255,255,255,0.9)",
                borderRadius: "12px",
                padding: 1,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            />
          </LocalizationProvider>
        </div>
      </div>

      {showModal && (
        <FloatingCard onClose={handleCloseAdd}>
          <LeaveAndRegularization 
          onClose={handleCloseAdd}
          onSuccess={handleLeaveSuccess}
          onFailed={handleLeaveFailed}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default AttendancePage;

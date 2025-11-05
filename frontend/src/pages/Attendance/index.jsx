import { useEffect, useState, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";

const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();

  // 📊 State
  const [todayRecord, setTodayRecord] = useState(null);
  const [dayData, setDayData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState("");
  const [timeNow, setTimeNow] = useState(new Date());

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  // 🕐 Realtime clock
  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 🧭 Fetch location name (reverse geocoding)
  useEffect(() => {
    const fetchLocation = async () => {
      if (!todayRecord?.location) return;
      const { latitude, longitude } = todayRecord.location;
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "YourAppName/1.0" },
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

  // 🧩 Utility: Get month start & end date
  const getMonthRange = useCallback((date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return { start, end };
  }, []);

  // 📅 Fetch attendance for selected day
  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get(
        `/populate/read/attendances?employee=${user.id}&date=${selectedDate}`
      );
      const record = response.data?.data?.[0] || null;
      setTodayRecord(record);
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err);
      setError("Failed to load today's attendance");
    }
  }, [user, selectedDate]);

  // 📆 Fetch all attendances for month
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

  // 🔁 Initial fetch
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      setLoading(true);
      await fetchTodayAttendance();
      await fetchDayData(new Date(selectedDate));
      setLoading(false);
    })();
  }, [user, authLoading, selectedDate, fetchTodayAttendance, fetchDayData]);

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

  // 🎨 Tile coloring logic
  const tileClassName = useCallback(
    ({ date, view }) => {
      if (view === "month") {
        const record = dayData.find(
          (rec) => new Date(rec.date).toDateString() === date.toDateString()
        );

        if (!record?.status) return "";

        const status = record.status.trim().toLowerCase();
        const map = {
          "present": "!bg-green-400 !text-white",
          "absent": "!bg-red-400 !text-white",
          "leave": "!bg-green-400 !text-black",
          "half day": "!bg-orange-400 !text-white",
          "work from home": "!bg-blue-400 !text-white",
          "early check-out": "!bg-purple-400 !text-orange-900",
          "check-out": "!bg-teal-400 !text-white",
          "lop" : "!bg-red-700 !text-white"
        };
        return map[status] || "";
      }
      return "";
    },
    [dayData]
  );

  if (loading || authLoading)
    return <p className="text-gray-600 dark:text-gray-300">Loading attendance...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="dark:text-white text-black">
      <h2 className="text-2xl font-bold mb-4 pl-4 pt-4">Attendance</h2>

      <div className="pl-4 grid grid-cols-5 gap-3">
        {/* Left Panel */}
        <div className="col-span-3 bg-white/70 backdrop-blur-md shadow-lg rounded-lg p-6">
          {/* Check-in panel */}
          {!hasCheckedIn && (
            <div className="flex justify-between items-center">
              <div>
                <p>Welcome back, {user.name}! 🖐️</p>
                <p className="text-lg text-gray-700">
                  Current Time:{" "}
                  <b>{timeNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b>
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
          )}

          {/* Check-out panel */}
          {hasCheckedIn && !hasCheckedOut && (
            <div className="flex justify-between items-center">
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
          )}

          {/* Completed Check-out */}
          {hasCheckedOut && (
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

        {/* Right Panel - Calendar */}
        <div className="col-span-2 row-span-2 pl-4">
          <Calendar
            onChange={(date) => setSelectedDate(date.toISOString().slice(0, 10))}
            onActiveStartDateChange={({ activeStartDate }) => fetchDayData(activeStartDate)}
            value={new Date(selectedDate)}
            tileClassName={tileClassName}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;

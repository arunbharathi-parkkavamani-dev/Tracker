/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const [attendance, setAttendance] = useState([]); // daily attendance array
  const [todayRecord, setTodayRecord] = useState(null); // today's attendance
  const [monthData, setMonthData] = useState([]); // for calendar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);

  // Fetch attendance for a specific date
  const fetchTodayAttendance = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get(
        `/populate/read/attendances?employee=${user.id}&date=${selectedDate}`
      );
      const records = response.data.data || [];
      const record = records[0] || null;

      setTodayRecord(record);
      setHasCheckedIn(!!record?.checkIn);
      setHasCheckedOut(!!record?.checkOut);
      setAttendance(records);
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err);
      setError("Failed to load today's attendance");
    }
  };

  // Fetch attendance for month (calendar)
  const fetchMonthData = async (date) => {
    if (!user) return;
    try {
      const month = date.toISOString().slice(0, 7); // YYYY-MM
      const response = await axiosInstance.get(
        `/populate/read/attendances?employee=${user.id}&month=${month}`
      );
      setMonthData(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch month data:", err);
    }
  };

  // Fetch data when user or selectedDate changes
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await fetchTodayAttendance();
      await fetchMonthData(new Date(selectedDate));
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, selectedDate]);

  // Handle Check-In
  const handleCheckIn = async () => {
    if (!user) return;
    const payload = {
      employee: user.id,
      employeeName: user.name,
      date: selectedDate,
      checkInTime: new Date().toISOString(),
      status: "Present",
      managerId: user.managerId,
      location: {
        latitude: 10.9338987,
        longitude: 76.9839277,
      },
    };

    try {
      await axiosInstance.post(`/populate/create/attendances`, payload);
      alert("Checked in successfully");
      await fetchTodayAttendance();
      await fetchMonthData(new Date(selectedDate));
    } catch (err) {
      console.error("Check-in failed:", err);
      setError("Check-in failed");
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      await axiosInstance.put(
        `/populate/update/attendances/${todayRecord._id}`,
        {
          employee: user.id,
          date: selectedDate,
          checkOutTime: new Date().toISOString(),
        }
      );
      await fetchTodayAttendance();
      await fetchMonthData(new Date(selectedDate));
    } catch (err) {
      console.error("Check-out failed:", err);
      setError("Check-out failed");
    }
  };

  // Calendar tile coloring
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dayRecord = monthData.find(
        (rec) => new Date(rec.date).toDateString() === date.toDateString()
      );

      if (dayRecord) {
        switch (dayRecord.status) {
          case "Present":
            return "bg-green-400 text-white";
          case "Absent":
            return "bg-red-400 text-white";
          case "Leave":
            return "bg-yellow-400 text-black";
          case "Half Day":
            return "bg-orange-400 text-white";
          case "Work From Home":
            return "bg-blue-400 text-white";
          case "Early check-out":
            return "bg-purple-400 text-orange-900";
          case "Check-Out":
            return "bg-teal-400 text-white";
          default:
            return "";
        }
      }
    }
    return "";
  };

  if (loading || authLoading) return <p>Loading attendance...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 grid grid-cols-4 gap-6 h-screen dark:text-white">
      {/* Left Panel */}
      <div className="col-span-3 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {!hasCheckedIn ? (
            <button
              onClick={handleCheckIn}
              className="w-40 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Check In
            </button>
          ) : (
            <div className="flex flex-col items-center">
              <button
                disabled
                className="w-40 bg-gray-400 text-black font-semibold py-2 px-4 rounded-lg cursor-not-allowed dark:text-white"
              >
                Checked In
              </button>
              <p className="text-lg text-black mt-2">
                <strong>Check-In:</strong>{" "}
                {todayRecord?.checkIn
                  ? new Date(todayRecord.checkIn).toLocaleTimeString()
                  : "—"}
              </p>
            </div>
          )}

          {hasCheckedIn && !hasCheckedOut ? (
            <button
              onClick={handleCheckOut}
              className="w-40 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Check Out
            </button>
          ) : (
            <div className="flex flex-col items-center">
              <button
                disabled
                className="w-40 bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
              >
                {hasCheckedOut ? "Checked Out" : "Check Out"}
              </button>
              <p className="text-lg text-black mt-2">
                <strong>Check-Out:</strong>{" "}
                {todayRecord?.checkOut
                  ? new Date(todayRecord.checkOut).toLocaleTimeString()
                  : "—"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel Calendar */}
      <div className="col-span-1 relative pl-6 flex flex-col">
        <div className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-300"></div>
        <h2 className="text-lg text-black mb-2">Attendance Calendar</h2>
        <Calendar
          onChange={(value) =>
            setSelectedDate(new Date(value).toISOString().split("T")[0])
          }
          value={new Date(selectedDate)}
          tileClassName={tileClassName}
        />
      </div>
    </div>
  );
};

export default AttendancePage;

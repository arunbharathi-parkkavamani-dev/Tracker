import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [monthData, setMonthData] = useState([]); // for calendar

  // Fetch attendance by employee + date
  const fetchAttendance = async () => {
    if (!user) return;

    try {
      const response = await axiosInstance.get(
        `/populate/read/attendances?employee=${user._id}&date=${selectedDate}`,
        { withCredentials: true }
      );
      setAttendance(response.data.data || []);
      console.log("Fetched attendance:", response.data.data);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance for month (calendar)
  const fetchMonthData = async (date) => {
    if (!user) return;
    try {
      const month = date.toISOString().slice(0, 7); // YYYY-MM
      const response = await axiosInstance.get(
        `/populate/read/attendances?employee=${user._id}&month=${month}`,
        { withCredentials: true }
      );
      setMonthData(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch month data:", err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("User not logged in");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAttendance();
    fetchMonthData(new Date(selectedDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, selectedDate]);

  // Handle Check-In
  const handleCheckIn = async () => {
    try {
      await axiosInstance.post(
        `/populate/create/attendances`,
        {
          employee: user.id,
          date: selectedDate,
          checkInTime: new Date().toISOString(),
          status: "Present",
          managerId: user.managerId,
        },
        { withCredentials: true }
      );
      alert("Checked in successfully");
      await fetchAttendance();
      await fetchMonthData(new Date(selectedDate));
    } catch (err) {
      console.error("Check-in failed:", err);
      setError("Check-in failed");
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    try {
      const todayRecord = attendance[0];
      if (!todayRecord) return;

      await axiosInstance.put(
        `/populate/update/attendances/${todayRecord._id}`,
        {
          employee: user.id,
          date: selectedDate,
          checkOut: new Date().toISOString(),
        },
        { withCredentials: true }
      );
      await fetchAttendance();
      await fetchMonthData(new Date(selectedDate));
    } catch (err) {
      console.error("Check-out failed:", err);
      setError("Check-out failed");
    }
  };

  if (loading || authLoading) return <p>Loading attendance...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const todayRecord = attendance[0];
  const hasCheckedIn = todayRecord?.checkIn;
  const hasCheckedOut = todayRecord?.checkOut;

  // Calendar tile coloring
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dayRecord = monthData.find(
        (rec) => new Date(rec.date).toDateString() === date.toDateString()
      );
      console.log(
        "Day record for",
        date,
        ":",
        dayRecord,
        "Status:",
        dayRecord?.status
      );

      if (dayRecord) {
        if (dayRecord.status === "Present") return "bg-green-400 text-white";
        if (dayRecord.status === "Absent") return "bg-red-400 text-white";
        if (dayRecord.status === "Leave") return "bg-yellow-400 text-black";
        if (dayRecord.status === "Half Day") return "bg-orange-400 text-white";
        if (dayRecord.status === "Work From Home")
          return "bg-blue-400 text-white";
        if (dayRecord.status === "Early check-out")
          return "bg-purple-400 text-orange-900";
        if (dayRecord.status === "Check-Out") return "bg-teal-400 text-white";
        // Add more status colors as needed
      }
    }
    return ""; // ← default calendar styling
  };

  return (
    <div className="p-4 grid grid-cols-4 gap-6 h-screen dark:text-white">
      {/* Left Panel (3 cols) */}
      <div className="col-span-3 flex flex-col items-center justify-center">
        {/* Check-In / Check-Out buttons centered */}
        <div className="flex flex-col items-center gap-4">
          {!hasCheckedIn ? (
            <button
              onClick={handleCheckIn}
              className="w-40 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Check In
            </button>
          ) : (
            <div>
              <button
                disabled
                className="w-40 bg-gray-400 text-black font-semibold py-2 px-4 rounded-lg cursor-not-allowed dark:text-white"
              >
                Checked In
              </button>
              <p className="text-lg text-black">
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
            <div>
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

        {/* Times below buttons */}
        <div className="mt-6 text-center"></div>
      </div>

      {/* Right Panel Calendar */}
      <div className="col-span-1 relative pl-6 flex flex-col">
        {/* Vertical line aligned with calendar */}
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

import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import Cookies from "js-cookie";
import {jwtDecode } from "jwt-decode";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // ✅ Get token from cookies
        const token = Cookies.get("token");
        console.log(token)
        if (!token) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        // ✅ Decode JWT to extract userId
        const decoded = jwtDecode(token);
        const userId = decoded?.id || decoded?._id; // depends on how you issued the token

        if (!userId) {
          setError("Invalid user session");
          setLoading(false);
          return;
        }

        // ✅ Fetch attendance for the logged-in user
        const response = await axiosInstance.get(
          `/populate/read/attendance?filters=employee,${userId}`,{ withCredentials: true }
        );

        setAttendance(response.data.data || []); // adjust if API shape differs
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to fetch attendance");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) return <p>Loading attendance...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">My Attendance</h1>
      {attendance.length > 0 ? (
        <table className="table-auto border-collapse border border-gray-300 w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Date</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((entry, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 px-4 py-2">
                  {entry.date}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {entry.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No attendance records found.</p>
      )}
    </div>
  );
};

export default AttendancePage;

import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import {useNavigate} from "react-router-dom";

const DailyTracker = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(
          "/populate/read/dailyactivities",
          { withCredentials: true }
        );
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh(!refresh);
  };
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h1 className="font-bold text-black">Daily Tracker</h1>
      <div className="flex flex-column align-right">
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={()=>{navigate("/daily-tracker/add-daily-activity");}}>
          Add Daily Activity
            </button>
          </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
};
export default DailyTracker;

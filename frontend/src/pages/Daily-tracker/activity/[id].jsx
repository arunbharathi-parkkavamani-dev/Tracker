import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import Activity from "../Activity";
import FloatingCard from "../../../components/Common/FloatingCard";

const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const populateFields = {
          'projectType': 'name',
          'activityType': 'name', 
          'client': 'name',
          'user': 'basicInfo.firstName,basicInfo.lastName'
        };
        
        const response = await axiosInstance.get(
          `/populate/read/dailyactivities/${id}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
        );
        
        setActivity(response.data.data);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchActivity();
    }
  }, [id]);

  const handleClose = () => {
    navigate('/daily-tracker');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg">Loading activity...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg">Activity not found</div>
      </div>
    );
  }

  const location = useLocation();
  const isDirectNavigation = location.pathname.includes('/daily-tracker/activity/');

  if (isDirectNavigation) {
    // Direct navigation - show as floating card
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <FloatingCard onClose={handleClose}>
          <Activity
            activity={activity}
            onClose={handleClose}
          />
        </FloatingCard>
      </div>
    );
  }

  // Modal mode - return just the Activity
  return (
    <Activity
      activity={activity}
      onClose={handleClose}
    />
  );
};

export default ActivityDetailPage;
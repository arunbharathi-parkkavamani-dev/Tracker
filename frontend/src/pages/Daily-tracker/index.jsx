import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import AddDailyEntry from "./add-daily-activity.jsx";
import Activity from "./activity.jsx";
import { MdAdd, MdRefresh, MdCalendarToday, MdAccessTime } from "react-icons/md";

const DailyTracker = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const filter = JSON.stringify({ employee: user.id });
        const populateFields = JSON.stringify({
          'employee': 'basicInfo.firstName,basicInfo.lastName'
        });
        
        const response = await axiosInstance.get(
          `/populate/read/dailyactivities?filter=${encodeURIComponent(filter)}&populateFields=${encodeURIComponent(populateFields)}&sort={"date":-1}`
        );
        
        if (response.data.success) {
          setData(response.data.data || []);
          setError(null);
        } else {
          throw new Error(response.data.message || "Failed to fetch activities");
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError(err.response?.data?.message || err.message || "Failed to load activities");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh, user]);

  const handleRefresh = () => setRefresh((prev) => !prev);

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHours = (hours) => {
    return `${hours}h`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Loading activities...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Daily Activities</h1>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all duration-200"
          >
            <MdRefresh size={20} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <MdAdd size={20} />
            Add Activity
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">My Activities ({data.length})</h3>
        </div>
        
        <div className="overflow-y-auto h-full">
          {data.length > 0 ? (
            <div className="divide-y">
              {data.map((activity) => (
                <div
                  key={activity._id}
                  onClick={() => handleActivityClick(activity)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MdCalendarToday className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDate(activity.date)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {activity.activities && activity.activities.map((act, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800">
                                {act.description || 'No description'}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MdAccessTime className="w-4 h-4" />
                                {formatHours(act.hours || 0)}
                              </div>
                            </div>
                            {act.remarks && (
                              <p className="text-sm text-gray-600">{act.remarks}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {formatHours(activity.totalHours || 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <MdCalendarToday className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No activities found</p>
              <p className="text-sm">Start by adding your first daily activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedActivity && (
        <FloatingCard onClose={() => setSelectedActivity(null)}>
          <Activity 
            activity={selectedActivity} 
            onClose={() => setSelectedActivity(null)} 
          />
        </FloatingCard>
      )}
      
      {showAddModal && (
        <FloatingCard onClose={() => setShowAddModal(false)}>
          <AddDailyEntry 
            onClose={() => {
              setShowAddModal(false);
              handleRefresh();
            }} 
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default DailyTracker;
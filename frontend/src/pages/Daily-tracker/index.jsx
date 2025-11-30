import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import AddDailyEntry from "./add-daily-activity.jsx";
import Activity from "./activity.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";

const DailyTracker = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [bgColors, setBgColors] = useState({});
  const [selectedactivity, setSelectedactivity] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { user, loading } = useAuth();

  // Fetch daily activities
  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      try {
        const filter = JSON.stringify({ user: user.id });
        const populateFields = JSON.stringify({
          'projectType': 'name',
          'activityType': 'name', 
          'client': 'name',
          'user': 'basicInfo.firstName,basicInfo.lastName'
        });
        
        const response = await axiosInstance.get(
          `/populate/read/dailyactivities?filter=${encodeURIComponent(filter)}&populateFields=${encodeURIComponent(populateFields)}`
        );
        
        if (response.data.success) {
          setData(response.data.data || []);
          setError(null);
        } else {
          throw new Error(response.data.message || "Failed to fetch activities");
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load activities";
        setError(errorMessage);
      }
    };
    fetchData();
  }, [refresh, user]);

  const handleRefresh = () => setRefresh((prev) => !prev);

  // Random pastel color
  const getRandomColor = () => {
    const colors = ["#c3d7d9", "#8a999b", "#a6b7ba"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Select client and assign random colors for project groups
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    const clientData = data.filter((d) => d.client?._id === client._id);
    const grouped = clientData.reduce((acc, item) => {
      const key = item.projectType?.name || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    const newColors = {};
    Object.keys(grouped).forEach((key) => {
      newColors[key] = getRandomColor();
    });
    setBgColors(newColors);
  };

  // Handle viewing a activity
  const handleActivityClick = (activity) => {
    setSelectedactivity(activity);
    window.history.pushState(null, "", `/daily-tracker/activity/${activity._id}`);
  };

  const handleCloseactivity = () => {
    setSelectedactivity(null);
    window.history.pushState(null, "", `/daily-tracker`);
  };

  // Handle Add modal open/close
  const handleOpenAdd = () => {
    setShowAddModal(true);
    window.history.pushState(null, "", `/daily-tracker/add-daily-activity`);
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    window.history.pushState(null, "", `/daily-tracker`);
  };

  // Detect route on load or refresh
  useEffect(() => {
    const path = window.location.pathname;

    if (path.includes("/activity/")) {
      const activityId = path.split("/activity/")[1];
      const activity = data.find((t) => t._id === activityId);
      if (activity) setSelectedactivity(activity);
    } else if (path.endsWith("/add-daily-activity")) {
      setShowAddModal(true);
    }
  }, [data]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Loading activities...</p>
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
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      </div>
    </div>
  );

  // Unique clients
  const clients = [
    ...new Map(data.map((item) => [item.client?._id, item.client])).values(),
  ];

  // Filtered and grouped data
  const filteredData = selectedClient
    ? data.filter((d) => d.client?._id === selectedClient._id)
    : [];

  const groupedByProject = filteredData.reduce((acc, item) => {
    const key = item.projectType?.name || "Un categorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Daily Activity Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
          Track and manage your daily project activities
        </p>
      </div>

      <div className="flex gap-6 p-6">
        {/* LEFT SIDEBAR */}
        <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-3xl p-6 border border-white/20 h-fit">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Clients</h2>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {clients.map((client) => (
              <button
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                  selectedClient?._id === client._id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    selectedClient?._id === client._id ? 'bg-white' : 'bg-blue-500'
                  }`}></div>
                  <span className="font-medium">{client.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-3xl p-6 border border-white/20 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedClient ? `${selectedClient.name} - Activities` : "Select a Client"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedClient ? 'Manage project activities and track progress' : 'Choose a client to view their project activities'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Activity</span>
                </button>
              </div>
            </div>
          </div>

          {selectedClient ? (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-3xl p-6 border border-white/20">
              <KanbanBoard
                data={filteredData}
                groupBy="projectType.name"
                bgColors={bgColors}
                onCardClick={handleActivityClick}
                getCardContent={(activity) => (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {activity.user?.basicInfo?.firstName?.[0] || 'U'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.user?.basicInfo?.firstName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {activity.activityType?.name}
                    </h3>
                    
                    {activity.activity && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {activity.activity}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {activity.projectType?.name}
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-3xl p-12 border border-white/20 text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Client Selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a client from the sidebar to view and manage their project activities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating modals */}
      {selectedactivity && (
        <FloatingCard onClose={handleCloseactivity}>
          <Activity activity={selectedactivity} onClose={handleCloseactivity} />
        </FloatingCard>
      )}
      {showAddModal && (
        <FloatingCard onClose={handleCloseAdd}>
          <AddDailyEntry onClose={handleCloseAdd} />
        </FloatingCard>
      )}
    </div>
  );
};

export default DailyTracker;

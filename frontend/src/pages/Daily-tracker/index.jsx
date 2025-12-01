import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import AddDailyEntry from "./add-daily-activity.jsx";
import Activity from "./activity.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";
import { MdAdd, MdRefresh } from "react-icons/md";

const DailyTracker = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedactivity, setSelectedactivity] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientProjectTypes, setClientProjectTypes] = useState([]);

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
          const activitiesData = response.data.data || [];
          setData(activitiesData);
          setError(null);
          
          // Extract unique clients
          const uniqueClients = activitiesData
            .map(activity => activity.client)
            .filter(client => client && client.name)
            .reduce((acc, client) => {
              if (!acc.find(c => c._id === client._id)) {
                acc.push(client);
              }
              return acc;
            }, []);
          setClients(uniqueClients);
          
          // Auto-select first client if none selected
          if (uniqueClients.length > 0 && !selectedClient) {
            handleClientSelect(uniqueClients[0]);
          }
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

  // Select client and generate project type columns
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    const clientData = data.filter((d) => d.client?._id === client._id);
    const uniqueProjectTypes = [...new Set(clientData.map(activity => activity.projectType?.name).filter(Boolean))];
    const colors = ['bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-indigo-500', 'bg-yellow-600', 'bg-pink-500'];
    const dynamicColumns = uniqueProjectTypes.map((type, index) => ({
      id: type,
      title: type,
      color: colors[index % colors.length]
    }));
    setClientProjectTypes(dynamicColumns);
  };

  // Handle viewing an activity
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

  // Filtered data for selected client
  const filteredData = selectedClient
    ? data.filter((d) => d.client?._id === selectedClient._id)
    : [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Daily Activities</h1>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all duration-200"
          >
            <MdRefresh size={20} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <MdAdd size={20} />
            Add Activity
          </button>
        </div>
      </div>

      {/* Client Selection and Activity Listing */}
      <div className="flex gap-6 mb-6 h-[calc(100vh-12rem)]">
        {/* Client Selection */}
        <div className="w-80 min-w-80 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Clients</h3>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {clients.length}
            </span>
          </div>
          <div className="space-y-3">
            {clients.length > 0 ? clients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedClient?._id === client._id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100'
                }`}
              >
                <div className={`font-semibold ${
                  selectedClient?._id === client._id ? 'text-white' : 'text-gray-800'
                }`}>
                  {client.name || 'Unnamed Client'}
                </div>
                <div className={`text-sm mt-1 flex items-center gap-1 ${
                  selectedClient?._id === client._id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {data.filter(activity => activity.client?._id === client._id).length} activities
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="font-medium">No clients found</p>
                <p className="text-sm">Add activities to see clients here</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Activity Listing */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedClient ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></span>
                  {selectedClient.name} Activities
                </span>
              ) : 'Select a client to view activities'}
            </h3>
            {selectedClient && (
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {filteredData.length} total
              </span>
            )}
          </div>
          
          {selectedClient && clientProjectTypes.length > 0 ? (
            <div className="w-full h-full overflow-x-auto overflow-y-hidden pb-4">
              <div className="min-w-full">
                <KanbanBoard
                  data={filteredData}
                  groupBy="projectType.name"
                  columns={clientProjectTypes}
                  currentUserId={user?.id}
                  onCardClick={handleActivityClick}
                  onCardMove={(activity, fromStatus, toStatus) => {
                    console.log('Move activity:', activity.activityType?.name, 'from', fromStatus, 'to', toStatus);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p className="text-lg font-medium mb-2">
                {selectedClient ? 'No activities found' : 'Select a client'}
              </p>
              <p className="text-sm">
                {selectedClient ? 'This client has no activities yet' : 'Choose a client from the sidebar to view their activities'}
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
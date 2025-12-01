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
      <div className="flex gap-6 mb-6 h-screen">
        {/* Client Selection */}
        <div className="w-1/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Clients ({clients.length})</h3>
          <div className="space-y-2">
            {clients.length > 0 ? clients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedClient?._id === client._id 
                    ? 'bg-blue-100 border-l-4 border-blue-500 shadow-md' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="font-medium text-gray-800">{client.name || 'Unnamed Client'}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {data.filter(activity => activity.client?._id === client._id).length} activities
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                No clients found
              </div>
            )}
          </div>
        </div>
        
        {/* Activity Listing */}
        <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto" style={{maxWidth: 'calc(100% - 1rem)'}}>
          <h3 className="font-semibold mb-3">
            {selectedClient ? `${selectedClient.name} - Activities` : 'Select a client to view activities'}
          </h3>
          {selectedClient && clientProjectTypes.length > 0 ? (
            <div 
              className="rounded"
              style={{
                width: '800px',
                overflowX: 'auto',
                overflowY: 'hidden',
                overscrollBehavior: 'contain'
              }}
            >
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
          ) : (
            <div className="text-center text-gray-500 py-8">
              {selectedClient ? 'No activities found for this client' : 'Please select a client to view activities'}
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
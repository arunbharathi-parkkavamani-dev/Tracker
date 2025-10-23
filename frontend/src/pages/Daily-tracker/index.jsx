import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authProvider.jsx";
import FloatingCard from "../../components/FloatingCard.jsx";

const DailyTracker = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [bgColors, setBgColors] = useState({});
  const [selectedTask, setSelectedTask] = useState(null); // For modal

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch daily activities
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(
          `/populate/read/dailyactivities?user=${user.id}&fields=projectType,taskType,client,user`,
          { withCredentials: true }
        );
        setData(response.data?.data || []);
        console.log(response)
      } catch (err) {
        setError(err.message);
      }
    };
    fetchData();
  }, [refresh, user]);

  const handleRefresh = () => setRefresh((prev) => !prev);

  // Random pastel colors
  const getRandomColor = () => {
    const colors = [
      "#c3d7d9",
      "#8a999b",
      "#a6b7ba",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle client selection
  const handleClientSelect = (client) => {
    setSelectedClient(client);

    // Generate colors for project types
    const clientData = data.filter((d) => d.client?._id === client._id);
    const grouped = clientData.reduce((acc, item) => {
      const key = item.projectType?.name || "Un categorized";
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

  // Open task in modal and update URL
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    window.history.pushState(null, "", `/daily-tracker/task/${task._id}`);
  };

  // Close modal and reset URL
  const handleCloseTask = () => {
    setSelectedTask(null);
    window.history.pushState(null, "", `/daily-tracker`);
  };

  // Open modal from URL if page is loaded with task ID
  useEffect(() => {
    const taskId = window.location.pathname.split("/task/")[1];
    if (taskId) {
      const task = data.find((t) => t._id === taskId);
      if (task) setSelectedTask(task);
    }
  }, [data]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;

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
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-1/4 bg-white p-4 border-r border-gray-200 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Clients</h2>
        <div className="space-y-2">
          {clients.map((client) => (
            <button
              key={client._id}
              onClick={() => handleClientSelect(client)}
              className={`w-full text-left px-4 py-2 rounded-lg border ${
                selectedClient?._id === client._id
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {client.name}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT - KANBAN */}
      <div className="flex-1 p-6 overflow-x-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedClient
              ? `${selectedClient.name} - Project Overview`
              : "Select a Client"}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/daily-tracker/add-daily-activity")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              + Add
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {!selectedClient ? (
          <p className="text-gray-600 mt-6">Select a client to view activities.</p>
        ) : Object.keys(groupedByProject).length === 0 ? (
          <p className="text-gray-500 mt-6">No activities found for this client.</p>
        ) : (
          <div className="flex gap-6 h-[calc(100vh-6rem)] relative">
            {Object.keys(groupedByProject).map((projectType) => (
              <div
                key={projectType}
                className="relative w-80 flex-shrink-0 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: bgColors[projectType] || "#F3F4F6",
                  height: "100%",
                }}
              >
                {/* Project Type Header */}
                <div className="top-0 text-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {projectType}
                  </h2>
                </div>
                

                {/* Task cards */}
                <div className="absolute inset-3  overflow-y-auto p-4 z-20 space-y-3">
                  {groupedByProject[projectType].map((activity) => (
                    <div
                      key={activity._id}
                      onClick={() => handleTaskClick(activity)}
                      className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition cursor-pointer relative z-30"
                    >
                      <img className="float-right rounded-full" src={`${user?.basicInfo?.profileImage || "../../assets/profile_image.jpg"}`} />
                      <p className="font-medium text-gray-800">
                        {activity.taskType?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        User: {activity.user?.basicInfo?.firstName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating task modal */}
      <FloatingCard task={selectedTask} onClose={handleCloseTask} />
    </div>
  );
};

export default DailyTracker;

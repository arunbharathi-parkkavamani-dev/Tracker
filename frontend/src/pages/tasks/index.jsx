import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import Task from "./Task.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import AddTask from "./add-task.jsx";

const COLOR_PALETTE = [
  "#c3d7d9",
  "#8a999b",
  "#a6b7ba",
  "#aac7ff",
  "#a8e6cf",
  "#ffd3b6",
];

const STATUS_COLORS = {
  Backlogs: "#000000",
  "To Do": "#FFA500",
  "In Progress": "#FF8A8A",
  "In Review": "#3B82F6",
  Approved: "#6EE7B7",
  Rejected: "#B91C1C",
  Completed: "#166534",
};

const TasksPage = () => {
  const { user, loading } = useAuth();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [bgColors, setBgColors] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  /** Fetch tasks */
  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get(
        `/populate/read/tasks?fields=clientId,projectTypeId,taskTypeId,createdBy,assignedTo&filter=status != Deleted`,
        { withCredentials: true }
      );
      setData(response?.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch tasks");
    }
  };

  useEffect(() => {
    if (user?.id) fetchTasks();
  }, [user]);

  /** Color assignment */
  const assignColumnColors = (groupedTasks) => {
    const newColors = {};
    const keys = Object.keys(groupedTasks);
    keys.forEach((key, index) => {
      newColors[key] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    return newColors;
  };

  /** Client select */
  const handleClientSelect = (client) => {
    setSelectedClient(client);

    const tasksOfClient = data.filter(
      (t) => t.clientId?._id === client._id
    );

    const grouped = tasksOfClient.reduce((acc, task) => {
      const key = task.projectTypeId?.name || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});

    setBgColors(assignColumnColors(grouped));
  };

  const handleTaskMove = async (task, from, to) => {
    try {
      const targetProjectType = data.find(
        (t) => t.projectTypeId?.name === to
      )?.projectTypeId;

      if (!targetProjectType?._id) return;

      await axiosInstance.put(
        `/populate/update/tasks/${task._id}`,
        { projectTypeId: targetProjectType._id },
        { withCredentials: true }
      );

      fetchTasks();
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  /** Open Task details modal */
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    window.history.pushState(null, "", `/tasks/${task._id}`);
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
    window.history.pushState(null, "", `/tasks`);
    fetchTasks(); // refresh after edit
  };

  /** Add Task modal */
  const handleOpenAdd = () => {
    setShowAddModal(true);
    window.history.pushState(null, "", `/tasks/add-task`);
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    window.history.pushState(null, "", `/tasks`);
    fetchTasks();
  };

  /** Rendering */
  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;

  /** Extract unique clients */
  const clients = [
    ...new Map(data.map((item) => [item.clientId?._id, item.clientId])).values(),
  ];

  const filteredData = selectedClient
    ? data.filter((d) => d.clientId?._id === selectedClient._id)
    : [];

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

      {/* RIGHT SIDE */}
      <div className="flex-1 p-6 overflow-x-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedClient
              ? `${selectedClient.name} - Tasks`
              : "Select a Client"}
          </h1>

          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            + Add Task
          </button>
        </div>

        {selectedClient && (
          <KanbanBoard
            data={filteredData}
            groupBy="projectTypeId.name"
            bgColors={bgColors}
            onCardClick={handleTaskClick}
            onCardMove={handleTaskMove}
            getCardContent={(task) => (
              <>
                <p className="font-semibold text-gray-800">
                  {task.title}
                </p>
                <p className="text-sm text-gray-600">
                  {task.taskTypeId?.name || "—"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Priority: {task.priorityLevel}
                </p>
              </>
            )}
          />
        )}
      </div>

      {selectedTask && (
        <FloatingCard onClose={handleCloseTask}>
          <Task task={selectedTask} onClose={handleCloseTask} />
        </FloatingCard>
      )}

      {showAddModal && (
        <FloatingCard onClose={handleCloseAdd}>
          <AddTask onClose={handleCloseAdd} />
        </FloatingCard>
      )}
    </div>
  );
};

export default TasksPage;

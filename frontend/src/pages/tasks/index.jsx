import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import Task from "./Task.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import AddTask from "./add-task.jsx";

const COLOR_PALETTE = ["#c3d7d9", "#8a999b", "#a6b7ba", "#aac7ff", "#a8e6cf", "#ffd3b6"];

const TasksPage = () => {
  const { user, loading } = useAuth();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [bgColors, setBgColors] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  /** Fetch all tasks */
  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get(
        `/populate/read/tasks?fields=clientId,projectTypeId,taskTypeId,createdBy,assignedTo,commentsThread&filter=status != Deleted`
      );
      setData(res?.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch tasks");
    }
  };

  useEffect(() => {
    if (user?.id) fetchTasks();
  }, [user]);

  /** Load full task when opened (includes commentsThread content) */
  const fetchTaskDetails = async (taskId) => {
    const taskRes = await axiosInstance.get(
      `/populate/read/tasks/${taskId}?fields=clientId,projectTypeId,taskTypeId,createdBy,assignedTo,commentsThread`
    );
    const fullTask = taskRes.data.data;

    if (fullTask.commentsThread) {
      const commentsRes = await axiosInstance.get(
        `/populate/read/commentsthreads/${fullTask.commentsThread._id}?fields=comments.commentedBy,comments.message,comments.mentions,comments.createdAt`
      );
      fullTask.commentsThreadDetails = commentsRes.data.data;
    }
    return fullTask;
  };

  /** Client select */
  const handleClientSelect = (client) => {
    setSelectedClient(client);

    const grouped = data
      .filter((t) => t.clientId?._id === client._id)
      .reduce((acc, task) => {
        const key = task.projectTypeId?.name || "Uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {});

    const newColors = {};
    Object.keys(grouped).forEach((key, index) => {
      newColors[key] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });

    setBgColors(newColors);
  };

  /** Kanban drag */
  const handleTaskMove = async (task, from, to) => {
    try {
      const target = data.find((t) => t.projectTypeId?.name === to)?.projectTypeId;
      if (!target?._id) return;

      await axiosInstance.put(`/populate/update/tasks/${task._id}`, {
        projectTypeId: target._id,
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  /** Open Task modal (load full info + comments) */
  const handleTaskClick = async (task) => {
    const fullTask = await fetchTaskDetails(task._id);
    setSelectedTask(fullTask);
    window.history.pushState(null, "", `/tasks/${task._id}`);
  };

  /** Close modal */
  const handleCloseTask = async () => {
    setSelectedTask(null);
    window.history.pushState(null, "", `/tasks`);
    fetchTasks();
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

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;

  /** Unique clients list */
  const clients = [
    ...new Map(data.map((item) => [item.clientId?._id, item.clientId])).values(),
  ];

  const filteredData = selectedClient
    ? data.filter((d) => d.clientId?._id === selectedClient._id)
    : [];

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">

      {/* LEFT — Client List */}
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

      {/* RIGHT — Kanban + Add Button */}
      <div className="flex-1 p-6 overflow-x-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedClient ? `${selectedClient.name} - Tasks` : "Select a Client"}
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
                <p className="font-semibold text-gray-800">{task.title}</p>
                <p className="text-sm text-gray-600">{task.taskTypeId?.name || "—"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Priority: {task.priorityLevel}
                </p>
              </>
            )}
          />
        )}
      </div>

      {/* MODALS */}
      {selectedTask && (
        <FloatingCard onClose={handleCloseTask}>
          <Task task={selectedTask} fetchTask={() => fetchTaskDetails(selectedTask._id).then(setSelectedTask)} />
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

import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import Task from "./Task.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import Addtask from "./add-task.jsx";

const Task = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [bgColors, setBgColors] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const { user, loading } = useAuth();

    useEffect(() => {
        if (!user?.id) return;
        const fetchData = async () => {
            try {
                const filter = encodeURIComponent(
                    `clientName=${selectedClient} && status != Completed`
                )
                const response = await axiosInstance.get(
                    `/populate/read/tasks?filter=${filter}&fields=taskType, client, user`,
                    { withCredentials: true }
                );
                setData(response?.data?.data || []);
            } catch (err) {
                setError(err.message);
            }
        };
    }, [user]);

    const getRandomColor = () => {
        const colors = ["#c3d7d9", "#8a999b", "#a6b7ba"];
        return colors[Math.floor(Math.random() * colors.length)];
    };

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

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        window.history.pushState(null, "", `/tasks/${activity._id}`);
    };

    const handleCloseTask = () => {
        setSelectedTask(null);
        window.history.pushState(null, "", `/tasks`);
    };

    // Handle Add modal open/close
    const handleOpenAdd = () => {
        setShowAddModal(true);
        window.history.pushState(null, "", `/tasks/add-task`);
    };

    const handleCloseAdd = () => {
        setShowAddModal(false);
        window.history.pushState(null, "", `/tasks`);
    };

    if (loading) return <p className="p-4">Loading...</p>;
    if (error) return <p className="text-red-500 p-4">Error: {error}</p>;

    const clients = [
        ...new Map(data.map((item) => [item.client?._id, item.client])).values(),
    ];

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
                            className={`w-full text-left px-4 py-2 rounded-lg border ${selectedClient?._id === client._id
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
                            ? `${selectedClient.name} - On Going Tasks`
                            : "Select a Client"}
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleOpenAdd}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                        >
                            +
                        </button>
                    </div>
                </div>

                {selectedClient && (
                    <KanbanBoard
                        data={filteredData}
                        groupBy="projectType.name"
                        bgColors={bgColors}
                        onCardClick={handleActivityClick}
                        getCardContent={(tasks) => (
                            <>
                                <img
                                    className="float-right rounded-full w-8 h-8 object-cover"
                                    src={
                                        user?.basicInfo?.profileImage ||
                                        "../../assets/profile_image.jpg"
                                    }
                                />
                                <p className="font-medium text-gray-800">
                                    {tasks.activityType?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    User: {tasks.user?.basicInfo?.firstName}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(tasks.date).toLocaleDateString()}
                                </p>
                            </>
                        )}
                    />
                )}
            </div>

            {/* Floating modals */}
            {selectedTask && (
                <FloatingCard onClose={handleCloseTask}>
                    <Task activity={selectedTask} onClose={handleCloseTask} />
                </FloatingCard>
            )}
            {showAddModal && (
                <FloatingCard onClose={handleCloseAdd}>
                    <Addtask onClose={handleCloseAdd} />
                </FloatingCard>
            )}
        </div>
    )

}
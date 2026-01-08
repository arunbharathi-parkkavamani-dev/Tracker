import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/authProvider';
import KanbanBoard from '../../components/Common/KambanBoard';
import CreateTaskModal from './CreateTaskModal';
import TaskModal from './TaskModal';
import { User } from 'lucide-react';

const MyTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [kanbanView, setKanbanView] = useState('status');
    const [employees, setEmployees] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);

    useEffect(() => {
        fetchMyTasks();
        fetchEmployees();
        fetchTaskTypes();
    }, []);
    const fetchMyTasks = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/populate/read/tasks?filter={"$or":[{"createdBy":"${user.id}"},{"assignedTo":"${user.id}"}]}&fields=clientId,projectTypeId,taskTypeId,createdBy,assignedTo`);
            const tasksData = response.data.data || [];
            setTasks(tasksData);
        } catch (error) {
            console.error('Error fetching my tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axiosInstance.get('/populate/read/employees');
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };
    const fetchTaskTypes = async () => {
        try {
            const response = await axiosInstance.get('/populate/read/tasktypes');
            setTaskTypes(response.data.data || []);
        } catch (error) {
            console.error('Error fetching task types:', error);
        }
    };

    const handleTaskClick = async (task) => {
        try {
            const response = await axiosInstance.get(`/populate/read/tasks/${task._id}?fields=clientId,projectTypeId,taskTypeId,createdBy,assignedTo`);
            setSelectedTask(response.data.data);
        } catch (error) {
            console.error('Error fetching task details:', error);
        }
    };

    const handleTaskUpdate = () => {
        fetchMyTasks();
        setSelectedTask(null);
    };

    const statusColumns = [
        { id: 'Backlogs', title: 'Backlogs', color: 'bg-gray-500' },
        { id: 'To Do', title: 'To Do', color: 'bg-orange-500' },
        { id: 'In Progress', title: 'In Progress', color: 'bg-blue-500' },
        { id: 'In Review', title: 'In Review', color: 'bg-purple-500' },
        { id: 'Approved', title: 'Approved', color: 'bg-green-500' },
        { id: 'Completed', title: 'Completed', color: 'bg-green-700' }
    ];

    const priorityColumns = [
        { id: 'Low', title: 'Low Priority', color: 'bg-green-500' },
        { id: 'Medium', title: 'Medium Priority', color: 'bg-yellow-500' },
        { id: 'High', title: 'High Priority', color: 'bg-red-500' },
        { id: 'Weekly Priority', title: 'Weekly Priority', color: 'bg-purple-500' }
    ];

    const myCreatedTasks = tasks.filter(t => t.createdBy?._id === user.id).length;
    const myAssignedTasks = tasks.filter(t => t.assignedTo?.some(a => a._id === user.id)).length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;

    if (loading) return (
        <div className="flex items-center justify-center h-64>">
            <div className="text-lg">Loading tasks...</div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <User className="h-6 w-6" />
                            My Tasks
                        </h1>
                        <p className="text-gray-600 text-sm">Tasks created by you or assigned to you</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setKanbanView('status')}
                            className={`px-3 py-1 text-sm rounded ${kanbanView === 'status'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'

                                }`}
                        >
                            By Status
                        </button>
                        <button
                            onClick={() => setKanbanView('priority')}
                            className={`px-3 py-1 text-sm rounded ${kanbanView === 'priority'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'

                                }`}
                        >
                            By Priority
                        </button>
                    </div>
                </div>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 mt-6">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                        <div className="pb-2">
                            <h3 className="text-sm font-medium text-blue-600">Created by Me</h3>
                        </div>
                        <div className="text-2xl font-bold">{myCreatedTasks}</div>
                    </div>

                    <div className="bg-green-50/50 border border-green-100 rounded-lg p-4">
                        <div className="pb-2">
                            <h3 className="text-sm font-medium text-green-600">Assigned to Me</h3>
                        </div>
                        <div className="text-2xl font-bold">{myAssignedTasks}</div>
                    </div>

                    <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4">
                        <div className="pb-2">
                            <h3 className="text-sm font-medium text-orange-600">In Progress</h3>
                        </div>
                        <div className="text-2xl font-bold">{inProgressTasks}</div>
                    </div>
                </div>
            </div>
            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden">
                <KanbanBoard
                    data={tasks}
                    groupBy={kanbanView === 'status' ? 'status' : 'priorityLevel'}
                    columns={kanbanView === 'status' ? statusColumns : priorityColumns}
                    currentUserId={user?.id}
                    onCardClick={handleTaskClick}
                    onCardMove={(task, fromStatus, toStatus) => {
                        // console.log('Move task:', task.title, 'from', fromStatus, 'to', toStatus);
                    }}
                    title="My Tasks"
                    subtitle="Tasks created by you or assigned to you"
                    employees={employees}
                    taskTypes={taskTypes}
                    kanbanView={kanbanView}
                    onNewTask={() => setShowCreateModal(true)}
                />
            </div>
            {/* Modals */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}
            {showCreateModal && (
                <CreateTaskModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        fetchMyTasks();
                        setShowCreateModal(false);

                    }}
                />
            )}
        </div>);
};

export default MyTasks;
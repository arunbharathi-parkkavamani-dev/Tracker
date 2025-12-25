import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import TaskModal from "./TaskModal.jsx";
import CreateTaskModal from "./CreateTaskModal.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";
import { MdAdd, MdSearch, MdViewModule, MdViewList } from "react-icons/md";

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [kanbanView, setKanbanView] = useState('status');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjectTypes, setClientProjectTypes] = useState([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const populateFields = {
        'clientId': 'name',
        'projectTypeId': 'name',
        'taskTypeId': 'name',
        'createdBy': 'basicInfo.firstName,basicInfo.lastName',
        'assignedTo': 'basicInfo.firstName,basicInfo.lastName'
      };
      
      const response = await axiosInstance.get(
        `/populate/read/tasks?filter={"status":{"$ne":"Deleted"}}&populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      
      const tasksData = response.data.data || [];
      console.log('Tasks data:', tasksData); // Debug log
      setTasks(tasksData);
      setFilteredTasks(tasksData);
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/clients');
      const clientsData = response.data.data || [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchClients();
  }, []);

  useEffect(() => {
    let filtered = tasks;
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.userStory?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter]);

  const fetchTaskDetails = async (taskId) => {
    try {
      const populateFields = {
        'clientId': 'name',
        'projectTypeId': 'name',
        'taskTypeId': 'name',
        'createdBy': 'basicInfo.firstName,basicInfo.lastName',
        'assignedTo': 'basicInfo.firstName,basicInfo.lastName'
      };
      
      const response = await axiosInstance.get(
        `/populate/read/tasks/${taskId}?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching task details:', error);
      return null;
    }
  };

  const handleTaskClick = async (task) => {
    const fullTask = await fetchTaskDetails(task._id);
    if (fullTask) {
      setSelectedTask(fullTask);
    }
  };

  const handleTaskUpdate = () => {
    fetchTasks();
    setSelectedTask(null);
  };

  const handleClientSelect = async (client) => {
    setSelectedClient(client);
    try {
      const clientId = typeof client._id === 'object' ? client._id.toString() : client._id;
      const response = await axiosInstance.get(`/populate/read/clients/${clientId}?fields=projectTypes&populateFields={"projectTypes":"name"}`);
      const clientData = response.data.data;
      const colors = ['bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-indigo-500', 'bg-yellow-600', 'bg-pink-500'];
      const clientColumns = clientData.projectTypes?.map((projectType, index) => ({
        id: projectType.name,
        title: projectType.name,
        color: colors[index % colors.length]
      })) || [];
      setClientProjectTypes(clientColumns);
    } catch (error) {
      console.error('Error fetching client project types:', error);
      setClientProjectTypes([]);
    }
  };

  const statusColumns = [
    { id: 'Backlogs', title: 'Backlogs', color: 'bg-gray-500' },
    { id: 'To Do', title: 'To Do', color: 'bg-orange-500' },
    { id: 'In Progress', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'In Review', title: 'In Review', color: 'bg-purple-500' },
    { id: 'Approved', title: 'Approved', color: 'bg-green-500' },
    { id: 'Completed', title: 'Completed', color: 'bg-green-700' }
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Loading tasks...</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col dark:bg-black dark:text-white">
      
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
        
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            {viewMode === 'kanban' ? (
              <select
                value={kanbanView}
                onChange={(e) => setKanbanView(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="status">Group by Status</option>
                <option value="projectType">Group by Project Type</option>
              </select>
            ) : (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="All">All Status</option>
                <option value="Backlogs">Backlogs</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
              </select>
            )}
            
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 ${viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <MdViewModule size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <MdViewList size={20} />
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <MdAdd size={20} />
              Create Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        
        {/* Client Selection */}
        <div className="w-80 bg-white rounded-lg shadow p-4 overflow-y-auto dark:bg-gray-800">
          <h3 className="font-semibold mb-3">Clients ({clients.length})</h3>
          <div className="space-y-2">
            {clients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedClient?._id === client._id 
                    ? 'bg-blue-100 border-l-4 border-blue-500 shadow-md dark:bg-blue-900' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-gray-800 dark:text-white truncate">
                  {client.name || 'Unnamed Client'}
                </div>
                <div className="text-sm text-gray-500 mt-1 dark:text-gray-300">
                  {tasks.filter(task => task.clientId === client._id).length} tasks
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Task Board */}
        <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-hidden dark:bg-gray-800">
          <h3 className="font-semibold mb-3">
            {selectedClient ? `${selectedClient.name} - Tasks` : 'All Tasks'}
          </h3>
          
          <div className="h-full overflow-auto">
            <KanbanBoard
              data={selectedClient ? 
                tasks.filter(task => task.clientId === selectedClient._id) : 
                filteredTasks
              }
              groupBy={kanbanView === 'status' ? 'status' : 'projectTypeId'}
              columns={kanbanView === 'status' ? statusColumns : clientProjectTypes}
              currentUserId={user?.id}
              onCardClick={handleTaskClick}
              onCardMove={(task, fromStatus, toStatus) => {
                console.log('Move task:', task.title, 'from', fromStatus, 'to', toStatus);
              }}
            />
          </div>
        </div>
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
            fetchTasks();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TasksPage;
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import TaskModal from "./TaskModal.jsx";
import CreateTaskModal from "./CreateTaskModal.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";
import { MdAdd, MdSearch, MdFilterList, MdViewModule, MdViewList } from "react-icons/md";

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'grid'
  const [kanbanView, setKanbanView] = useState('status'); // 'status' or 'projectType'
  const [projectTypeColumns, setProjectTypeColumns] = useState([]);
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
      setTasks(tasksData);
      setFilteredTasks(tasksData);
      
      // Generate dynamic project type columns
      const uniqueProjectTypes = [...new Set(tasksData.map(task => task.projectTypeId?.name).filter(Boolean))];
      const colors = ['bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-indigo-500', 'bg-yellow-600', 'bg-pink-500'];
      const dynamicColumns = uniqueProjectTypes.map((type, index) => ({
        id: type,
        title: type,
        color: colors[index % colors.length]
      }));
      setProjectTypeColumns(dynamicColumns);
      
      // Extract unique clients
      const uniqueClients = tasksData
        .map(task => task.clientId)
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
        const firstClient = uniqueClients[0];
        setSelectedClient(firstClient);
        // Fetch first client's project types
        try {
          const clientId = typeof firstClient._id === 'object' ? firstClient._id.toString() : firstClient._id;
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
          console.error('Error fetching first client project types:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const taskIdFromUrl = path.split('/tasks/')[1];
      
      if (!taskIdFromUrl) {
        setSelectedTask(null);
      } else if (tasks.length > 0) {
        const task = tasks.find(t => t._id === taskIdFromUrl);
        if (task) {
          fetchTaskDetails(task._id).then(fullTask => {
            if (fullTask) setSelectedTask(fullTask);
          });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tasks]);

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
      if (!taskId || typeof taskId !== 'string') {
        console.error('Invalid task ID:', taskId);
        return null;
      }
      
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
      window.history.pushState(null, '', `/tasks/${task._id}`);
    }
  };

  const handleTaskUpdate = () => {
    fetchTasks();
    setSelectedTask(null);
    window.history.pushState(null, '', '/tasks');
  };

  // Handle URL-based task opening
  useEffect(() => {
    const path = window.location.pathname;
    const taskIdFromUrl = path.split('/tasks/')[1];
    
    if (taskIdFromUrl && tasks.length > 0 && !selectedTask) {
      const task = tasks.find(t => t._id === taskIdFromUrl);
      if (task) {
        handleTaskClick(task);
      }
    }
  }, [tasks, selectedTask]);

  const statusColors = {
    'Backlogs': 'bg-gray-500',
    'To Do': 'bg-orange-500', 
    'In Progress': 'bg-blue-500',
    'In Review': 'bg-purple-500',
    'Approved': 'bg-green-500',
    'Rejected': 'bg-red-500',
    'Completed': 'bg-green-700'
  };

  const priorityColors = {
    'Low': 'text-green-600',
    'Medium': 'text-yellow-600',
    'High': 'text-red-600',
    'Weekly Priority': 'text-purple-600'
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Loading tasks...</div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header with all controls in one line */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        
        <div className="relative flex-1 max-w-md">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {viewMode === 'kanban' ? (
          <select
            value={kanbanView}
            onChange={(e) => setKanbanView(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="status">Group by Status</option>
            <option value="projectType">Group by Project Type</option>
          </select>
        ) : (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className={`px-3 py-2 ${viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
          >
            <MdViewModule size={20} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
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

      {/* Client Selection and Task Listing */}
      <div className="flex gap-6 mb-6 h-screen">
        {/* Client Selection */}
        <div className="w-1/4 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Clients ({clients.length})</h3>
          <div className="space-y-2">
            {clients.length > 0 ? clients.map((client) => (
              <div
                key={client._id}
                onClick={async () => {
                  setSelectedClient(client);
                  // Fetch client's project types from API
                  try {
                    const clientId = typeof client._id === 'object' ? client._id.toString() : client._id;
                    if (!clientId) {
                      console.error('Invalid client ID:', client._id);
                      return;
                    }
                    
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
                }}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedClient?._id === client._id 
                    ? 'bg-blue-100 border-l-4 border-blue-500 shadow-md' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="font-medium text-gray-800">{client.name || 'Unnamed Client'}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {tasks.filter(task => task.clientId?._id === client._id).length} tasks
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                No clients found
              </div>
            )}
          </div>
        </div>
        
        {/* Task Listing */}
        <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto" style={{maxWidth: 'calc(100% - 1rem)'}}>
          <h3 className="font-semibold mb-3">
            {selectedClient ? `${selectedClient.name} - Tasks` : 'Select a client to view tasks'}
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
                data={tasks.filter(task => task.clientId?._id === selectedClient._id)}
                groupBy="projectTypeId.name"
                columns={clientProjectTypes}
                currentUserId={user?.id}
                onCardClick={handleTaskClick}
                onCardMove={(task, fromStatus, toStatus) => {
                  console.log('Move task:', task.title, 'from', fromStatus, 'to', toStatus);
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {selectedClient ? 'No project types found for this client' : 'Please select a client to view tasks'}
            </div>
          )}
        </div>
      </div>



      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            window.history.pushState(null, '', '/tasks');
          }}
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

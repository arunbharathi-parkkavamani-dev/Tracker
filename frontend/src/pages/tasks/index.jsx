import { use, useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import TaskModal from "./TaskModal.jsx";
import CreateTaskModal from "./CreateTaskModal.jsx";
import KanbanBoard from "../../components/Common/KambanBoard.jsx";

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [kanbanView, setKanbanView] = useState('status');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjectTypes, setClientProjectTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get(`/populate/read/tasks`);
        const tasksData = response.data.data || [];
        
        // Manually populate the required fields
        const populatedTasks = await Promise.all(tasksData.map(async (task) => {
          const populatedTask = { ...task };
          
          // Populate clientId
          if (task.clientId ) {
            try {
              const clientRes = await axiosInstance.get(`/populate/read/clients/${task.clientId}`);
              populatedTask.clientId = clientRes.data.data;
              // console.log('Populated clientId for task:', populatedTask.title, populatedTask.clientId);
            } catch (e) {
              console.warn('Failed to populate clientId:', e);
            }
          }
          
          // Populate projectTypeId
          if (task.projectTypeId ) {
            try {
              const projectTypeRes = await axiosInstance.get(`/populate/read/projecttypes/${task.projectTypeId}`);
              populatedTask.projectTypeId = projectTypeRes.data.data;
              // console.log('Populated projectTypeId for task:', populatedTask.title, populatedTask.projectTypeId);
            } catch (e) {
              console.warn('Failed to populate projectTypeId:', e);
            }
          }
          
          return populatedTask;
        }));
        console.log('Fetched and populated tasks:', populatedTasks);
        setTasks(populatedTasks);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/clients');
      const clientsData = response.data.data || [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/employees');
      const employeesData = response.data.data || [];
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTaskTypes = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/tasktypes');
      const taskTypesData = response.data.data || [];
      setTaskTypes(taskTypesData);
    } catch (error) {
      console.error('Error fetching task types:', error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchEmployees();
    fetchTaskTypes();
  }, []);

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
        id: projectType.name, // Use name as ID for matching
        title: projectType.name,
        color: colors[index % colors.length]
      })) || [];
      console.log('Client project types columns:', clientColumns);
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

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        
        {/* Client Selection */}
        <div className="w-80 bg-white rounded-lg shadow p-4 overflow-y-auto dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Clients ({clients.length})</h3>
            <div className="flex gap-1">
              <button 
                onClick={() => setKanbanView('status')}
                className={`px-2 py-1 text-xs rounded ${
                  kanbanView === 'status' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Status
              </button>
              <button 
                onClick={() => setKanbanView('category')}
                className={`px-2 py-1 text-xs rounded ${
                  kanbanView === 'category' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Category
              </button>
            </div>
          </div>
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
                  {tasks.filter(task => task.clientId._id === client._id).length} tasks
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Task Board */}
        <div className="flex-1 overflow-hidden">
          {selectedClient ? (
            <KanbanBoard
              data={tasks.filter(task => {
                const isClientTask = task.clientId._id === selectedClient._id;
                return isClientTask;
              })}
              groupBy={kanbanView === 'status' ? 'status' : 'projectTypeId'}
              columns={kanbanView === 'status' ? statusColumns : clientProjectTypes}
              currentUserId={user?.id}
              onCardClick={handleTaskClick}
              onCardMove={(task, fromStatus, toStatus) => {
                console.log('Move task:', task.title, 'from', fromStatus, 'to', toStatus);
              }}
              title={`Tasks - ${selectedClient.name}`}
              subtitle="Manage projects and track progress."
              employees={employees}
              taskTypes={taskTypes}
              kanbanView={kanbanView}
              onNewTask={() => setShowCreateModal(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-lg shadow dark:bg-gray-800">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Select a Client</h3>
                <p className="text-gray-500 dark:text-gray-400">Choose a client from the sidebar to view their tasks</p>
              </div>
            </div>
          )}
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
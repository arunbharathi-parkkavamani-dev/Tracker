import { useState, useEffect } from "react";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import { MdClose, MdAdd } from "react-icons/md";

const CreateTaskModal = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    userStory: '',
    observation: '',
    acceptanceCreteria: '',
    priorityLevel: 'Medium',
    status: 'Backlogs',
    assignedTo: [],
    tags: []
  });
  const [clients, setClients] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [clientsRes, projectTypesRes, taskTypesRes, employeesRes] = await Promise.all([
        axiosInstance.get('/populate/read/clients'),
        axiosInstance.get('/populate/read/projecttypes'),
        axiosInstance.get('/populate/read/tasktypes'),
        axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName,basicInfo.lastName')
      ]);
      
      setClients(clientsRes.data.data || []);
      setProjectTypes(projectTypesRes.data.data || []);
      setTaskTypes(taskTypesRes.data.data || []);
      setEmployees(employeesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create comments thread first
      const threadResponse = await axiosInstance.post('/populate/create/commentsthreads', {
        taskId: null, // Will be updated after task creation
        comments: []
      });

      const taskData = {
        ...formData,
        createdBy: user.id,
        commentsThread: threadResponse.data.data._id
      };

      const taskResponse = await axiosInstance.post('/populate/create/tasks', taskData);
      
      // Update comments thread with task ID
      await axiosInstance.put(`/populate/update/commentsthreads/${threadResponse.data.data._id}`, {
        taskId: taskResponse.data.data._id
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeChange = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(employeeId)
        ? prev.assignedTo.filter(id => id !== employeeId)
        : [...prev.assignedTo, employeeId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select
                required
                value={formData.clientId || ''}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Project Type *</label>
              <select
                required
                value={formData.projectTypeId || ''}
                onChange={(e) => setFormData({...formData, projectTypeId: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project Type</option>
                {projectTypes.map(type => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Task Type *</label>
              <select
                required
                value={formData.taskTypeId || ''}
                onChange={(e) => setFormData({...formData, taskTypeId: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Task Type</option>
                {taskTypes.map(type => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priorityLevel}
                onChange={(e) => setFormData({...formData, priorityLevel: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Weekly Priority">Weekly Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User Story</label>
            <textarea
              value={formData.userStory}
              onChange={(e) => setFormData({...formData, userStory: e.target.value})}
              className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500"
              placeholder="As a user, I want..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observation</label>
            <textarea
              value={formData.observation}
              onChange={(e) => setFormData({...formData, observation: e.target.value})}
              className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500"
              placeholder="Current state or observations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Acceptance Criteria</label>
            <textarea
              value={formData.acceptanceCreteria}
              onChange={(e) => setFormData({...formData, acceptanceCreteria: e.target.value})}
              className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500"
              placeholder="Define when this task is complete..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Assign To</label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {employees.map(employee => (
                <label key={employee._id} className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(employee._id)}
                    onChange={() => handleAssigneeChange(employee._id)}
                  />
                  <span className="text-sm">
                    {employee.basicInfo?.firstName} {employee.basicInfo?.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <MdAdd size={16} />
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
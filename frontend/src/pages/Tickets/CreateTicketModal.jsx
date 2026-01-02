import { useState, useEffect } from "react";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import { MdClose, MdAdd, MdAttachFile } from "react-icons/md";

const CreateTicketModal = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT Support',
    priority: 'Medium',
    department: '',
    projectTypeId: '',
    clientId: '',
    taskTypeId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchProjectTypes();
    fetchClients();
    fetchTaskTypes();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/projecttypes');
      setProjectTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching project types:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/populate/read/clients');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const ticketData = {
        ...formData,
        createdBy: user.id
      };

      await axiosInstance.post('/populate/create/tickets', ticketData);
      
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Ticket</h2>
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
              placeholder="Brief description of the issue"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded h-32 focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="IT Support">IT Support</option>
                <option value="HR Query">HR Query</option>
                <option value="Facility">Facility</option>
                <option value="Finance">Finance</option>
                <option value="Development">Development</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department (Optional)</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Type</label>
              <select
                value={formData.projectTypeId}
                onChange={(e) => setFormData({...formData, projectTypeId: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Project Type (Optional)</option>
                {projectTypes.map(type => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client (Optional)</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Task Type</label>
            <select
              value={formData.taskTypeId}
              onChange={(e) => setFormData({...formData, taskTypeId: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Task Type (Optional)</option>
              {taskTypes.map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </select>
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
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
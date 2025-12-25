import { useState, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import TaskModal from './TaskModal';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Plus, Filter, Calendar, Users, BarChart3 } from 'lucide-react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table or kanban
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRole();
    fetchTasks(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const checkUserRole = async () => {
    try {
      const response = await axiosInstance.get('/read/employees/me');
      const role = response.data.data?.professionalInfo?.role?.name;
      setUserRole(role);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchTasks = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/populate/read/tasks', {
        params: { type: 1, page, search }
      });
      setTasks(response.data.data || []);
      setTotalPages(Math.ceil(response.data.count / 10) || 1);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAuthorizedRole = ['hr', 'manager', 'super_admin'].includes(userRole);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    navigate(`/tasks/${task._id}`, { state: { openModal: true } });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Backlogs': 'bg-gray-100 text-gray-800',
      'To Do': 'bg-blue-50 text-blue-700',
      'In Progress': 'bg-yellow-50 text-yellow-700',
      'In Review': 'bg-purple-50 text-purple-700',
      'Approved': 'bg-green-50 text-green-700',
      'Rejected': 'bg-red-50 text-red-700',
      'Completed': 'bg-emerald-50 text-emerald-700',
      'Deleted': 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-gray-500',
      'Medium': 'text-blue-600',
      'High': 'text-orange-600',
      'Weekly Priority': 'text-red-600'
    };
    return colors[priority] || 'text-gray-500';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'Low': 'bg-gray-100 text-gray-700',
      'Medium': 'bg-blue-100 text-blue-700',
      'High': 'bg-orange-100 text-orange-700',
      'Weekly Priority': 'bg-red-100 text-red-700'
    };
    return badges[priority] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
              <p className="text-gray-600 mt-1">Manage and track your team's tasks efficiently</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAuthorizedRole && (
                <button 
                  onClick={() => navigate('/tasks/reports')}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </button>
              )}
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'In Progress').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'Completed').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'In Review').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search tasks by title, description, or assignee..."
                onSearch={handleSearch}
                suggestions={tasks.map(task => ({ id: task._id, title: task.title }))}
              />
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Table
                </button>
                <button 
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Kanban
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignees</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr
                        key={task._id}
                        onClick={() => handleTaskClick(task)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 mb-1">{task.title}</div>
                              <div className="text-sm text-gray-500 line-clamp-2">{task.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPriorityBadge(task.priorityLevel)}`}>
                            {task.priorityLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex -space-x-2">
                            {task.assignedTo?.slice(0, 3).map((user, index) => (
                              <img
                                key={index}
                                className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                src={user.basicInfo?.profileImage || '/default-avatar.png'}
                                alt={`${user.basicInfo?.firstName} ${user.basicInfo?.lastName}`}
                                title={`${user.basicInfo?.firstName} ${user.basicInfo?.lastName}`}
                              />
                            ))}
                            {task.assignedTo?.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                +{task.assignedTo.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {task.endDate ? new Date(task.endDate).toLocaleDateString() : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-gray-600 text-center py-8">Kanban view will be implemented here</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={() => {
              setSelectedTask(null);
              navigate('/tasks');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TaskList;
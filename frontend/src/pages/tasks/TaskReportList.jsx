import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TableGenerator from '../../components/Common/TableGenerator';
import axiosInstance from '../../api/axiosInstance';

const TaskReportList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  // Check user role and redirect if not authorized
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await axiosInstance.get('/read/employees/me');
        const role = response.data.data?.professionalInfo?.role?.name;
        
        if (!['manager', 'hr', 'super_admin'].includes(role)) {
          navigate('/dashboard');
          return;
        }
        
        setUserRole(role);
        fetchTasks();
      } catch (error) {
        console.error('Access check failed:', error);
        navigate('/login');
      }
    };

    checkAccess();
  }, [navigate]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/read/tasks', {
        params: { type: 2 } // Detailed view for reports
      });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskColumns = [
    {
      key: 'title',
      label: 'Task Title',
      render: (value) => (
        <div className="font-medium text-black dark:text-white">{value}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const colors = {
          'Backlogs': 'bg-gray-100 text-black dark:bg-gray-700 dark:text-gray-300',
          'To Do': 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
          'In Progress': 'bg-blue-100 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
          'In Review': 'bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100',
          'Approved': 'bg-blue-300 text-blue-900 dark:bg-blue-600 dark:text-blue-100',
          'Rejected': 'bg-gray-200 text-black dark:bg-gray-600 dark:text-gray-300',
          'Completed': 'bg-blue-400 text-white dark:bg-blue-500 dark:text-white',
          'Deleted': 'bg-gray-300 text-black dark:bg-gray-500 dark:text-gray-300'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${colors[value] || 'bg-gray-100 text-black dark:bg-gray-700 dark:text-gray-300'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'priorityLevel',
      label: 'Priority',
      render: (value) => {
        const colors = {
          'Low': 'text-gray-600 dark:text-gray-400',
          'Medium': 'text-blue-700 dark:text-blue-300',
          'High': 'text-blue-800 dark:text-blue-200',
          'Weekly Priority': 'text-blue-900 dark:text-blue-100'
        };
        return (
          <span className={`font-medium ${colors[value] || 'text-gray-600 dark:text-gray-400'}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'clientId',
      label: 'Client',
      render: (value) => value?.name || '-'
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (value) => {
        if (!value || value.length === 0) return '-';
        if (value.length === 1) {
          return `${value[0].basicInfo?.firstName} ${value[0].basicInfo?.lastName}`;
        }
        return `${value[0].basicInfo?.firstName} ${value[0].basicInfo?.lastName} +${value.length - 1} more`;
      }
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (value) => value ? `${value.basicInfo?.firstName} ${value.basicInfo?.lastName}` : '-'
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  const handleTaskClick = (task) => {
    navigate(`/tasks/${task._id}`, { state: { openModal: true } });
  };

    {loading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 dark:border-blue-400"></div>
      </div>
    ) : null}

    return (
      <div className="p-6 bg-white dark:bg-black min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">Task Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive task overview for {userRole === 'super_admin' ? 'Super Admin' : userRole.toUpperCase()}
          </p>
        </div>

      <TableGenerator
        data={tasks}
        columns={taskColumns}
        title={`Task Report - ${tasks.length} Tasks`}
        searchable={true}
        sortable={true}
        pagination={true}
        itemsPerPage={20}
        onRowClick={handleTaskClick}
        className="mt-4"
      />
    </div>
  );
};

export default TaskReportList;
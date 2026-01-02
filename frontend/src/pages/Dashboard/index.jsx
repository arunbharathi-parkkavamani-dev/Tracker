import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';
import { useLocation, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import ThemeToggler from "../../components/Common/ThemeToggler";
import { useAuth } from "../../context/authProvider";
import { useUserRole } from "../../hooks/useUserRole";
import TaskModal from "../tasks/TaskModal";
import TableGenerator from '../../components/Common/TableGenerator';


import StatCard from '../../components/Common/StatCard';
import EmployeeDashboard from "../../components/role/Employee/Dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');


  const [hrStats, setHrStats] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [managerStats, setManagerStats] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [recentTasks, setRecentTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);



  // Calculate dashboard statistics
  const stats = useMemo(() => {
    if (userRole === 'employee') {
      return [
        {
          title: "Today's Attendance",
          value: employeeStats?.attendanceStatus === 'check-in' ? 'Checked In' :
            employeeStats?.attendanceStatus === 'check-out' ? 'Checked Out' : 'Not Started',
          icon: Clock,
          color: 'blue',
          loading: loading
        },
        {
          title: 'Leave Balance',
          value: employeeStats?.leaveBalance || 0,
          icon: Calendar,
          color: 'yellow',
          subtitle: 'days remaining',
          loading: loading
        },
        {
          title: 'My Tasks',
          value: employeeStats?.myTasks || 0,
          icon: CheckCircle,
          color: 'green',
          subtitle: 'assigned to me',
          loading: loading
        }
      ];
    }

    if (userRole === 'manager') {
      return [
        {
          title: 'Team Members',
          value: managerStats?.teamMembers || 0,
          icon: Users,
          color: 'blue',
          loading: loading
        },
        {
          title: 'Present Today',
          value: managerStats?.presentToday || 0,
          icon: Clock,
          color: 'green',
          loading: loading
        },
        {
          title: 'Pending Tasks',
          value: managerStats?.pendingTasks || 0,
          icon: CheckCircle,
          color: 'yellow',
          loading: loading
        },
        {
          title: 'My Tasks',
          value: managerStats?.myTasks || 0,
          icon: Calendar,
          color: 'purple',
          loading: loading
        }
      ];
    }

    // Default stats for HR/SuperAdmin
    return [
      {
        title: 'Active Tasks',
        value: recentTasks?.length || 0,
        icon: CheckCircle,
        color: 'blue',
        trend: '+12%',
        loading: tasksLoading
      },
      {
        title: 'Present Today',
        value: recentAttendance?.filter(a => a.status === 'Present').length || 0,
        icon: Users,
        color: 'green',
        trend: '+5%',
        loading: attendanceLoading
      },
      {
        title: 'Pending Leaves',
        value: pendingLeaves?.length || 0,
        icon: Calendar,
        color: 'yellow',
        trend: '-2%',
        loading: leavesLoading
      },
      {
        title: 'System Health',
        value: 'Good',
        icon: TrendingUp,
        color: 'green',
        trend: '100ms avg',
        loading: false
      }
    ];
  }, [userRole, employeeStats, managerStats, recentTasks, recentAttendance, pendingLeaves, tasksLoading, attendanceLoading, leavesLoading, loading]);

  // Task table columns
  const taskColumns = [
    {
      key: 'title',
      label: 'Task',
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">#{item.taskId}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'priorityLevel',
      label: 'Priority',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'high' ? 'bg-red-100 text-red-800' :
          value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (value) => value ? `${value.basicInfo?.firstName} ${value.basicInfo?.lastName}` : 'Unassigned'
    },
    {
      key: 'endDate',
      label: 'Due Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ];

  // Handle task modal from direct URL access
  useEffect(() => {
    if (location.state?.showTaskModal && location.state?.taskId) {
      fetchTaskDetails(location.state.taskId);
    }
  }, [location.state]);

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

      setSelectedTask(response.data.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const handleTaskClose = () => {
    setSelectedTask(null);
    navigate('/dashboard', { replace: true });
  };

  const handleTaskUpdate = () => {
    setSelectedTask(null);
    navigate('/dashboard', { replace: true });
  };

  const fetchManagerStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [teamResponse, attendanceResponse, tasksResponse] = await Promise.all([
        axiosInstance.get('/populate/read/employees?filter=' + encodeURIComponent(JSON.stringify({
          'professionalInfo.reportingManager': user?.id
        }))),
        axiosInstance.get('/populate/read/attendances?filter=' + encodeURIComponent(JSON.stringify({
          date: {
            $gte: `${today}T00:00:00.000Z`,
            $lte: `${today}T23:59:59.999Z`
          }
        }))),
        axiosInstance.get('/populate/read/tasks')
      ]);

      const teamMembers = teamResponse.data?.data || [];
      const todayAttendance = attendanceResponse.data?.data || [];
      const allTasks = tasksResponse.data?.data || [];

      const teamMemberIds = teamMembers.map(member => member._id);
      const teamTasks = allTasks.filter(task =>
        task.assignedTo?.some(assignee => teamMemberIds.includes(assignee._id))
      );

      const myTasks = allTasks.filter(task =>
        task.assignedTo?.some(assignee => assignee._id === user?.id) ||
        task.createdBy?._id === user?.id
      );

      const pendingTasks = teamTasks.filter(task =>
        ['To Do', 'In Progress', 'In Review'].includes(task.status)
      );

      const presentToday = todayAttendance.filter(att =>
        att.status === 'Present' && teamMemberIds.includes(att.employee?._id)
      );

      setManagerStats({
        teamMembers: teamMembers.length,
        presentToday: presentToday.length,
        pendingTasks: pendingTasks.length,
        myTasks: myTasks.length
      });
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    }
  };

  const fetchEmployeeStats = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const filter = JSON.stringify({
      employee: user.id,
      date: {
        $gte: startOfDay.toISOString(),
        $lte: endOfDay.toISOString()
      }
    });

    try {
      const userId = user?.id;
      const [attendanceRes, leavesRes, tasksRes] = await Promise.all([
        axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`),
        axiosInstance.get(`/populate/read/leaves?filter={"employeeId":"${userId}"}`),
        axiosInstance.get(`/populate/read/tasks?filter={"assignedTo":"${userId}"}`),
      ]);
      console.log("Employee Stats - Attendance Response:", attendanceRes.data);
      console.log("Employee Stats - Leaves Response:", leavesRes.data);
      console.log("Employee Stats - Tasks Response:", tasksRes.data);

      const todayAttendance = attendanceRes.data?.data?.[0] || null;
      const leaves = leavesRes.data?.data || [];
      const tasks = tasksRes.data?.data || [];

      const attendanceStatus =
        todayAttendance?.checkIn && !todayAttendance?.checkOut
          ? "check-in"
          : todayAttendance?.checkOut
            ? "check-out"
            : "not-started";

      setEmployeeStats({
        attendanceStatus,
        leaveBalance: 2,
        pendingLeaves: leaves.filter(l => l.status === "Pending").length,
        myTasks: tasks.filter(t => t.status !== "Completed").length,
        completedTasks: tasks.filter(t => t.status === "Completed").length,
        monthlyAttendance: 22,
      });

    } catch (error) {
      console.error("Error fetching employee stats:", error);
    }
  };

  const fetchStats = async () => {
    if (!userRole) return;

    try {
      switch (userRole) {
        case "employee":
          await fetchEmployeeStats();
          break;
        case "manager":
          await fetchManagerStats();
          break;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userRole && !roleLoading) {
      fetchStats();
    }
  }, [userRole, roleLoading]);

  const handleRefreshAll = () => {
    refreshTasks();
    refreshAttendance();
    refreshLeaves();
  };

  const renderRoleBasedDashboard = () => {
    switch (userRole) {
      case "employee":
        return <EmployeeDashboard stats={employeeStats} />;

      case "manager":
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  trend={stat.trend}
                  loading={stat.loading}
                />
              ))}
            </div>

            {/* Enhanced Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <TableGenerator
                  model="tasks"
                  title="Recent Tasks"
                  columns={taskColumns}
                  searchable={true}
                  sortable={true}
                  pagination={false}
                  className="h-96"
                  autoRefresh={true}
                  refreshInterval={30000}
                  exportable={true}
                />
              </div>
            </div>
          </div>
        );

      case "hr":
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  trend={stat.trend}
                  loading={stat.loading}
                />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <TableGenerator
                  model="tasks"
                  title="Recent Tasks"
                  columns={taskColumns}
                  searchable={true}
                  sortable={true}
                  pagination={false}
                  className="h-96"
                  autoRefresh={true}
                  refreshInterval={30000}
                  exportable={true}
                />
              </div>

              <div>
                <TableGenerator
                  model="attendances"
                  title="Recent Attendance"
                  searchable={true}
                  sortable={true}
                  pagination={false}
                  className="h-80"
                  autoRefresh={true}
                  refreshInterval={60000}
                />
              </div>

              <div>
                <TableGenerator
                  model="leaves"
                  title="Pending Leave Requests"
                  searchable={false}
                  sortable={true}
                  pagination={false}
                  className="h-80"
                  autoRefresh={true}
                  refreshInterval={60000}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex justify-center items-center py-10">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Role not recognized</p>
          </div>
        );
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-black">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 dark:border-gray-600 border-t-blue-800 dark:border-t-blue-600 rounded-full"></div>
        <p className="mt-3 text-gray-600 dark:text-gray-400">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-400">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Here's what's happening in your organization today.</p>
        </div>
        <div>
          <div className="flex gap-2">
            <Link to="/tasks/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors">
                + New Task
              </button>
            </Link>
            <button className="bg-white dark:bg-black border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">
              Clock In
            </button>
          </div>
        </div>
      </div>


      <div className="px-2">
        {renderRoleBasedDashboard()}
      </div>

      {/* Performance Metrics (Development Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg API Response:</span>
              <span className="ml-2 font-medium text-black dark:text-white">100ms</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Error Rate:</span>
              <span className="ml-2 font-medium text-black dark:text-white">0%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
              <span className="ml-2 font-medium text-black dark:text-white">50MB</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Requests:</span>
              <span className="ml-2 font-medium text-black dark:text-white">0</span>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal for direct URL access */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleTaskClose}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}

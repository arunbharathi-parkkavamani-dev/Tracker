import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { useLocation, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import { useUserRole } from "../../hooks/useUserRole";
import TaskModal from "../tasks/TaskModal";
import TableGenerator from '../../components/Common/TableGenerator';
import StatCard from '../../components/Common/StatCard';
import EmployeeDashboard from "../../components/role/Employee/Dashboard";
import { MODULES, APP_SHELL } from "../../constants/uiTokens";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

  const greeting = getGreeting();

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    if (userRole === 'developer') {
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
          <div className="font-medium text-ink">{value}</div>
          <div className="text-sm text-ink-muted">#{item.taskId}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
          value === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
          value === 'in-progress' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400' :
            'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'priorityLevel',
      label: 'Priority',
      render: (value) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          value === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
          value === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
            'bg-surface-2 text-ink-muted'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            value === 'high' ? 'bg-rose-500' :
            value === 'medium' ? 'bg-amber-500' :
              'bg-ink-subtle'
            }`} />
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

      const response = await axiosInstance.post(
        `/populate/read/tasks/${taskId}`,
        { populateFields }
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
        axiosInstance.post('/populate/read/employees', {
          filter: { 'professionalInfo.reportingManager': user?.id }
        }),
        axiosInstance.post('/populate/read/attendances', {
          filter: {
            date: {
              $gte: `${today}T00:00:00.000Z`,
              $lte: `${today}T23:59:59.999Z`
            }
          }
        }),
        axiosInstance.post('/populate/read/tasks')
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
        axiosInstance.post(`/populate/read/attendances`, { filter: JSON.parse(filter) }),
        axiosInstance.post(`/populate/read/leaves`, { filter: { employeeId: userId } }),
        axiosInstance.post(`/populate/read/tasks`, { filter: { assignedTo: userId } }),
      ]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, index) => (
                <div key={index} className="animate-fade-in" >
                  <StatCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    trend={stat.trend}
                    loading={stat.loading}
                  />
                </div>
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

      case "developer":
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, index) => (
                <div key={index} className="animate-fade-in">
                  <StatCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    trend={stat.trend}
                    loading={stat.loading}
                  />
                </div>
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
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, index) => (
                <div key={index} className="animate-fade-in">
                  <StatCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    trend={stat.trend}
                    loading={stat.loading}
                  />
                </div>
              ))}
            </div>

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
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] bg-canvas">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-surface-2" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-[var(--module-accent)] animate-spin" />
        </div>
        <p className="mt-4 text-ink-muted font-medium text-base">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-module={MODULES.project.id}>

      {/* Welcome banner */}
      <section className="lmx-section-card !border-l-[var(--module-project)] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" aria-hidden>{greeting.emoji}</span>
              <p className="lmx-page-eyebrow !text-[var(--module-project)] mb-0">
                {greeting.text}
              </p>
            </div>
            <h1 className={`${APP_SHELL.pageTitle} !text-3xl lg:!text-[40px]`}>
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className={`${APP_SHELL.pageSubtitle} flex items-center gap-2`}>
              <Calendar className="h-4 w-4" />
              {getFormattedDate()}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/tasks">
              <button type="button" className="tracker-btn-secondary inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manage Tasks
              </button>
            </Link>
            <Link to="/Attendance/Daily-tracker">
              <button type="button" className="tracker-btn-brand inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Clock In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {renderRoleBasedDashboard()}

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

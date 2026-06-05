import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import axiosInstance from '@/api/axiosInstance';
import StatCard from '@/components/StatCard';
import {
  Clock,
  Calendar,
  CheckCircle,
  Users,
  TrendingUp,
  AlertCircle,
  Plus,
  Briefcase,
  Inbox,
  ChevronRight,
  ClipboardList
} from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const { user, userRole } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats State
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [managerStats, setManagerStats] = useState<any>(null);

  // Lists State
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  const greeting = getGreeting();

  const fetchStats = async () => {
    try {
      if (!userRole) return;

      const today = new Date().toISOString().split('T')[0];

      if (userRole === 'employee') {
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

        const [attendanceRes, leavesRes, tasksRes] = await Promise.all([
          axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`),
          axiosInstance.get(`/populate/read/leaves?filter={"employeeId":"${user.id}"}`),
          axiosInstance.get(`/populate/read/tasks?filter={"assignedTo":"${user.id}"}`),
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
          pendingLeaves: leaves.filter((l: any) => l.status === "Pending").length,
          myTasks: tasks.filter((t: any) => t.status !== "Completed").length,
        });

        setRecentTasks(tasks.slice(0, 5));

      } else if (userRole === 'manager') {
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

        const teamMemberIds = teamMembers.map((member: any) => member._id);
        const teamTasks = allTasks.filter((task: any) =>
          task.assignedTo?.some((assignee: any) => teamMemberIds.includes(assignee._id))
        );

        const myTasks = allTasks.filter((task: any) =>
          task.assignedTo?.some((assignee: any) => assignee._id === user?.id) ||
          task.createdBy?._id === user?.id
        );

        const pendingTasks = teamTasks.filter((task: any) =>
          ['To Do', 'In Progress', 'In Review'].includes(task.status)
        );

        const presentToday = todayAttendance.filter((att: any) =>
          att.status === 'Present' && teamMemberIds.includes(att.employee?._id)
        );

        setManagerStats({
          teamMembers: teamMembers.length,
          presentToday: presentToday.length,
          pendingTasks: pendingTasks.length,
          myTasks: myTasks.length
        });

        setRecentTasks(myTasks.slice(0, 5));

      } else {
        // HR / Admin
        const [tasksRes, attRes, leavesRes] = await Promise.all([
          axiosInstance.get('/populate/read/tasks?limit=10&sort=-createdAt'),
          axiosInstance.get('/populate/read/attendances?limit=10&sort=-createdAt'),
          axiosInstance.get('/populate/read/leaves?filter={"status":"Pending"}'),
        ]);

        setRecentTasks(tasksRes.data?.data || []);
        setRecentAttendance(attRes.data?.data || []);
        setPendingLeaves(leavesRes.data?.data || []);
      }

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userRole]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  interface DashboardStat {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
    loading?: boolean;
  }

  const stats: DashboardStat[] = useMemo(() => {
    if (userRole === 'employee') {
      const attendanceColor = employeeStats?.attendanceStatus === 'check-in' ? 'green' :
        employeeStats?.attendanceStatus === 'check-out' ? 'yellow' : 'red';
      return [
        {
          title: "Attendance",
          value: employeeStats?.attendanceStatus === 'check-in' ? 'Checked In' :
            employeeStats?.attendanceStatus === 'check-out' ? 'Checked Out' : 'Not Started',
          icon: Clock,
          color: attendanceColor,
        },
        {
          title: 'Leave Balance',
          value: employeeStats?.leaveBalance || 0,
          icon: Calendar,
          color: 'yellow',
        },
        {
          title: 'My Tasks',
          value: employeeStats?.myTasks || 0,
          icon: CheckCircle,
          color: 'blue',
        },
        {
          title: 'Pending Leaves',
          value: employeeStats?.pendingLeaves || 0,
          icon: AlertCircle,
          color: 'purple',
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
        },
        {
          title: 'Present Today',
          value: managerStats?.presentToday || 0,
          icon: Clock,
          color: 'green',
        },
        {
          title: 'Pending Tasks',
          value: managerStats?.pendingTasks || 0,
          icon: CheckCircle,
          color: 'yellow',
        },
        {
          title: 'My Tasks',
          value: managerStats?.myTasks || 0,
          icon: Briefcase,
          color: 'purple',
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
      },
      {
        title: 'Present Today',
        value: recentAttendance?.filter((a: any) => a.status === 'Present').length || 0,
        icon: Users,
        color: 'green',
        trend: '+5%',
      },
      {
        title: 'Pending Leaves',
        value: pendingLeaves?.length || 0,
        icon: Calendar,
        color: 'yellow',
        trend: '-2%',
      },
      {
        title: 'System Health',
        value: 'Good',
        icon: TrendingUp,
        color: 'green',
      }
    ];
  }, [userRole, employeeStats, managerStats, recentTasks, recentAttendance, pendingLeaves]);

  const getPriorityColor = (priority: string = 'medium') => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getPriorityBadgeClasses = (priority: string = 'medium') => {
    switch (priority?.toLowerCase()) {
      case 'high': return { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-600 dark:text-rose-400' };
      case 'medium': return { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400' };
      case 'low': return { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400' };
      default: return { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400' };
    }
  };

  const getStatusBadgeClasses = (status: string = 'todo') => {
    const val = status?.toLowerCase();
    if (val === 'completed') return { bg: 'bg-green-100 dark:bg-emerald-950/40', text: 'text-green-700 dark:text-emerald-400' };
    if (val === 'in progress' || val === 'in-progress') return { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400' };
    return { bg: 'bg-gray-155/80 dark:bg-zinc-800', text: 'text-gray-700 dark:text-gray-400' };
  };

  const renderRecentTaskItem = (item: any) => {
    const pClasses = getPriorityBadgeClasses(item.priorityLevel);
    const sClasses = getStatusBadgeClasses(item.status);
    const sideColor = getPriorityColor(item.priorityLevel);

    return (
      <TouchableOpacity 
        key={item._id} 
        className="bg-white dark:bg-zinc-900 p-4 rounded-2xl mb-3 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center justify-between"
        style={{ borderLeftWidth: 4, borderLeftColor: sideColor }}
        onPress={() => router.push({ pathname: "/tasks", params: { taskId: item._id } })}
      >
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
            <Text className="font-semibold text-gray-900 dark:text-white text-sm" numberOfLines={1}>
              {item.title}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${pClasses.bg}`}>
              <Text className={`text-[9px] font-bold uppercase tracking-wider ${pClasses.text}`}>
                {item.priorityLevel || 'medium'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Calendar size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              Due: {new Date(item.endDate || item.dueDate || item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className={`px-2.5 py-1 rounded-full ${sClasses.bg}`}>
            <Text className={`text-xs font-semibold ${sClasses.text}`}>
              {item.status}
            </Text>
          </View>
          <ChevronRight size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Welcome Card */}
        <LinearGradient
          colors={['#0f172a', '#1e3a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6 mb-6 overflow-hidden relative shadow-lg"
        >
          {/* Subtle decoration overlay blobs */}
          <View className="absolute -right-8 -top-8 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl" />
          <View className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

          <View className="flex-row justify-between items-center z-10">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center mb-1.5 gap-1.5">
                <Text className="text-xl">{greeting.emoji}</Text>
                <Text className="text-blue-300 text-[10px] font-bold tracking-wider uppercase">
                  {greeting.text}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-white tracking-tight">
                Hello, {user?.name?.split(' ')[0] || 'User'}
              </Text>
              <Text className="text-blue-200/80 text-xs mt-1 font-medium">
                {getFormattedDate()}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-white/10 p-3.5 rounded-2xl border border-white/10 active:bg-white/20"
              onPress={() => router.push('/tasks/add-task')}
            >
              <Plus color="white" size={22} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions Row */}
        <View className="flex-row justify-between mb-6 px-1.5">
          <TouchableOpacity className="items-center" onPress={() => router.push('/daily-tracker')}>
            <View className="w-12 h-12 bg-blue-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-1.5 shadow-sm border border-blue-100/30 dark:border-zinc-800">
              <Clock size={18} color="#3b82f6" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center">Daily Tracker</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="items-center" onPress={() => router.push('/attendance/leave-and-regularization')}>
            <View className="w-12 h-12 bg-amber-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-1.5 shadow-sm border border-amber-100/30 dark:border-zinc-800">
              <Calendar size={18} color="#f59e0b" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center">Leaves & Reg</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center" onPress={() => router.push('/tasks')}>
            <View className="w-12 h-12 bg-emerald-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-1.5 shadow-sm border border-emerald-100/30 dark:border-zinc-800">
              <CheckCircle size={18} color="#10b981" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center">My Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center" onPress={() => router.push('/tasks/add-task')}>
            <View className="w-12 h-12 bg-purple-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-1.5 shadow-sm border border-purple-100/30 dark:border-zinc-800">
              <Plus size={18} color="#8b5cf6" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center">New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between -mx-1 mb-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend as string}
              loading={loading}
            />
          ))}
        </View>

        {/* Recent Activity Section */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-4 px-1">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {userRole === 'hr' ? 'Recent Actions' : 'Recent Tasks'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <View className="flex-row items-center gap-0.5">
                <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">See All</Text>
                <ChevronRight size={14} color="#2563eb" />
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <Clock size={24} color="#9ca3af" className="animate-spin" />
              <Text className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm">Loading activity...</Text>
            </View>
          ) : (
            recentTasks.length > 0 ? (
              recentTasks.map(renderRecentTaskItem)
            ) : (
              <View className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 items-center justify-center">
                <Inbox size={28} color="#9ca3af" />
                <Text className="text-gray-400 dark:text-gray-500 mt-2 text-sm">No recent tasks found</Text>
              </View>
            )
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

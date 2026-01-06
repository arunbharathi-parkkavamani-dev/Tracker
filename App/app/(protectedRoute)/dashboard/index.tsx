import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
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
  Briefcase
} from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const { user, userRole } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats State
  const [hrStats, setHrStats] = useState<any>(null);
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [managerStats, setManagerStats] = useState<any>(null);

  // Lists State
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

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
          leaveBalance: 2, // Mock or fetch if available
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
    loading?: boolean; // Ensure loading is also handled if used
  }

  const stats: DashboardStat[] = useMemo(() => {
    if (userRole === 'employee') {
      return [
        {
          title: "Today's Status",
          value: employeeStats?.attendanceStatus === 'check-in' ? 'Checked In' :
            employeeStats?.attendanceStatus === 'check-out' ? 'Checked Out' : 'Not Started',
          icon: Clock,
          color: 'blue',
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
          color: 'green',
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

  const renderRecentTaskItem = (item: any) => (
    <TouchableOpacity key={item._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 border border-gray-100 dark:border-gray-700 shadow-sm"
      onPress={() => router.push({ pathname: "/tasks", params: { taskId: item._id } })}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.title}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Due: {new Date(item.endDate).toLocaleDateString()}</Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${item.status === 'Completed' ? 'bg-green-100' :
          item.status === 'In Progress' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
          <Text className={`text-xs font-medium ${item.status === 'Completed' ? 'text-green-700' :
            item.status === 'In Progress' ? 'text-blue-700' : 'text-gray-700'
            }`}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black" edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Section */}
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Hello, {user?.name?.split(' ')[0] || 'User'}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              Have a productive day!
            </Text>
          </View>
          {/* Quick Action */}
          <TouchableOpacity
            className="bg-blue-600 p-3 rounded-full shadow-md"
            onPress={() => router.push('/tasks/add-task')}
          >
            <Plus color="white" size={24} />
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
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {userRole === 'hr' ? 'Recent Actions' : 'Recent Tasks'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <Text className="text-blue-600 font-medium text-sm">See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text className="text-center text-gray-500 py-4">Loading activity...</Text>
          ) : (
            recentTasks.length > 0 ? (
              recentTasks.map(renderRecentTaskItem)
            ) : (
              <View className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-dashed border-gray-300 items-center">
                <Text className="text-gray-400">No recent tasks found</Text>
              </View>
            )
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

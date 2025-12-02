import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { ActivityIndicator } from "react-native";
import { useState, useEffect, useContext } from "react";
import axiosInstance from "@/api/axiosInstance";
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from "@/context/AuthContext";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  activeTasks: number;
  completedTasks: number;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [employeesRes, leavesRes, tasksRes] = await Promise.all([
        axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName'),
        axiosInstance.get('/populate/read/leaves?filter={"status":"Pending"}'),
        axiosInstance.get('/populate/read/tasks?filter={"status":"Active"}')
      ]);

      const totalEmployees = employeesRes.data?.data?.length || 0;
      const pendingLeaves = leavesRes.data?.data?.length || 0;
      const activeTasks = tasksRes.data?.data?.length || 0;

      setStats({
        totalEmployees,
        presentToday: Math.floor(totalEmployees * 0.85), // Mock data
        onLeave: Math.floor(totalEmployees * 0.1),
        pendingLeaves,
        activeTasks,
        completedTasks: Math.floor(activeTasks * 1.5) // Mock data
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#667eea" />
        <Text className="mt-3 text-base text-gray-600">Loading Dashboard...</Text>
      </View>
    );
  }

  const getIconText = (iconName: string) => {
    switch (iconName) {
      case 'People': return '👥';
      case 'CheckCircle': return '✅';
      case 'EventBusy': return '📅';
      case 'Pending': return '⏳';
      case 'Assignment': return '📋';
      case 'TaskAlt': return '✔️';
      default: return 'ℹ️';
    }
  };

  const StatCard = ({ title, value, icon, colors }: { title: string; value: number; icon: string; colors: string[] }) => (
    <View className="w-[48%] mb-4 rounded-2xl overflow-hidden shadow-lg">
      <LinearGradient colors={colors} className="p-5">
        <View className="items-center">
          <Text className="text-3xl mb-2">{getIconText(icon)}</Text>
          <Text className="text-3xl font-bold text-white mb-1">{value}</Text>
          <Text className="text-sm text-white/90 font-medium">{title}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 flex-row flex-wrap justify-between mt-5">
          <StatCard
            title="Employees"
            value={stats?.totalEmployees || 0}
            icon="People"
            colors={['#667eea', '#764ba2']}
          />
          <StatCard
            title="Present"
            value={stats?.presentToday || 0}
            icon="CheckCircle"
            colors={['#f093fb', '#f5576c']}
          />
          <StatCard
            title="On Leave"
            value={stats?.onLeave || 0}
            icon="EventBusy"
            colors={['#4facfe', '#00f2fe']}
          />
          <StatCard
            title="Pending"
            value={stats?.pendingLeaves || 0}
            icon="Pending"
            colors={['#43e97b', '#38f9d7']}
          />
        </View>

        <View className="px-5">
          <Text className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity className="w-[48%] bg-white p-5 rounded-2xl items-center mb-3 shadow-sm">
              <Text className="text-3xl mb-2">⏰</Text>
              <Text className="text-sm font-medium text-gray-700">Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-white p-5 rounded-2xl items-center mb-3 shadow-sm">
              <Text className="text-3xl mb-2">📝</Text>
              <Text className="text-sm font-medium text-gray-700">Leave Request</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-white p-5 rounded-2xl items-center mb-3 shadow-sm">
              <Text className="text-3xl mb-2">✅</Text>
              <Text className="text-sm font-medium text-gray-700">Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-[48%] bg-white p-5 rounded-2xl items-center mb-3 shadow-sm">
              <Text className="text-3xl mb-2">📊</Text>
              <Text className="text-sm font-medium text-gray-700">Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}



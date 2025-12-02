import { View, Text, ScrollView, RefreshControl } from "react-native";
import { ActivityIndicator } from "react-native";
import { useState, useEffect, useContext } from "react";
import axiosInstance from "@/api/axiosInstance";
import { AuthContext } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import EmployeeDashboard from "@/components/roles/employee/EmployeeDashboard";
import HRDashboard from "@/components/roles/hr/HRDashboard";
import ManagerDashboard from "@/components/roles/manager/ManagerDashboard";
import SuperAdminDashboard from "@/components/roles/superadmin/SuperAdminDashboard";

interface HRDashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  activeTasks: number;
  completedTasks: number;
}

interface EmployeeDashboardStats {
  attendanceStatus: 'checked-in' | 'checked-out' | 'not-started';
  leaveBalance: number;
  pendingLeaves: number;
  myTasks: number;
  completedTasks: number;
  monthlyAttendance: number;
}

interface ManagerDashboardStats {
  teamMembers: number;
  pendingApprovals: number;
  teamTasks: number;
  completedTasks: number;
}

interface SuperAdminDashboardStats {
  totalUsers: number;
  systemHealth: string;
  activeRoles: number;
  systemAlerts: number;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { userRole, loading: roleLoading } = useUserRole();
  const [hrStats, setHrStats] = useState<HRDashboardStats | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeDashboardStats | null>(null);
  const [managerStats, setManagerStats] = useState<ManagerDashboardStats | null>(null);
  const [superAdminStats, setSuperAdminStats] = useState<SuperAdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHRStats = async () => {
    try {
      const [employeesRes, leavesRes, tasksRes] = await Promise.all([
        axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName'),
        axiosInstance.get('/populate/read/leaves?filter={"status":"Pending"}'),
        axiosInstance.get('/populate/read/tasks?filter={"status":"Active"}')
      ]);

      const totalEmployees = employeesRes.data?.data?.length || 0;
      const pendingLeaves = leavesRes.data?.data?.length || 0;
      const activeTasks = tasksRes.data?.data?.length || 0;

      setHrStats({
        totalEmployees,
        presentToday: Math.floor(totalEmployees * 0.85),
        onLeave: Math.floor(totalEmployees * 0.1),
        pendingLeaves,
        activeTasks,
        completedTasks: Math.floor(activeTasks * 1.5)
      });
    } catch (error) {
      console.error('Error fetching HR stats:', error);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const userId = user?._id;
      const [attendanceRes, leavesRes, tasksRes] = await Promise.all([
        axiosInstance.get(`/populate/read/attendances?filter={"employeeId":"${userId}"}&sort={"date":-1}&limit=1`),
        axiosInstance.get(`/populate/read/leaves?filter={"employeeId":"${userId}"}`),
        axiosInstance.get(`/populate/read/tasks?filter={"assignedTo":"${userId}"}`)
      ]);

      const todayAttendance = attendanceRes.data?.data?.[0];
      const leaves = leavesRes.data?.data || [];
      const tasks = tasksRes.data?.data || [];
      
      const attendanceStatus = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime 
        ? 'checked-in' 
        : todayAttendance?.checkOutTime 
        ? 'checked-out' 
        : 'not-started';

      setEmployeeStats({
        attendanceStatus,
        leaveBalance: 24, // Mock - should come from employee profile
        pendingLeaves: leaves.filter(l => l.status === 'Pending').length,
        myTasks: tasks.filter(t => t.status !== 'Completed').length,
        completedTasks: tasks.filter(t => t.status === 'Completed').length,
        monthlyAttendance: 22 // Mock - calculate from current month attendance
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchManagerStats = async () => {
    try {
      // Mock data for manager - replace with actual API calls
      setManagerStats({
        teamMembers: 8,
        pendingApprovals: 3,
        teamTasks: 15,
        completedTasks: 12
      });
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    }
  };

  const fetchSuperAdminStats = async () => {
    try {
      // Mock data for super admin - replace with actual API calls
      setSuperAdminStats({
        totalUsers: 150,
        systemHealth: 'Good',
        activeRoles: 4,
        systemAlerts: 2
      });
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
    }
  };

  const fetchStats = async () => {
    if (!userRole) return;
    
    try {
      switch (userRole) {
        case 'employee':
          await fetchEmployeeStats();
          break;
        case 'hr':
          await fetchHRStats();
          break;
        case 'manager':
          await fetchManagerStats();
          break;
        case 'superadmin':
          await fetchSuperAdminStats();
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading || roleLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#667eea" />
        <Text className="mt-3 text-base text-gray-600">Loading Dashboard...</Text>
      </View>
    );
  }

  const renderRoleBasedDashboard = () => {
    switch (userRole) {
      case 'employee':
        return <EmployeeDashboard stats={employeeStats} />;
      case 'hr':
        return <HRDashboard stats={hrStats} />;
      case 'manager':
        return <ManagerDashboard stats={managerStats} />;
      case 'superadmin':
        return <SuperAdminDashboard stats={superAdminStats} />;
      default:
        return (
          <View className="flex-1 justify-center items-center">
            <Text className="text-lg text-gray-600">Role not recognized</Text>
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderRoleBasedDashboard()}
      </ScrollView>
    </View>
  );
}



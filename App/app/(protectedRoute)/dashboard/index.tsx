import { View, Text, ScrollView, RefreshControl } from "react-native";
import { ActivityIndicator } from "react-native";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useOptimizedDataFetching } from "@/hooks/useOptimizedDataFetching";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
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
  attendanceStatus: 'check-in' | 'check-out' | 'not-started';
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

  const { getPerformanceSummary, startMonitoring } = usePerformanceMonitor();

  // Optimized data fetching for different sections
  const {
    data: recentTasks,
    loading: tasksLoading,
    handleRefresh: refreshTasks
  } = useOptimizedDataFetching('tasks', {
    initialLimit: 5,
    initialFilters: { status: { $ne: 'completed' } },
    initialSort: { createdAt: -1 },
    enableCache: true,
    backgroundRefresh: true
  });

  const {
    data: recentAttendance,
    loading: attendanceLoading,
    handleRefresh: refreshAttendance
  } = useOptimizedDataFetching('attendances', {
    initialLimit: 10,
    initialFilters: { 
      date: { 
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      } 
    },
    initialSort: { date: -1 },
    enableCache: true,
    backgroundRefresh: true
  });

  const {
    data: pendingLeaves,
    loading: leavesLoading,
    handleRefresh: refreshLeaves
  } = useOptimizedDataFetching('leaves', {
    initialLimit: 5,
    initialFilters: { status: 'pending' },
    initialSort: { createdAt: -1 },
    enableCache: true,
    backgroundRefresh: true
  });

  // Start performance monitoring
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  const fetchEmployeeStats = async () => {
    try {
      if (!user) return;

      const now = new Date();
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;

      const startIST = new Date(now);
      startIST.setHours(0, 0, 0, 0);

      const endIST = new Date(now);
      endIST.setHours(23, 59, 59, 999);

      const startUTC = new Date(startIST.getTime() - IST_OFFSET);
      const endUTC = new Date(endIST.getTime() - IST_OFFSET);

      const filter = {
        employee: user.id,
        date: {
          $gte: startUTC.toISOString(),
          $lte: endUTC.toISOString(),
        },
      };

      const userId = user?._id;
      const todayIST = new Date(now);
      const todayDateString = todayIST.toISOString().split("T")[0];

      const todayRecord = recentAttendance.find((r) => {
        if (!r.date) return false;
        const date = new Date(r.date);
        return date.toISOString().split("T")[0] === todayDateString;
      });

      const attendanceStatus =
        todayRecord?.checkIn && !todayRecord?.checkOut
          ? "check-in"
          : todayRecord?.checkOut
          ? "check-out"
          : "not-started";

      setEmployeeStats({
        attendanceStatus,
        leaveBalance: 2,
        pendingLeaves: pendingLeaves.filter((l) => l.status === "Pending").length,
        myTasks: recentTasks.filter((t) => t.status !== "Completed").length,
        completedTasks: recentTasks.filter((t) => t.status === "Completed").length,
        monthlyAttendance: 22,
      });

    } catch (error) {
      console.error("Error fetching employee stats:", error);
    }
  };

  const fetchHRStats = async () => {
    try {
      const totalEmployees = 50; // Use optimized data or API call
      const pendingLeavesCount = pendingLeaves?.length || 0;
      const activeTasksCount = recentTasks?.length || 0;

      setHrStats({
        totalEmployees,
        presentToday: Math.floor(totalEmployees * 0.85),
        onLeave: Math.floor(totalEmployees * 0.1),
        pendingLeaves: pendingLeavesCount,
        activeTasks: activeTasksCount,
        completedTasks: Math.floor(activeTasksCount * 1.5)
      });
    } catch (error) {
      console.error('Error fetching HR stats:', error);
    }
  };

  const fetchManagerStats = async () => {
    try {
      setManagerStats({
        teamMembers: 8,
        pendingApprovals: 3,
        teamTasks: recentTasks?.length || 0,
        completedTasks: 12
      });
    } catch (error) {
      console.error('Error fetching manager stats:', error);
    }
  };

  const fetchSuperAdminStats = async () => {
    try {
      const performanceStats = getPerformanceSummary();
      setSuperAdminStats({
        totalUsers: 150,
        systemHealth: performanceStats.isHealthy ? 'Good' : 'Issues',
        activeRoles: 4,
        systemAlerts: performanceStats.errorCount
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
  }, [userRole, roleLoading, recentTasks, recentAttendance, pendingLeaves]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshTasks();
    refreshAttendance();
    refreshLeaves();
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



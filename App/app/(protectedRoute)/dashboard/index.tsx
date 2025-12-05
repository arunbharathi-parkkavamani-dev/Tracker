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
    if (!user) return;

    const now = new Date();

    // ----------------------------
    // 1️⃣ Build IST Start / End of Today
    // ----------------------------
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30

    const startIST = new Date(now);
    startIST.setHours(0, 0, 0, 0); // 00:00 IST

    const endIST = new Date(now);
    endIST.setHours(23, 59, 59, 999); // 23:59 IST

    // ----------------------------
    // 2️⃣ Convert IST → UTC for MongoDB filters
    // ----------------------------
    const startUTC = new Date(startIST.getTime() - IST_OFFSET);
    const endUTC = new Date(endIST.getTime() - IST_OFFSET);

    const filter = {
      employee: user.id,
      date: {
        $gte: startUTC.toISOString(),
        $lte: endUTC.toISOString(),
      },
    };

    console.log("IST Start:", startIST.toString());
    console.log("IST End:", endIST.toString());
    console.log("UTC Start:", startUTC.toISOString());
    console.log("UTC End:", endUTC.toISOString());


    // ----------------------------
    // 3️⃣ API Call
    // ----------------------------
    const userId = user?._id;

    const [attendanceRes, leavesRes, tasksRes] = await Promise.all([
      axiosInstance.get(
        `/populate/read/attendances?filter=${encodeURIComponent(
          JSON.stringify(filter)
        )}`
      ),
      axiosInstance.get(`/populate/read/leaves?filter={"employeeId":"${userId}"}`),
      axiosInstance.get(`/populate/read/tasks?filter={"assignedTo":"${userId}"}`),
    ]);

    const records = attendanceRes?.data?.data || [];

    // ----------------------------
    // 4️⃣ Filter again in frontend (safety check)
    // ----------------------------
    const todayIST = new Date(now);
    const todayDateString = todayIST.toISOString().split("T")[0]; // YYYY-MM-DD (IST converted)

    const todayRecord = records.find((r) => {
      if (!r.date) return false;
      const date = new Date(r.date);
      return date.toISOString().split("T")[0] === todayDateString;
    });

    console.log("TODAY RECORD:", todayRecord);

    // ----------------------------
    // 5️⃣ Attendance Status Logic
    // ----------------------------
    const attendanceStatus =
      todayRecord?.checkIn && !todayRecord?.checkOut
        ? "check-in"
        : todayRecord?.checkOut
        ? "check-out"
        : "not-started";

    const leaves = leavesRes.data?.data || [];
    const tasks = tasksRes.data?.data || [];

    // ----------------------------
    // 6️⃣ Update Dashboard State
    // ----------------------------
    setEmployeeStats({
      attendanceStatus,
      leaveBalance: 2, // mock
      pendingLeaves: leaves.filter((l) => l.status === "Pending").length,
      myTasks: tasks.filter((t) => t.status !== "Completed").length,
      completedTasks: tasks.filter((t) => t.status === "Completed").length,
      monthlyAttendance: 22, // mock
    });

  } catch (error) {
    console.error("Error fetching employee stats:", error);
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



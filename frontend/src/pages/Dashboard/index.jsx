import { useState, useEffect, useContext } from "react";
import axiosInstance from "../../api/axiosInstance";
import ThemeToggler from "../../components/Common/ThemeToggler";
import { useAuth } from "../../context/authProvider";
import { useUserRole } from "../../hooks/useUserRole";

// Your existing components (keep same paths)
import EmployeeDashboard from "../../components/role/Employee/Dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();

  const [hrStats, setHrStats] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // -------------------------
  // 🚀 Fetch HR Stats
  // -------------------------
  // const fetchHRStats = async () => {
  //   try {
  //     const [employeesRes, leavesRes, tasksRes] = await Promise.all([
  //       axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName'),
  //       axiosInstance.get('/populate/read/leaves?filter={"status":"Pending"}'),
  //       axiosInstance.get('/populate/read/tasks?filter={"status":"Active"}')
  //     ]);

  //     const totalEmployees = employeesRes.data?.data?.length || 0;
  //     const pendingLeaves = leavesRes.data?.data?.length || 0;
  //     const activeTasks = tasksRes.data?.data?.length || 0;

  //     setHrStats({
  //       totalEmployees,
  //       presentToday: Math.floor(totalEmployees * 0.85),
  //       onLeave: Math.floor(totalEmployees * 0.1),
  //       pendingLeaves,
  //       activeTasks,
  //       completedTasks: Math.floor(activeTasks * 1.5)
  //     });
  //   } catch (error) {
  //     console.error('Error fetching HR stats:', error);
  //   }
  // };

  // -------------------------
  // 🚀 Fetch Employee Stats
  // -------------------------
  const fetchEmployeeStats = async () => {
    console.log("Fetching")
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
      const userId = user?._id;
      const [attendanceRes, leavesRes, tasksRes] = await Promise.all([
        axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`),
        axiosInstance.get(`/populate/read/leaves?filter={"employeeId":"${userId}"}`),
        axiosInstance.get(`/populate/read/tasks?filter={"assignedTo":"${userId}"}`),
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
        leaveBalance: 2, // Replace with real value later
        pendingLeaves: leaves.filter(l => l.status === "Pending").length,
        myTasks: tasks.filter(t => t.status !== "Completed").length,
        completedTasks: tasks.filter(t => t.status === "Completed").length,
        monthlyAttendance: 22,
      });

    } catch (error) {
      console.error("Error fetching employee stats:", error);
    }
  };
  // -------------------------
  // 🚀 Fetch SuperAdmin Stats
  // -------------------------
  // const fetchSuperAdminStats = async () => {
  //   try {
  //     setSuperAdminStats({
  //       totalUsers: 150,
  //       systemHealth: "Good",
  //       activeRoles: 4,
  //       systemAlerts: 2,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching superadmin stats:", error);
  //   }
  // };

  // -------------------------
  // 🚀 Master Fetch
  // -------------------------
  const fetchStats = async () => {
    if (!userRole) return;

    try {
      switch (userRole) {
        case "employee":
          await fetchEmployeeStats();
          break;

        // case "hr":
        //   await fetchHRStats();
        //   break;

        // case "manager":
        //   // You said **don't import manager**, so manager UI & fetch removed.
        //   setManagerStats(null);
        //   break;

        // case "superadmin":
        //   await fetchSuperAdminStats();
        //   break;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -------------------------
  // 🚀 Initial fetch when role loads
  // -------------------------
  useEffect(() => {
    if (userRole && !roleLoading) {
      fetchStats();
    }
  }, [userRole, roleLoading]);

  // -------------------------
  // 🚀 Role-based UI
  // -------------------------
  const renderRoleBasedDashboard = () => {
    switch (userRole) {
      case "employee":
        return <EmployeeDashboard stats={employeeStats} />;

      // case "hr":
      //   return <HRDashboard stats={hrStats} />;

      // case "superadmin":
      //   return <SuperAdminDashboard stats={superAdminStats} />;

      default:
        return (
          <div className="flex justify-center items-center py-10">
            <p className="text-gray-600 text-lg">Role not recognized</p>
          </div>
        );
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
        <p className="mt-3 text-gray-600">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-black dark:text-white bg-gray-50 p-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Here's what's happening in your organization today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggler />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="px-2">
        {renderRoleBasedDashboard()}
      </div>
    </div>
  );
}

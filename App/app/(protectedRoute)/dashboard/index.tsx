import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '@/context/AuthContext';
import axiosInstance from '@/api/axiosInstance';
import {
  Clock, Calendar, CheckSquare, FileText, LogIn, LogOut,
  User, Users, UserCheck, Ban, Shield, Settings,
  BarChart3, Inbox, ChevronRight, ArrowRight, AlertCircle, CheckCircle
} from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Completed':   { bg: '#D1FAE5', text: '#065F46' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF' },
  'Pending':     { bg: '#FEF3C7', text: '#92400E' },
  'Open':        { bg: '#EDE9FE', text: '#7C3AED' },
  'default':     { bg: '#F1F5F9', text: '#475569' },
};

const getQuickActions = (role: string) => {
  switch (role) {
    case 'superadmin':
      return [
        { title: 'User Management', icon: Users, bg: '#EDE9FE', color: '#7C3AED', route: '/(protectedRoute)/user-management' as any },
        { title: 'Role Management', icon: Shield, bg: '#FEF3C7', color: '#F59E0B', route: '/(protectedRoute)/role-management' as any },
        { title: 'System Settings', icon: Settings, bg: '#DBEAFE', color: '#3B82F6', route: '/(protectedRoute)/system-settings' as any },
        { title: 'Analytics', icon: BarChart3, bg: '#D1FAE5', color: '#10B981', route: '/(protectedRoute)/analytics' as any },
      ];
    case 'manager':
      return [
        { title: 'Team Overview', icon: Users, bg: '#EDE9FE', color: '#7C3AED', route: '/(protectedRoute)/team' as any },
        { title: 'Approve Leaves', icon: Calendar, bg: '#FEF3C7', color: '#F59E0B', route: '/(protectedRoute)/approvals' as any },
        { title: 'Assign Tasks', icon: CheckSquare, bg: '#DBEAFE', color: '#3B82F6', route: '/(protectedRoute)/task-management' as any },
        { title: 'Team Reports', icon: BarChart3, bg: '#D1FAE5', color: '#10B981', route: '/(protectedRoute)/team-reports' as any },
      ];
    case 'hr':
    case 'admin':
      return [
        { title: 'Attendance', icon: Clock, bg: '#EDE9FE', color: '#7C3AED', route: '/(protectedRoute)/attendance' as any },
        { title: 'Leave Requests', icon: Calendar, bg: '#FEF3C7', color: '#F59E0B', route: '/(protectedRoute)/attendance' as any },
        { title: 'Tasks', icon: FileText, bg: '#DBEAFE', color: '#3B82F6', route: '/(protectedRoute)/tasks' as any },
        { title: 'Profile', icon: Users, bg: '#D1FAE5', color: '#10B981', route: '/(protectedRoute)/me' as any },
      ];
    default: // employee
      return [
        { title: 'Attendance', icon: Clock, bg: '#EDE9FE', color: '#7C3AED', route: '/(protectedRoute)/attendance' as any },
        { title: 'Leave', icon: Calendar, bg: '#FEF3C7', color: '#F59E0B', route: '/(protectedRoute)/attendance/leave-and-regularization' as any },
        { title: 'Tasks', icon: CheckSquare, bg: '#DBEAFE', color: '#3B82F6', route: '/(protectedRoute)/tasks' as any },
        { title: 'Profile', icon: User, bg: '#D1FAE5', color: '#10B981', route: '/(protectedRoute)/me' as any },
      ];
  }
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [managerStats, setManagerStats] = useState<any>(null);
  const [hrStats, setHrStats] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  const [enabledWidgets, setEnabledWidgets] = useState<Set<string>>(new Set());
  const [widgetsLoading, setWidgetsLoading] = useState(true);

  const greeting = getGreeting();
  const scrollY = useRef(new Animated.Value(0)).current;

  const can = (widgetId: string) => enabledWidgets.has(widgetId);

  const fetchUserRoleAndWidgets = useCallback(async () => {
    if (!user?.role) return;
    try {
      setWidgetsLoading(true);
      const res = await axiosInstance.get(`populate/read/roles/${user.role}`);
      const roleDoc = res?.data?.data;
      const name = roleDoc?.name ? roleDoc.name.toLowerCase() : 'employee';
      setUserRole(name);

      const widgetsRes = await axiosInstance.post('/populate/read/dashboardwidgets', {
        filter: { role: user.role },
        limit: 1
      });
      const widgetDoc = widgetsRes.data?.data?.[0];
      
      let activeWidgets = new Set<string>();
      if (widgetDoc) {
        activeWidgets = new Set<string>(widgetDoc.widgets || []);
      } else {
        // Fallback widgets if no database config exists yet
        if (name === 'superadmin' || name === 'admin') {
          activeWidgets = new Set(['stat_total_employees', 'stat_present_today', 'stat_on_leave', 'stat_pending_leaves', 'quick_actions', 'pending_leaves_list']);
        } else if (name === 'manager') {
          activeWidgets = new Set(['stat_total_employees', 'stat_pending_leaves', 'quick_actions', 'pending_leaves_list']);
        } else if (name === 'hr') {
          activeWidgets = new Set(['stat_total_employees', 'stat_present_today', 'stat_on_leave', 'stat_pending_leaves', 'quick_actions', 'pending_leaves_list']);
        } else {
          activeWidgets = new Set(['stat_attendance_status', 'stat_leave_balance', 'stat_my_tasks', 'quick_actions']);
        }
      }
      setEnabledWidgets(activeWidgets);
    } catch (error) {
      console.error('Error fetching role or widgets:', error);
      setUserRole('employee');
      setEnabledWidgets(new Set(['stat_attendance_status', 'stat_leave_balance', 'stat_my_tasks', 'quick_actions']));
    } finally {
      setWidgetsLoading(false);
    }
  }, [user?.role]);

  const fetchStats = useCallback(async () => {
    if (!userRole || enabledWidgets.size === 0) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const needsEmployeeAttendance =
        enabledWidgets.has('stat_attendance_status') ||
        enabledWidgets.has('stat_my_tasks') ||
        enabledWidgets.has('stat_leave_balance');

      const needsOrgStats =
        enabledWidgets.has('stat_total_employees') ||
        enabledWidgets.has('stat_present_today') ||
        enabledWidgets.has('stat_on_leave');

      const needsPendingLeaves =
        enabledWidgets.has('stat_pending_leaves') ||
        enabledWidgets.has('pending_leaves_list');

      const requests: Promise<any>[] = [];

      if (needsEmployeeAttendance) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const filter = JSON.stringify({
          employee: user?.id,
          date: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
        });
        requests.push(axiosInstance.get(`/populate/read/attendances?filter=${encodeURIComponent(filter)}`));
      } else {
        requests.push(Promise.resolve(null));
      }

      if (enabledWidgets.has('stat_leave_balance')) {
        requests.push(axiosInstance.get(`/populate/read/leaves?filter=${JSON.stringify({ employeeId: user?.id })}`));
      } else {
        requests.push(Promise.resolve(null));
      }

      if (enabledWidgets.has('stat_my_tasks') || enabledWidgets.has('recent_tasks_table') || enabledWidgets.has('priority_tasks')) {
        requests.push(axiosInstance.get(`/populate/read/tasks?filter=${JSON.stringify({ assignedTo: user?.id })}`));
      } else {
        requests.push(Promise.resolve(null));
      }

      if (needsOrgStats) {
        requests.push(axiosInstance.get('/populate/read/employees'));
      } else {
        requests.push(Promise.resolve(null));
      }

      if (needsOrgStats) {
        requests.push(axiosInstance.get('/populate/read/attendances?filter=' + encodeURIComponent(JSON.stringify({
          date: { $gte: `${today}T00:00:00.000Z`, $lte: `${today}T23:59:59.999Z` }
        }))));
      } else {
        requests.push(Promise.resolve(null));
      }

      if (needsPendingLeaves) {
        requests.push(axiosInstance.get('/populate/read/leaves?filter=' + encodeURIComponent(JSON.stringify({ status: 'Pending' }))));
      } else {
        requests.push(Promise.resolve(null));
      }

      const [attRes, leavesRes, tasksRes, empRes, orgAttRes, pendingLeavesRes] = await Promise.all(requests);

      const todayAttendance = attRes?.data?.data?.[0] || null;
      const attStatus = todayAttendance?.checkIn && !todayAttendance?.checkOut ? 'check-in'
        : todayAttendance?.checkOut ? 'check-out' : 'not-started';

      const tasks = tasksRes?.data?.data || [];
      const openTasksCount = tasks.filter((t: any) => t.status !== 'Completed').length;
      const completedTasksCount = tasks.filter((t: any) => t.status === 'Completed').length;

      const employees = empRes?.data?.data || [];
      const orgAtt = orgAttRes?.data?.data || [];
      const presentToday = orgAtt.filter((a: any) => a.status === 'Present').length;
      const onLeaveCount = employees.length - presentToday;

      const leaves = pendingLeavesRes?.data?.data || [];

      setEmployeeStats({
        attendanceStatus: attStatus,
        leaveBalance: 2,
        pendingLeaves: leaves.filter((l: any) => (l.employeeId?._id || l.employeeId) === user?.id && l.status === 'Pending').length,
        myTasks: openTasksCount,
        completedTasks: completedTasksCount,
        monthlyAttendance: 22,
        dailyActivity: 3,
      });

      setHrStats({
        totalEmployees: employees.length,
        presentToday: presentToday,
        onLeave: onLeaveCount >= 0 ? onLeaveCount : 0,
        pendingLeaves: leaves.length
      });

      setManagerStats({
        teamMembers: employees.length,
        pendingApprovals: leaves.length,
        teamTasks: tasks.length,
        completedTasks: completedTasksCount,
      });

      setPendingLeaves(leaves);
      setRecentTasks(tasks.slice(0, 3));
    } catch (error) {
      console.error('Dashboard fetch stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole, enabledWidgets, user?.id]);

  useEffect(() => {
    fetchUserRoleAndWidgets();
  }, [fetchUserRoleAndWidgets]);

  useEffect(() => {
    if (userRole && enabledWidgets.size > 0) {
      fetchStats();
    }
  }, [userRole, enabledWidgets, fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserRoleAndWidgets();
  };

  const renderAttendanceBanner = () => {
    if (!can('stat_attendance_status') || !employeeStats) return null;
    const status = employeeStats.attendanceStatus || 'not-started';
    
    let bannerConfig = {
      label: 'Not Checked In',
      sublabel: 'Tap to check in',
      icon: LogIn,
      gradient: ['#F59E0B', '#D97706'] as [string, string],
    };
    if (status === 'check-in') {
      bannerConfig = {
        label: 'Checked In',
        sublabel: 'Tap to check out',
        icon: LogOut,
        gradient: ['#10B981', '#059669'] as [string, string],
      };
    } else if (status === 'check-out') {
      bannerConfig = {
        label: 'Day Complete',
        sublabel: 'See attendance log',
        icon: CheckSquare,
        gradient: ['#7C3AED', '#6D28D9'] as [string, string],
      };
    }

    const BannerIcon = bannerConfig.icon;

    return (
      <TouchableOpacity
        onPress={() => router.push('/(protectedRoute)/attendance' as any)}
        activeOpacity={0.85}
        className="px-5 mb-5"
      >
        <LinearGradient
          colors={[...bannerConfig.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-xl px-4 py-3.5 flex-row items-center justify-between overflow-hidden shadow-sm"
        >
          <View className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View className="flex-row items-center gap-3 flex-1">
             <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
               <BannerIcon size={18} color="white" />
             </View>
             <View>
               <Text className="text-white font-semibold text-[14px]">{bannerConfig.label}</Text>
               <Text className="text-white/50 text-[11px]">{bannerConfig.sublabel}</Text>
             </View>
          </View>
          <ArrowRight size={18} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPendingApprovalsBanner = () => {
    if (!can('stat_pending_leaves') || !hrStats?.pendingLeaves) return null;
    return (
      <TouchableOpacity
        onPress={() => router.push('/(protectedRoute)/attendance' as any)}
        activeOpacity={0.85}
        className="px-5 mb-5"
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-xl px-4 py-3.5 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-row items-center gap-3 flex-1">
             <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
               <Clock size={18} color="white" />
             </View>
             <View>
               <Text className="text-white font-semibold text-[14px]">{hrStats.pendingLeaves} Pending Approvals</Text>
               <Text className="text-white/50 text-[11px]">Tap to review</Text>
             </View>
          </View>
          <ArrowRight size={18} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderStatCard = (title: string, value: string | number, Icon: any, colorClass: string, accentColor: string, borderHex: string) => (
    <View
      key={title}
      className={`flex-grow min-w-[45%] bg-white rounded-xl p-3.5 border border-[#E2E5F0] shadow-sm border-l-4 ${accentColor}`}
    >
      <View className="flex-row items-center gap-2 mb-1.5">
        <View className={`w-7 h-7 rounded-md items-center justify-center ${colorClass}`}>
          <Icon size={13} color={borderHex} />
        </View>
        <Text className="text-[11px] font-medium text-[#4B5068]" numberOfLines={1}>{title}</Text>
      </View>
      <Text className="text-2xl font-bold text-[#1A1D2E]">{value}</Text>
    </View>
  );

  const renderStatCards = () => {
    const cards: React.ReactNode[] = [];

    if (can('stat_total_employees')) {
      cards.push(renderStatCard('Employees', hrStats?.totalEmployees || 0, Users, 'bg-indigo-50', 'border-l-[#6C3DE8]', '#6C3DE8'));
    }
    if (can('stat_present_today')) {
      cards.push(renderStatCard('Present', hrStats?.presentToday || 0, UserCheck, 'bg-emerald-50', 'border-l-[#10B981]', '#10B981'));
    }
    if (can('stat_on_leave')) {
      cards.push(renderStatCard('On Leave', hrStats?.onLeave || 0, Ban, 'bg-rose-50', 'border-l-[#EF4444]', '#EF4444'));
    }
    if (can('stat_pending_leaves')) {
      cards.push(renderStatCard('Pending Approvals', hrStats?.pendingLeaves || 0, Calendar, 'bg-amber-50', 'border-l-[#F59E0B]', '#F59E0B'));
    }
    if (can('stat_leave_balance')) {
      cards.push(renderStatCard('Leave Days', employeeStats?.leaveBalance || 0, Calendar, 'bg-amber-50', 'border-l-[#F59E0B]', '#F59E0B'));
    }
    if (can('stat_my_tasks')) {
      cards.push(renderStatCard('Active Tasks', employeeStats?.myTasks || 0, CheckSquare, 'bg-blue-50', 'border-l-[#3B82F6]', '#3B82F6'));
    }

    if (cards.length === 0) return null;

    return (
      <View className="px-5 mb-5 flex-row flex-wrap gap-2.5">
        {cards}
      </View>
    );
  };

  const renderQuickActions = () => {
    if (!can('quick_actions') || !userRole) return null;

    const actions = getQuickActions(userRole);

    return (
      <View className="px-5 mb-5">
        <Text className="text-[11px] font-semibold mb-2" style={{ color: '#B4BACC', letterSpacing: 0.3 }}>QUICK ACTIONS</Text>
        <View className="flex-row flex-wrap gap-2.5">
          {actions.map(({ title, icon: Icon, bg, color, route }) => (
            <TouchableOpacity
              key={title}
               onPress={() => router.push(route as any)}
               activeOpacity={0.75}
               className="bg-white border border-[#E2E5F0] rounded-xl p-3.5 items-center shadow-sm"
               style={{ flexBasis: '47%', flexGrow: 1 }}
            >
               <View className="w-9 h-9 rounded-lg items-center justify-center mb-1.5" style={{ backgroundColor: bg }}>
                 <Icon size={18} color={color} />
               </View>
               <Text className="text-[12px] font-semibold text-[#1A1D2E]">{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPendingLeaves = () => {
    if (pendingLeaves.length === 0) return null;
    return (
      <View className="px-5 mt-0 mb-5">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[11px] font-semibold" style={{ color: '#B4BACC', letterSpacing: 0.3 }}>PENDING LEAVES</Text>
          <TouchableOpacity onPress={() => router.push('/(protectedRoute)/attendance' as any)} className="flex-row items-center gap-0.5">
            <Text className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>View All</Text>
            <ChevronRight size={12} color="#7C3AED" />
          </TouchableOpacity>
        </View>
        {pendingLeaves.slice(0, 3).map((leave: any) => (
          <View
            key={leave._id}
            className="flex-row items-center px-3 py-2.5 rounded-xl mb-1.5 border border-[#E2E5F0] shadow-sm"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <View className="w-7 h-7 rounded-md items-center justify-center mr-2.5" style={{ backgroundColor: '#FEF3C7' }}>
              <Calendar size={13} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold" style={{ color: '#1A1D2E' }}>
                {leave.employeeId?.basicInfo?.firstName} {leave.employeeId?.basicInfo?.lastName}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: '#8890A8' }}>
                {leave.leaveType?.name || 'Leave'} · {leave.fromDate?.split('T')[0]}
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
              <Text className="text-[10px] font-bold" style={{ color: '#92400E' }}>Pending</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecentTasks = () => (
    <View className="px-5 mb-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-[11px] font-semibold" style={{ color: '#B4BACC', letterSpacing: 0.3 }}>RECENT TASKS</Text>
        <TouchableOpacity onPress={() => router.push('/(protectedRoute)/tasks' as any)} className="flex-row items-center gap-0.5">
          <Text className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>See All</Text>
          <ChevronRight size={12} color="#7C3AED" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View className="py-6 items-center rounded-xl border border-[#E2E5F0] shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
          <Clock size={18} color="#B4BACC" />
          <Text className="mt-1.5 text-[11px]" style={{ color: '#B4BACC' }}>Loading…</Text>
        </View>
      ) : recentTasks.length > 0 ? (
        recentTasks.map((item: any) => {
          const style = STATUS_STYLES[item.status] || STATUS_STYLES['default'];
          return (
            <TouchableOpacity
              key={item._id}
              className="px-3.5 py-3 rounded-xl mb-1.5 flex-row items-center justify-between border border-[#E2E5F0] shadow-sm"
              style={{ backgroundColor: '#FFFFFF' }}
              onPress={() => router.push({ pathname: '/tasks', params: { taskId: item._id } } as any)}
              activeOpacity={0.7}
            >
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-[14px]" style={{ color: '#1A1D2E' }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-[11px] mt-1" style={{ color: '#B4BACC' }}>
                  Due {new Date(item.endDate || item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: style.bg }}>
                <Text className="text-[10px] font-bold" style={{ color: style.text }}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View className="p-6 rounded-xl items-center border border-[#E2E5F0] shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mb-2" style={{ backgroundColor: '#EDE9FE' }}>
            <Inbox size={18} color="#7C3AED" />
          </View>
          <Text className="text-[13px] font-semibold mb-0.5" style={{ color: '#1A1D2E' }}>No tasks yet</Text>
          <Text className="text-[11px]" style={{ color: '#B4BACC' }}>Your tasks will appear here</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F7F8FC' }} edges={['bottom', 'left', 'right']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
      >
        {/* Low-profile greeting with fade-out and slide-up transition */}
        <Animated.View
          style={{
            opacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, -10],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
          className="px-5 pt-3 pb-1 mb-1"
        >
          <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {getFormattedDate()}
          </Text>
          <Text className="text-lg font-bold text-gray-800 mt-0.5">
            Hello, {user?.name?.split(' ')[0] || 'User'}
          </Text>
        </Animated.View>

        {(loading || widgetsLoading) && !refreshing ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text className="mt-4 text-gray-400 text-xs font-semibold">Loading widgets...</Text>
          </View>
        ) : (
          <>
            {renderAttendanceBanner()}
            {renderPendingApprovalsBanner()}
            {renderStatCards()}
            {renderQuickActions()}
            {can('pending_leaves_list') && pendingLeaves.length > 0 && renderPendingLeaves()}
            {(can('recent_tasks_table') || can('priority_tasks')) && renderRecentTasks()}
          </>
        )}

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

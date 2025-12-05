import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, CheckSquare, FileText, LogIn, LogOut, Loader, LogInIcon, ClipboardList  } from 'lucide-react-native';
import { router } from 'expo-router';

interface EmployeeDashboardStats {
  attendanceStatus: 'check-in' | 'check-out' | 'not-started';
  leaveBalance: number;
  pendingLeaves: number;
  myTasks: number;
  completedTasks: number;
  monthlyAttendance: number;
  dailyActivity : number;
}

interface Props {
  stats: EmployeeDashboardStats | null;
}

const StatCard = ({ title, value, icon: Icon, colors, subtitle }: { 
  title: string; 
  value: number | string; 
  icon: any; 
  colors: string[];
  subtitle?: string;
}) => (
  <View className="w-[48%] mb-4 rounded-2xl overflow-hidden shadow-lg">
    <LinearGradient colors={colors} className="p-5">
      <View className="items-center">
        <Icon size={28} color="white" className="mb-2" />
        <Text className="text-3xl font-bold text-white mb-1">{value}</Text>
        <Text className="text-sm text-white/90 font-medium text-center">{title}</Text>
        {subtitle && <Text className="text-xs text-white/70 mt-1">{subtitle}</Text>}
      </View>
    </LinearGradient>
  </View>
);

const ActionCard = ({ title, icon: Icon, onPress, colors = ['#ffffff', '#f8fafc'] }: {
  title: string;
  icon: any;
  onPress: () => void;
  colors?: string[];
}) => (
  <TouchableOpacity onPress={onPress} className="w-[48%] mb-3 rounded-2xl overflow-hidden shadow-sm">
    <LinearGradient colors={colors} className="p-5 items-center border border-gray-100">
      <Icon size={24} color="#374151" className="mb-2" />
      <Text className="text-sm font-medium text-gray-700 text-center">{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'checked-in': return ['#10b981', '#059669'];
    case 'checked-out': return ['#6366f1', '#4f46e5'];
    case 'not-started': return ['#f59e0b', '#d97706'];
    default: return ['#6b7280', '#4b5563'];
  }
};

export default function EmployeeDashboard({ stats }: Props) {
  return (
    <>
      <View className="px-5 flex-row flex-wrap justify-between mt-5">
        <StatCard
          title="Attendance"
          value={stats?.attendanceStatus === 'check-in' ? 'Checked In' : 
                 stats?.attendanceStatus === 'check-out' ? 'Checked Out' : 'Not Started'}
          icon={stats?.attendanceStatus === 'check-in' ? LogIn : 
                stats?.attendanceStatus === 'check-out' ? LogOut : Clock}
          colors={getStatusColor(stats?.attendanceStatus || 'not-started')}
        />
        <StatCard
          title="Leave Balance"
          value={stats?.leaveBalance || 0}
          icon={Calendar}
          colors={['#8b5cf6', '#7c3aed']}
          subtitle="days remaining"
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          icon={Loader}
          colors={['#f6f45cff', '#ed733aff']}
          subtitle="days remaining"
        />
        <StatCard
          title="My Tasks"
          value={stats?.myTasks || 0}
          icon={CheckSquare}
          colors={['#06b6d4', '#0891b2']}
          subtitle="active tasks"
        />
        <StatCard
          title="Completed"
          value={stats?.completedTasks || 0}
          icon={FileText}
          colors={['#10b981', '#059669']}
          subtitle="this month"
        />
        <StatCard
          title="Monthly Attendance"
          value={stats?.monthlyAttendance || 0}
          icon={LogInIcon}
          colors={['#f65cf6ff', '#8e3aedff']}
          subtitle="days remaining"
        />
        <StatCard
          title="Activity Tasks"
          value={stats?.dailyActivity || 0}
          icon={ClipboardList}
          colors={['#f65cf6ff', '#8e3aedff']}
          subtitle="days remaining"
        />
      </View>

      <View className="px-5">
        <Text className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          <ActionCard
            title="Check In/Out"
            icon={Clock}
            onPress={() => router.push('/(protectedRoute)/attendance')}
          />
          <ActionCard
            title="Request Leave"
            icon={Calendar}
            onPress={() => router.push('/(protectedRoute)/attendance/leave-and-regularization')}
          />
          <ActionCard
            title="My Tasks"
            icon={CheckSquare}
            onPress={() => router.push('/(protectedRoute)/tasks')}
          />
          <ActionCard
            title="Profile"
            icon={FileText}
            onPress={() => router.push('/(protectedRoute)/me')}
          />
        </View>
      </View>
    </>
  );
}
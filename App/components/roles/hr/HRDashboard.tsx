import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Users, UserCheck, Calendar, Clock, BarChart3, FileText } from 'lucide-react-native';
import { router } from 'expo-router';

interface HRDashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  activeTasks: number;
  completedTasks: number;
}

interface Props {
  stats: HRDashboardStats | null;
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

export default function HRDashboard({ stats }: Props) {
  return (
    <>
      <View className="px-5 flex-row flex-wrap justify-between mt-5">
        <StatCard
          title="Employees"
          value={stats?.totalEmployees || 0}
          icon={Users}
          colors={['#667eea', '#764ba2']}
        />
        <StatCard
          title="Present"
          value={stats?.presentToday || 0}
          icon={UserCheck}
          colors={['#f093fb', '#f5576c']}
        />
        <StatCard
          title="On Leave"
          value={stats?.onLeave || 0}
          icon={Calendar}
          colors={['#4facfe', '#00f2fe']}
        />
        <StatCard
          title="Pending"
          value={stats?.pendingLeaves || 0}
          icon={Clock}
          colors={['#43e97b', '#38f9d7']}
        />
      </View>

      <View className="px-5">
        <Text className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          <ActionCard
            title="Manage Employees"
            icon={Users}
            onPress={() => router.push('/(protectedRoute)/employees')}
          />
          <ActionCard
            title="Leave Approvals"
            icon={Calendar}
            onPress={() => router.push('/(protectedRoute)/leave-approvals')}
          />
          <ActionCard
            title="Reports"
            icon={BarChart3}
            onPress={() => router.push('/(protectedRoute)/reports')}
          />
          <ActionCard
            title="Attendance"
            icon={Clock}
            onPress={() => router.push('/(protectedRoute)/attendance-management')}
          />
        </View>
      </View>
    </>
  );
}
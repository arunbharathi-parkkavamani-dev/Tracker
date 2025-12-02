import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Settings, Shield, BarChart3, Database, Activity } from 'lucide-react-native';
import { router } from 'expo-router';

interface SuperAdminDashboardStats {
  totalUsers: number;
  systemHealth: string;
  activeRoles: number;
  systemAlerts: number;
}

interface Props {
  stats: SuperAdminDashboardStats | null;
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

export default function SuperAdminDashboard({ stats }: Props) {
  return (
    <>
      <View className="px-5 flex-row flex-wrap justify-between mt-5">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          colors={['#667eea', '#764ba2']}
        />
        <StatCard
          title="System Health"
          value={stats?.systemHealth || 'Good'}
          icon={Activity}
          colors={['#f093fb', '#f5576c']}
        />
        <StatCard
          title="Active Roles"
          value={stats?.activeRoles || 0}
          icon={Shield}
          colors={['#4facfe', '#00f2fe']}
        />
        <StatCard
          title="Alerts"
          value={stats?.systemAlerts || 0}
          icon={Database}
          colors={['#43e97b', '#38f9d7']}
        />
      </View>

      <View className="px-5">
        <Text className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          <ActionCard
            title="User Management"
            icon={Users}
            onPress={() => router.push('/(protectedRoute)/user-management')}
          />
          <ActionCard
            title="Role Management"
            icon={Shield}
            onPress={() => router.push('/(protectedRoute)/role-management')}
          />
          <ActionCard
            title="System Settings"
            icon={Settings}
            onPress={() => router.push('/(protectedRoute)/system-settings')}
          />
          <ActionCard
            title="Analytics"
            icon={BarChart3}
            onPress={() => router.push('/(protectedRoute)/analytics')}
          />
        </View>
      </View>
    </>
  );
}
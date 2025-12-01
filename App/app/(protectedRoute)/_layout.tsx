import { useState, useEffect, useContext } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";
import { AuthContext } from "@/context/AuthContext";

type SidebarItem = {
  _id: string;
  title: string;
  route: string;
  icon?: {
    iconName: string;
  };
};

function CustomDrawerContent() {
  const [navItems, setNavItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchNavBar = async () => {
      try {
        const response = await axiosInstance.get("/populate/read/sidebars");
        setNavItems(response?.data?.data || []);
      } catch (err: any) {
        const defaultRoutes = [
          { _id: '1', title: 'Dashboard', route: '/dashboard', icon: { iconName: 'MdDashboard' } },
          { _id: '2', title: 'Daily Tracker', route: '/daily-tracker', icon: { iconName: 'MdToday' } },
          { _id: '3', title: 'Tasks', route: '/tasks', icon: { iconName: 'MdTask' } },
          { _id: '4', title: 'Attendance', route: '/attendance', icon: { iconName: 'MdSchedule' } },
          { _id: '5', title: 'Profile', route: '/me', icon: { iconName: 'MdPerson' } },
          { _id: '6', title: 'Salary Expense', route: '/salary-expense', icon: { iconName: 'MdMoney' } },
          { _id: '7', title: 'Travel Expenses', route: '/travel-expenses', icon: { iconName: 'MdFlight' } }
        ];
        setNavItems(defaultRoutes);
        
        if (err?.response?.status === 401) {
          await AsyncStorage.multiRemove(["auth_token", "refresh_token"]);
          return router.replace("/(authRoute)/Login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNavBar();
  }, []);

  const getEmojiIcon = (route: string) => {
    const iconMap: { [key: string]: string } = {
      '/dashboard': '📊',
      '/daily-tracker': '📅', 
      '/tasks': '✅',
      '/attendance': '⏰',
      '/me': '👤',
      '/salary-expense': '💰',
      '/travel-expenses': '✈️'
    };
    return iconMap[route] || '📋';
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <DrawerContentScrollView>
      {navItems
        .filter(item => item.route !== '/logout' && item.route !== 'logout')
        .map((item) => {
          return (
            <DrawerItem
              key={item._id}
              label={item.title}
              icon={({ size }) => (
                <Text style={{ fontSize: size }}>{getEmojiIcon(item.route)}</Text>
              )}
              onPress={() => {
                const route = item.route.replace(/^\//, '');
                router.push(`/(protectedRoute)/${route}`);
              }}
            />
          );
        })}
      <DrawerItem
        label="Logout"
        icon={({ size }) => (
          <Text style={{ fontSize: size }}>🚪</Text>
        )}
        onPress={async () => {
          await logout();
          router.replace("/(authRoute)/Login");
        }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer 
      screenOptions={{ headerShown: true }}
      drawerContent={() => <CustomDrawerContent />}
    />
  );
}

import { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useSegments } from "expo-router";
import { ActivityIndicator, View, Text, Animated } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import NotificationDrawer from '@/components/NotificationDrawer';

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
        const response = await axiosInstance.get("/populate/read/sidebar");
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
      <View className="flex-1 justify-center items-center">
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
                <Text className="text-base">{getEmojiIcon(item.route)}</Text>
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
          <Text className="text-base">🚪</Text>
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
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const slideAnim = useRef(new Animated.Value(320)).current;

  const openDrawer = () => {
    setShowNotificationDrawer(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: 320,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationDrawer(false);
    });
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      if (event.translationX < -50 && event.velocityX < -500 && Math.abs(event.translationY) < 30) {
        openDrawer();
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>
          <Drawer 
      screenOptions={({ route }) => {
        const isParentRoute = route.name.endsWith('/index');
        
        return {
          headerShown: true,
          drawerActiveTintColor: '#667eea',
          drawerInactiveTintColor: '#6B7280',
          swipeEnabled: true,
          swipeEdgeWidth: 100,
          header: () => (
            <AppHeader
              title={getPageTitle(route.name)}
              showDrawer={isParentRoute}
              showBack={!isParentRoute}
              showNotification
              onNotificationPress={openDrawer}
            />
          )
        };
      }}
      drawerContent={() => <CustomDrawerContent />}
          />
          
          <NotificationDrawer 
            visible={showNotificationDrawer}
            onClose={closeDrawer}
            slideAnim={slideAnim}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function getPageTitle(routeName: string) {
  const titleMap: { [key: string]: string } = {
    'dashboard/index': 'Dashboard',
    'attendance/index': 'Attendance', 
    'attendance/leave-and-regularization': 'Leave & Regularization',
    'tasks/index': 'Tasks',
    'me/index': 'Profile',
    'daily-tracker/index': 'Daily Tracker',
    'salary-expense/index': 'Salary Expense',
    'travel-expenses/index': 'Travel Expenses'
  };
  return titleMap[routeName] || 'App';
}

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

import { LayoutDashboard, Calendar, CalendarCheck, User, Users, DollarSign, Plane, LogOut, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react-native';

// ... existing imports ...

type SidebarItem = {
  _id: string;
  title: string;
  mainRoute: string;
  parentId?: string;
  hasChildren?: boolean;
  isParent?: boolean;
  children?: SidebarItem[];
  icon?: {
    iconName: string;
  };
};

function CustomDrawerContent() {
  const [navItems, setNavItems] = useState<SidebarItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchNavBar = async () => {
      try {
        const response = await axiosInstance.get("/populate/read/sidebars");
        const items = response?.data?.data || [];

        // Build hierarchical structure
        const parents = items.filter((item: SidebarItem) => item.isParent || !item.parentId);
        const children = items.filter((item: SidebarItem) => item.parentId);

        const hierarchical = parents.map((parent: SidebarItem) => {
          const itemChildren = children.filter((child: SidebarItem) => child.parentId === parent._id);
          return {
            ...parent,
            children: itemChildren,
            hasChildren: itemChildren.length > 0
          };
        });

        setNavItems(hierarchical);
      } catch (err: any) {
        const defaultRoutes = [
          { _id: '1', title: 'Dashboard', mainRoute: '/dashboard', icon: { iconName: 'MdDashboard' } },
          { _id: '2', title: 'Daily Tracker', mainRoute: '/daily-tracker', icon: { iconName: 'MdToday' } },
          { _id: '3', title: 'Tasks', mainRoute: '/tasks', icon: { iconName: 'MdTask' } },
          { _id: '4', title: 'Attendance', mainRoute: '/attendance', icon: { iconName: 'MdSchedule' } },
          { _id: '5', title: 'Profile', mainRoute: '/me', icon: { iconName: 'MdPerson' } },
          { _id: '6', title: 'Salary Expense', mainRoute: '/salary-expense', icon: { iconName: 'MdMoney' } },
          { _id: '7', title: 'Travel Expenses', mainRoute: '/travel-expenses', icon: { iconName: 'MdFlight' } }
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

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigation = (item: SidebarItem) => {
    if ((item.children && item.children.length > 0) || item.hasChildren) {
      toggleExpanded(item._id);
    } else {
      const route = item.mainRoute.replace(/^\//, '');
      router.push(`/(protectedRoute)/${route}`);
    }
  };

  const getIcon = (iconName: string, size = 20, color = "#9CA3AF") => {
    // Map Material icon names (from DB) to Lucide equivalents
    // or use route logic if iconName is sparse
    const lowerName = iconName?.toLowerCase() || '';

    if (lowerName.includes('dashboard')) return <LayoutDashboard size={size} color={color} />;
    if (lowerName.includes('task')) return <CalendarCheck size={size} color={color} />;
    if (lowerName.includes('attendance') || lowerName.includes('schedule')) return <Calendar size={size} color={color} />;
    if (lowerName.includes('person') || lowerName.includes('profile')) return <User size={size} color={color} />;
    if (lowerName.includes('money') || lowerName.includes('salary')) return <DollarSign size={size} color={color} />;
    if (lowerName.includes('travel') || lowerName.includes('flight')) return <Plane size={size} color={color} />;
    if (lowerName.includes('people') || lowerName.includes('team')) return <Users size={size} color={color} />;

    return <HelpCircle size={size} color={color} />;
  };

  // Fallback icon based on route if DB icon name isn't perfect
  const getIconByRoute = (route: string, size = 20, color = "#9CA3AF") => {
    const r = route.toLowerCase();
    if (r.includes('dashboard')) return <LayoutDashboard size={size} color={color} />;
    if (r.includes('tasks')) return <CalendarCheck size={size} color={color} />;
    if (r.includes('attendance')) return <Calendar size={size} color={color} />;
    if (r.includes('me') || r.includes('profile')) return <User size={size} color={color} />;
    if (r.includes('salary')) return <DollarSign size={size} color={color} />;
    if (r.includes('travel')) return <Plane size={size} color={color} />;
    return <HelpCircle size={size} color={color} />;
  };

  const renderNavItem = (item: SidebarItem, isChild = false) => {
    const isExpanded = expandedItems.has(item._id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = false; // logic for active route highlighting could be added here similar to frontend

    return (
      <View key={item._id} className="mb-1">
        <DrawerItem
          label={({ focused, color }) => (
            <Text className={`${isChild ? 'text-sm' : 'text-base font-medium'} text-gray-700 dark:text-gray-200`}>
              {item.title}
            </Text>
          )}
          style={{
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderRadius: 8,
            marginLeft: isChild ? 16 : 0
          }}
          icon={({ size, color }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', width: 24 }}>
              {getIconByRoute(item.mainRoute, 20, '#4B5563')}
            </View>
          )}
          onPress={() => handleNavigation(item)}

        // Custom right accessory for expand icon
        />
        {hasChildren && (
          <View className="absolute right-4 top-4 pointer-events-none">
            {isExpanded ? <ChevronDown size={16} color="#9CA3AF" /> : <ChevronRight size={16} color="#9CA3AF" />}
          </View>
        )}

        {hasChildren && isExpanded && (
          <View className="ml-2 border-l-2 border-gray-100 dark:border-gray-800">
            {item.children?.map(child => renderNavItem(child, true))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-950">
      <DrawerContentScrollView contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 12 }}>

        {/* Header/Brand */}
        <View className="px-4 py-4 mb-2 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            LMX<Text className="text-blue-600 font-light">Tracker</Text>
          </Text>
        </View>

        {navItems
          .filter(item => item.mainRoute !== '/logout' && item.mainRoute !== 'logout')
          .map((item) => renderNavItem(item))}

        <View className="h-[1px] bg-gray-100 dark:bg-gray-800 my-2 mx-4" />

        <DrawerItem
          label="Logout"
          labelStyle={{ color: '#EF4444', fontWeight: '500' }}
          icon={({ size }) => (
            <LogOut size={20} color="#EF4444" />
          )}
          onPress={async () => {
            await logout();
            router.replace("/(authRoute)/Login");
          }}
        />
      </DrawerContentScrollView>

      {/* Footer */}
      <View className="p-4 border-t border-gray-100 dark:border-gray-800">
        <Text className="text-xs text-center text-gray-400">© 2024 LMX</Text>
      </View>
    </View>
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

import { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useSegments } from "expo-router";
import { ActivityIndicator, View, Text, Animated, TouchableOpacity } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import NotificationDrawer from '@/components/NotificationDrawer';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LayoutDashboard, Calendar, CalendarCheck, User, Users, DollarSign,
  Plane, LogOut, ChevronDown, ChevronRight, HelpCircle, Ticket,
  Rss, Clock, ClipboardList, History, Target, CreditCard,
  ShieldCheck, Landmark, FileText, Receipt, Briefcase, Bell
} from 'lucide-react-native';

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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchNavBar = async () => {
      try {
        const response = await axiosInstance.get("/populate/read/sidebars");
        const items = response?.data?.data || [];

        // Build hierarchical structure
        const parents = items.filter((item: SidebarItem) => item.isParent || !item.parentId);
        const children = items.filter((item: SidebarItem) => item.parentId);

        const hierarchical = parents.map((parent: SidebarItem) => {
          // Normalize parent route for comparison (remove leading slash)
          const parentRouteId = parent.mainRoute?.replace(/^\//, '');

          const itemChildren = children.filter((child: SidebarItem) => {
            const childParentId = String(child.parentId);
            return childParentId === String(parent._id) || childParentId === parentRouteId;
          });

          return {
            ...parent,
            children: itemChildren,
            // Only set hasChildren if it's not already true or if we found children
            hasChildren: parent.hasChildren || itemChildren.length > 0 || parent.isParent
          };
        });

        setNavItems(hierarchical);
      } catch (err: any) {
        // ... defaultRoutes ...
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
          return router.replace("/Login");
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
    const isParent = item.isParent || item.hasChildren || (item.children && item.children.length > 0);
    if (isParent) {
      toggleExpanded(item._id);
    } else {
      // Ensure the route is valid for router.push
      const route = item.mainRoute.startsWith('/') ? item.mainRoute : `/${item.mainRoute}`;
      router.push(route as any);
    }
  };

  // ... getIcon and getIconByRoute ...

  const getIcon = (iconName: string, size = 20, color = "#4B5563") => {
    const lowerName = iconName?.toLowerCase() || '';
    if (lowerName.includes('dashboard')) return <LayoutDashboard size={size} color={color} />;
    if (lowerName.includes('rss') || lowerName.includes('feed')) return <Rss size={size} color={color} />;
    if (lowerName.includes('time') || lowerName.includes('clock') || lowerName.includes('schedule')) return <Clock size={size} color={color} />;
    if (lowerName.includes('task')) return <CalendarCheck size={size} color={color} />;
    if (lowerName.includes('attendance') || lowerName.includes('calendar')) return <Calendar size={size} color={color} />;
    if (lowerName.includes('person') || lowerName.includes('profile') || lowerName.includes('user')) return <User size={size} color={color} />;
    if (lowerName.includes('money') || lowerName.includes('salary') || lowerName.includes('pay')) return <DollarSign size={size} color={color} />;
    if (lowerName.includes('travel') || lowerName.includes('flight') || lowerName.includes('plane')) return <Plane size={size} color={color} />;
    if (lowerName.includes('people') || lowerName.includes('team') || lowerName.includes('crm')) return <Users size={size} color={color} />;
    if (lowerName.includes('ticket') || lowerName.includes('confirmation')) return <Ticket size={size} color={color} />;
    if (lowerName.includes('assessment') || lowerName.includes('report') || lowerName.includes('list')) return <ClipboardList size={size} color={color} />;
    if (lowerName.includes('history') || lowerName.includes('log')) return <History size={size} color={color} />;
    if (lowerName.includes('track') || lowerName.includes('activity')) return <Target size={size} color={color} />;
    if (lowerName.includes('policy') || lowerName.includes('security')) return <ShieldCheck size={size} color={color} />;
    if (lowerName.includes('account') || lowerName.includes('bank') || lowerName.includes('balance')) return <Landmark size={size} color={color} />;
    if (lowerName.includes('description') || lowerName.includes('file')) return <FileText size={size} color={color} />;
    if (lowerName.includes('receipt') || lowerName.includes('expense')) return <Receipt size={size} color={color} />;
    return <HelpCircle size={size} color={color} />;
  };

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
    const hasChildren = (item.children && item.children.length > 0) || item.hasChildren;
    const isActive = false;

    return (
      <View key={item._id} className="mb-1">
        <View className="relative">
          <DrawerItem
            label={({ focused, color }) => (
              <Text className={`${isChild ? 'text-sm' : 'text-base font-medium'} text-gray-700 dark:text-gray-200`}>
                {item.title}
              </Text>
            )}
            style={{
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderRadius: 8,
              marginLeft: isChild ? 16 : 0,
              paddingRight: hasChildren ? 40 : 0, // Make room for chevron
            }}
            icon={({ size, color }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', width: 24 }}>
                {item.icon?.iconName
                  ? getIcon(item.icon.iconName, 20, '#4B5563')
                  : getIconByRoute(item.mainRoute, 20, '#4B5563')}
              </View>
            )}
            onPress={() => handleNavigation(item)}
          />
          {hasChildren && (
            <TouchableOpacity
              activeOpacity={0.7}
              className="absolute right-0 w-12 h-full justify-center items-center"
              onPress={() => toggleExpanded(item._id)}
            >
              {isExpanded ? <ChevronDown size={18} color="#4B5563" /> : <ChevronRight size={18} color="#4B5563" />}
            </TouchableOpacity>
          )}
        </View>

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
    <View className="flex-1 bg-white dark:bg-gray-950" style={{ paddingTop: insets.top }}>
      <DrawerContentScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 12 }}>

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
            router.replace("/Login");
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

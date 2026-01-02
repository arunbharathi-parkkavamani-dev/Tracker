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
        
        const hierarchical = parents.map((parent: SidebarItem) => ({
          ...parent,
          children: children.filter((child: SidebarItem) => child.parentId === parent._id)
        }));
        
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
    if (item.hasChildren) {
      toggleExpanded(item._id);
    } else {
      const route = item.mainRoute.replace(/^\//, '');
      router.push(`/(protectedRoute)/${route}`);
    }
  };

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

  const renderNavItem = (item: SidebarItem, isChild = false) => {
    const isExpanded = expandedItems.has(item._id);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <View key={item._id}>
        <DrawerItem
          label={item.title}
          labelStyle={isChild ? { fontSize: 14, marginLeft: 20 } : {}}
          icon={({ size }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text className="text-base">{getEmojiIcon(item.mainRoute)}</Text>
              {hasChildren && (
                <Text style={{ marginLeft: 8, fontSize: 12 }}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              )}
            </View>
          )}
          onPress={() => handleNavigation(item)}
        />
        {hasChildren && isExpanded && (
          <View>
            {item.children?.map(child => renderNavItem(child, true))}
          </View>
        )}
      </View>
    );
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
        .filter(item => item.mainRoute !== '/logout' && item.mainRoute !== 'logout')
        .map((item) => renderNavItem(item))}
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

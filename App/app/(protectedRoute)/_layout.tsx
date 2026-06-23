import { useState, useEffect, useContext, useRef } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useSegments } from "expo-router";
import { ActivityIndicator, View, Text, Animated, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import NotificationDrawer from '@/components/NotificationDrawer';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, SidebarItem } from "@/context/NavigationContext";

import {
  LayoutDashboard, Calendar, CalendarCheck, User, Users, DollarSign,
  Plane, LogOut, ChevronDown, ChevronRight, HelpCircle, Ticket,
  Rss, Clock, ClipboardList, History, Target, CreditCard,
  ShieldCheck, Landmark, FileText, Receipt, Briefcase, Bell
} from 'lucide-react-native';

function CustomDrawerContent() {
  const { logout, user } = useContext(AuthContext);
  const { navItems, isActive: checkActive, navigateTo, badges } = useNavigation();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Find active segment, e.g. segments[1] matches screen names
  const currentSegment = segments[1] || '';

  const getNavItemIcon = (iconName: string, color: string, size = 20) => {
    switch (iconName) {
      case 'dashboard':
        return <LayoutDashboard size={size} color={color} />;
      case 'attendance':
        return <Calendar size={size} color={color} />;
      case 'tasks':
        return <CalendarCheck size={size} color={color} />;
      case 'daily-tracker':
        return <Clock size={size} color={color} />;
      case 'tickets':
        return <Ticket size={size} color={color} />;
      case 'salary-expense':
        return <DollarSign size={size} color={color} />;
      case 'travel-expenses':
        return <Plane size={size} color={color} />;
      case 'me':
        return <User size={size} color={color} />;
      default:
        return <HelpCircle size={size} color={color} />;
    }
  };

  const handleNavigation = (item: SidebarItem) => {
    navigateTo(item.route);
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-950" style={{ paddingTop: insets.top }}>
      {/* Brand Header with LinearGradient */}
      <LinearGradient
        colors={['#6C3DE8', '#8B5CF6', '#C026D3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 12 }}
      >
        <Text className="text-xl font-bold text-white mb-4">
          Work<Text className="font-light text-fuchsia-200">Hub</Text>
        </Text>

        {user && (
          <View className="flex-row items-center">
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1.5, borderColor: '#fff' }}
              />
            ) : (
              <View className="bg-white/20 items-center justify-center" style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}>
                <User size={20} color="#fff" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-white font-bold text-[14px]" numberOfLines={1}>
                {user.name || 'User'}
              </Text>
              <Text className="text-white/80 text-[11px]" numberOfLines={1}>
                {user.email || 'Employee'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <DrawerContentScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 12 }}>
        {navItems.map((item) => {
          // Check if item's route is current active route
          const isActive = checkActive(item.route);
          const activeColor = item.accentColor;
          const iconColor = isActive ? activeColor : '#4B5068';
          const textColor = isActive ? activeColor : '#1A1D2E';
          
          const badgeCount = badges[item.id] || 0;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleNavigation(item)}
              className="flex-row items-center px-4 py-3 rounded-xl mb-1.5"
              style={{
                backgroundColor: isActive ? item.bgColor : 'transparent',
              }}
            >
              <View className="mr-3">
                {getNavItemIcon(item.icon, iconColor)}
              </View>
              <Text
                className={`text-[14px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                style={{ color: textColor }}
              >
                {item.title}
              </Text>
              {badgeCount > 0 && (
                <View className="bg-red-500 rounded-full px-2 py-0.5 min-w-[20] items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">{badgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View className="h-[1px] bg-gray-100 dark:bg-gray-800 my-2 mx-2" />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => {
            await logout();
            router.replace("/Login");
          }}
          className="flex-row items-center px-4 py-3 rounded-xl mb-2"
        >
          <View className="mr-3">
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text className="text-[14px] font-semibold text-red-500">
            Logout
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer */}
      <View className="p-4 border-t border-gray-100 dark:border-gray-800">
        <Text className="text-xs text-center text-gray-400">© {new Date().getFullYear()} WorkHub</Text>
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
    'travel-expenses/index': 'Travel Expenses',
    'tickets/index': 'Tickets',
    'tickets/[id]': 'Ticket Details'
  };
  return titleMap[routeName] || 'App';
}

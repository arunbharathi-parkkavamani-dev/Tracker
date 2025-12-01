import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import * as MD from "@expo/vector-icons/MaterialIcons";
import { Drawer } from "expo-router/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

type SidebarItem = {
  _id: string;
  title: string;
  route: string;
  icon?: {
    iconName: string;
  };
};

export default function DrawerLayout() {
  const [navItems, setNavItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNavBar = async () => {
      try {
        const response = await axiosInstance.get("/populate/read/sidebar");
        setNavItems(response?.data?.data || []);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          return router.replace("/(authRoute)/Login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNavBar();
  }, []);

  // PREVENT rendering before data is ready
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // normalize route from backend → expo-router filesystem route
  const normalize = (route: string) => {
    if (!route.startsWith("/")) route = "/" + route;
    return `/(protectedRoute)${route}`; // always point to protected folder
  };

  // Get proper title based on route
  const getRouteTitle = (route: string) => {
    const routeTitles: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/daily-tracker': 'Daily Tracker',
      '/tasks': 'Tasks',
      '/attendance': 'Attendance',
      '/profile': 'Profile'
    };
    return routeTitles[route] || item.title;
  };

  return (
    <Drawer screenOptions={{ headerShown: true }}>
      {navItems.map((item) => {
        // resolve icon name exactly as backend gives (MdDashboard, MdPerson, etc.)
        const Icon = MD[item.icon?.iconName as keyof typeof MD] || MD["Error"];

        return (
          <Drawer.Screen
            key={item._id}
            // name MUST be filesystem route NOT title
            name={normalize(item.route)}
            options={{
              title: getRouteTitle(item.route),
              drawerIcon: ({ color, size }) => (
                <Icon size={size} color={color} />
              ),
            }}
            listeners={{
              drawerItemPress: () => {
                if (item.route === "/logout" || item.route === "logout") {
                  AsyncStorage.removeItem("token").then(() => {
                    router.replace("/(authRoute)/Login");
                  });
                } else {
                  router.replace(normalize(item.route));
                }
              },
            }}
          />
        );
      })}
    </Drawer>
  );
}

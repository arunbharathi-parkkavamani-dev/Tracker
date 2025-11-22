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
        console.log(response?.data?.data)
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          return router.replace("/Login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNavBar();
  }, []);

  // show loader before drawer is ready
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Drawer screenOptions={{ headerShown: true }}>
      {navItems.map((item) => {
        // Normalize route (/dashboard vs dashboard)
        const normalizedRoute = item.route.startsWith("/")
          ? item.route
          : `/${item.route}`;

        // Fix MaterialIcons name -> MdDashboard → dashboard
        const rawIcon = item.icon?.iconName || "";
        const iconKey = rawIcon.replace(/^Md/, ""); // Remove "Md"
        const formattedIcon = iconKey.charAt(0).toUpperCase() + iconKey.slice(1);
        const Icon =
          MD[formattedIcon as keyof typeof MD] || MD.HelpOutline;

        return (
          <Drawer.Screen
            key={item._id}
            name={item.title}
            options={{
              title: item.title,
              drawerIcon: ({ color, size }) => <Icon size={size} color={color} />,
            }}
            listeners={{
              drawerItemPress: () => {
                if (normalizedRoute === "/logout") {
                  // Handle logout item
                  AsyncStorage.removeItem("token").then(() => {
                    router.replace("/Login");
                  });
                } else {
                  router.navigate(normalizedRoute);
                }
              },
            }}
          />
        );
      })}
    </Drawer>
  );
}

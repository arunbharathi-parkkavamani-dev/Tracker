// app/(protectedRoute)/Sidebar.tsx
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import axiosInstance from "@/Api/axiosInstance";
import * as MaterialIcons from "@expo/vector-icons/MaterialIcons"; // or use your preferred icon library

type NavItem = {
  _id: string;
  title: string;
  route: string;
  icon?: {
    iconName?: keyof typeof MaterialIcons;
  };
};

const Sidebar = () => {
  const router = useRouter();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const res = await axiosInstance.get("/populate/read/sidebar");
        setNavItems(res.data.data || []);
      } catch (err) {
        console.error("Error fetching nav items:", err);
      }
    };

    fetchNavItems();
  }, []);

  return (
    <ScrollView className="flex-1 bg-blue-400 p-4">
        <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-white">Logimax</Text>
        </View>
      {navItems.length > 0 ? (
        navItems.map((item) => {
          const routeName = item.route?.startsWith("/")
            ? item.route.slice(1)
            : item.route;

          return (
            <TouchableOpacity
              key={item._id}
              className="flex-row items-center gap-3 p-2 rounded-lg"
              onPress={() => router.push(routeName as any)}
            >
              <Text className="text-white p-2 text-lg font-bold border-b  border-blue-600 w-full">
                {item.title.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })
      ) : (
        <Text className="text-gray-500">Loading...</Text>
      )}
    </ScrollView>
  );
};

export default Sidebar;

// components/ui/TopNavbar.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or any icon library

import type { DrawerNavigationProp } from "@react-navigation/drawer";

export default function TopNavbar({ navigation, title = "Logimax" }) {
  return (
    <View className="w-full h-16 bg-blue-600 flex-row items-center px-4 justify-between">
      {/* Drawer toggle button */}
      <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>

      {/* Title */}
      <Text className="text-white text-lg font-bold">{title}</Text>

      {/* Optional: right action icon */}
      <View style={{ width: 28 }} />
    </View>
  );
}

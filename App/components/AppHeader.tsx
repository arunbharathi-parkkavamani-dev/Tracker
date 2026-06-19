import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { DrawerToggleButton } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '@/context/NotificationContext';

export default function AppHeader({
  title,
  showBack = false,
  showNotification = false,
  user = null,
  checkInTime = null,
  showDrawer = false,
  onNotificationPress = () => {},
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState("");
  const { unReadCount } = useNotification();

  // Live time update
  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hh}:${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayTime = checkInTime ? checkInTime : currentTime;

  return (
    <View className="bg-white border-b border-gray-100 pt-14 px-5 pb-3 relative shadow-sm">
      {/* Back button */}
      {showBack && (
        <TouchableOpacity
          className="absolute left-5 top-14 p-2 z-10"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1D2E" />
        </TouchableOpacity>
      )}

      {/* Drawer button */}
      {showDrawer && (
        <View className="absolute left-5 top-14 z-10">
          <DrawerToggleButton tintColor="#1A1D2E" />
        </View>
      )}

      {/* Notification icon */}
      {showNotification && (
        <TouchableOpacity 
          className="absolute right-5 top-15 p-2 z-10"
          onPress={onNotificationPress}
        >
          <Ionicons 
            name={unReadCount > 0 ? "notifications" : "notifications-outline"} 
            size={22} 
            color="#1A1D2E" 
          />
          {unReadCount > 0 && (
            <View className="absolute top-1.5 right-1.5 bg-[#EF4444] px-1 rounded-full min-w-[14px] h-3.5 items-center justify-center">
              <Text className="text-white text-[8px] font-bold">
                {unReadCount > 99 ? '99+' : unReadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Title */}
      <Text className="text-[#1A1D2E] text-[18px] font-semibold text-center py-2">{title}</Text>

      {/* Dashboard only */}
      {user && (
        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
          <Image
            source={{ uri: user.avatar }}
            className="w-[44px] h-[44px] rounded-full mr-3 border border-gray-100"
          />
          <View className="flex-1">
            <Text className="text-[#8890A8] text-[12px]">Welcome Back!</Text>
            <Text className="text-[#1A1D2E] font-bold text-[14px]">{user.name}</Text>
          </View>

          {/* Time – check-in or current live time */}
          <View>
            <Text className="text-[#8890A8] text-[10px] text-right uppercase tracking-wider font-semibold">
              {checkInTime ? "Check In" : "Current Time"}
            </Text>
            <Text className="text-[#1A1D2E] font-bold text-[14px] text-right">
              {displayTime}
            </Text>
          </View>
        </View>
      )}
      
    </View>
  );
}

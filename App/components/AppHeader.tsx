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
    <View className="bg-[#1F365F] pt-14 px-5 pb-5 rounded-b-[28px] relative">
      {/* Back button */}
      {showBack && (
        <TouchableOpacity
          className="absolute left-5 top-16 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          onPress={() => {
            console.log('Back button pressed');
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Drawer button */}
      {showDrawer && (
        <View className="absolute left-5 top-16">
          <DrawerToggleButton tintColor="#fff" />
        </View>
      )}

      {/* Notification icon */}
      {showNotification && (
        <TouchableOpacity 
          className="absolute right-5 top-16"
          onPress={onNotificationPress}
        >
          <Ionicons 
            name={unReadCount > 0 ? "notifications" : "notifications-outline"} 
            size={24} 
            color="#fff" 
          />
          {unReadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 px-1 rounded-full min-w-[16px] h-4 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {unReadCount > 99 ? '99+' : unReadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Title */}
      <Text className="text-white text-[26px] font-bold text-center">{title}</Text>

      {/* Dashboard only */}
      {user && (
        <View className="flex-row items-center mt-4">
          <Image
            source={{ uri: user.avatar }}
            className="w-[52px] h-[52px] rounded-full mr-4"
          />
          <View className="flex-1">
            <Text className="text-white text-[14px]">Welcome Back!</Text>
            <Text className="text-white font-bold text-[15px]">{user.name}</Text>
          </View>

          {/* Time – check-in or current live time */}
          <View>
            <Text className="text-[#D0D8FF] text-[12px] text-right">
              {checkInTime ? "Check In" : "Current Time"}
            </Text>
            <Text className="text-white font-bold text-[16px] text-right">
              {displayTime}
            </Text>
          </View>
        </View>
      )}
      
    </View>
  );
}

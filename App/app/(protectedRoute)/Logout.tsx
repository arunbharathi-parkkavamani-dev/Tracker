import { useState, useEffect, useContext } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance, { getDeviceUUID } from "@/api/axiosInstance";

export default function LogoutScreen() {
  const { logout } = useContext(AuthContext);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call logout API
        await axiosInstance.post("/auth/logout", {}, {
          headers: {
            'x-device-uuid': await getDeviceUUID()
          }
        });
      } catch (e) {
        console.error("Logout API error:", e);
      }
      
      try {
        // Clear local storage and context
        await logout();
      } catch (e) {
        console.error("Local logout error:", e);
      }
      
      setDone(true);
    };

    performLogout();
  }, []);

  if (!done) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <View className="w-80 bg-white shadow-lg rounded-2xl p-8">
          <Text className="text-xl font-semibold text-center mb-5">
            Logging out...
          </Text>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return <Redirect href="/Login" />;
}

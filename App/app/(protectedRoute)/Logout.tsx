import { useState, useEffect, useContext } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { AuthContext } from "@/context/AuthContext"; // adjust path if needed

export default function LogoutScreen() {
  const { logout } = useContext(AuthContext);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout(); // your context logout
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("refresh_token");
      } catch (e) {
        console.error("Logout error:", e);
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

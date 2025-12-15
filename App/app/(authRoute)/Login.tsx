import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Link } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { registerForPushNotifications } from "@/utils/registerPushToken";

export default function Login() {
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Login API
      const response = await axiosInstance.post(
        "/auth/login",
        {
          workEmail,
          password,
          platform: "mobile", // 🔥 IMPORTANT
        },
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.accessToken) {
        console.log("Login response data:", response.data);
        const { accessToken, sessionId } = response.data;
        console.log("Login successful, access token:", accessToken, "sessionId:", sessionId);

        // 2️⃣ Save auth token (AsyncStorage / Context)
        login(accessToken);

        // 3️⃣ Register push token
        const pushToken = await registerForPushNotifications();

        // 4️⃣ Store push token against THIS session
        if (pushToken && sessionId) {
          await axiosInstance.post(
            "/auth/store-push-token",
            {
              sessionId,
              fcmToken: pushToken,
            },
            { withCredentials: true }
          );
        }
      } else {
        setError("Login failed");
      }
    } catch (err) {
      console.log("Login failed:", err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex items-center justify-center min-h-screen bg-gray-100">
      <View className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <Text className="text-2xl font-bold text-center mb-6">
          Welcome Back
        </Text>

        {error && (
          <Text className="text-red-500 text-sm text-center mb-4">
            {error}
          </Text>
        )}

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Work Email
          </Text>
          <TextInput
            value={workEmail}
            onChangeText={setWorkEmail}
            keyboardType="email-address"
            placeholder="you@company.com"
            autoCapitalize="none"
            className="w-full border border-b-stone-600 px-3 py-2 text-gray-800"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            autoCapitalize="none"
            className="w-full border border-b-stone-600 px-3 py-2 text-gray-800"
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`w-full bg-blue-600 rounded-lg py-3 items-center ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          <Text className="text-white font-semibold">
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
        </Text>
      </View>
    </View>
  );
}

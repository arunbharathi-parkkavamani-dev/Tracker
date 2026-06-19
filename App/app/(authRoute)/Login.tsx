import React, { useState, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight, Eye, EyeOff
} from "lucide-react-native";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { storeFCMToken } from "@/utils/fcmTokenManager";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function Login() {
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!workEmail.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      let deviceUUID = await AsyncStorage.getItem("device_uuid");
      if (!deviceUUID) {
        deviceUUID = "mobile_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem("device_uuid", deviceUUID);
      }

      const response = await axiosInstance.post(
        "/auth/login",
        { workEmail: workEmail.trim(), password, platform: "mobile", deviceUUID },
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.accessToken) {
        const { accessToken, sessionId } = response.data;
        await login(accessToken);
        await AsyncStorage.setItem("current_session_id", sessionId);
        await AsyncStorage.removeItem("fcm_token_stored");
        if (sessionId) {
          storeFCMToken(sessionId).catch(() => {});
        }
      } else {
        setError("Login failed");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Hero — pinned to top */}
        <LinearGradient
          colors={["#6C3DE8", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-16 pb-8 px-8 rounded-b-[32px]"
        >
          <View className="items-center mb-2">
            <View className="w-16 h-16 bg-white/10 rounded-2xl items-center justify-center mb-4 border border-white/10">
              <Text className="text-3xl font-bold text-white">W</Text>
            </View>
            <Text className="text-3xl font-bold text-white tracking-tight">WorkHub</Text>
            <Text className="text-fuchsia-100/80 text-sm mt-2 text-center leading-5">
              Your complete workplace management platform
            </Text>
          </View>
        </LinearGradient>

        {/* Login Form — centered in remaining space */}
        <View className="flex-1 justify-center px-6" style={{ marginTop: -16 }}>
          <View className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-800">
            {error && (
              <View className="bg-red-50 dark:bg-red-950/30 px-4 py-3 rounded-xl mb-5 border border-red-100 dark:border-red-900/50">
                <Text className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Work Email</Text>
              <TextInput
                value={workEmail}
                onChangeText={setWorkEmail}
                placeholder="you@company.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-base"
              />
            </View>

            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</Text>
              <View className="relative flex-row items-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white text-base pr-12"
                />
                <TouchableOpacity
                  className="absolute right-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-end mb-6">
              <Link href={"/forgot-password" as any} className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Forgot Password?
              </Link>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`w-full bg-blue-600 rounded-xl py-3.5 items-center flex-row justify-center ${loading ? "opacity-60" : ""}`}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-base">Sign In</Text>
                  <ArrowRight size={18} color="white" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center py-8">
          <Text className="text-xs text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} Portal
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

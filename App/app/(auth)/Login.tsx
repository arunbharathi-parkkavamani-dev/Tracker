import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import axiosInstance from "../../Api/axiosInstance.js";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "@/context/AuthContext.jsx";

const Login = () => {
  const [workEmail, setworkEmail] = useState("");
  const [password, setPassword] = useState("");
    const router = useRouter();
  const { setUser, setToken } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        workEmail,
        password,
      });
      const token = response.data.accessToken;
      console.log("Login successful, token:", token);

      if (token) {
        await AsyncStorage.setItem("auth_token", token);
        setToken(token); // Set token in context
        const data = response.data.user;
        setUser({ data }); // Set user context
        console.log("Token saved successfully");
        router.replace("/(protuctedRoute)/dashboard");
      } else {
        console.error("No token returned from server");
      }
    } catch (error) {
      console.error("Login failed",error);
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <Text className="text-3xl mb-6 text-center font-bold">Login</Text>
      <TextInput
        className="h-12 border border-gray-300 mb-4 px-3 rounded-lg"
        placeholder="workEmail"
        value={workEmail}
        onChangeText={setworkEmail}
        autoCapitalize="none"
      />
      <TextInput
        className="h-12 border border-gray-300 mb-4 px-3 rounded-lg"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default Login;

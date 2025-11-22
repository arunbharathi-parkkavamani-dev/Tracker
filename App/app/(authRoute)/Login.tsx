import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, TextInput  } from "react-native";
import { Link } from "expo-router";
import { AuthContext } from "@/context/AuthContext.js";
import axiosInstance from "../../api/axiosInstance.js"
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
    const [workEmail, setWorkEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const [error, setError] = useState("");


    const handleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axiosInstance.post(
                "/auth/login",
                { workEmail, password },
                { withCredentials: true }
            );

            if (response.status === 200 && response.data.accessToken) {
                const token = response.data.accessToken;

                // save token in async Storage 
                login(token);
            } else {
                setError("Login Failed")
            }
        } catch (err) {
            setError("Invalid email or password");
            console.log("Login failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex items-center justify-center min-h-screen bg-gray-100">
            <View className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
                <Text className="text-2xl font-bold text-center mb-6">Welcome Back</Text>

                {error && (
                    <Text className="text-red-500 text-sm text-center mb-4">{error}</Text>
                )}

                <View className="mb-4">
                    <Text className="block text-sm font-medium text-gray-700 mb-1">
                        Work Email
                    </Text>
                    <TextInput
                        value={workEmail}
                        onChangeText={setWorkEmail}
                        keyboardType="email-address"
                        placeholder="you@company.com"
                        autoCapitalize="none"
                        className="w-full border border-b-stone-600 px-3 py-2 focus:outline-none text-gray-800"
                    />
                </View>

                <View className="mb-6">
                    <Text className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="••••••••"
                        autoCapitalize="none"
                        className="w-full border border-b-stone-600 px-3 py-2 focus:outline-none text-gray-800"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    className={`w-full bg-blue-600 rounded-lg py-3 items-center
                                ${loading ? "opacity-50" : "opacity-100"}`}
                    activeOpacity={0.7}
                    >
                    <Text className="text-white font-semibold">
                        {loading ? "Logging in..." : "Login"}
                    </Text>
                    </TouchableOpacity>

                <Text className="text-center text-sm text-gray-600 mt-4">
                    Don’t have an account?{" "}
                    <Link href="/Login" asChild>
                        <Text className="text-blue-600 underline">
                            Sign up
                        </Text>
                    </Link>
                </Text>
            </View>
        </View>
    );
};

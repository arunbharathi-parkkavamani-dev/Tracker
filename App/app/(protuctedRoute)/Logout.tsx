// src/screens/LogoutScreen.tsx
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LogoutScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<{ reset: (options: { index: number; routes: { name: string }[] }) => void }>();

  const performLogout = async () => {
    try {
      await logout();
      // If you store tokens in AsyncStorage instead of cookies
      await AsyncStorage.removeItem("auth_token");
      // await AsyncStorage.removeItem("refresh_token");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    performLogout();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.text}>Logging out...</Text>
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 20 }}
        />
      </View>
    </View>
  );
};

export default LogoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111827",
  },
});

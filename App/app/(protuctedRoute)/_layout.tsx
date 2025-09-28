// app/(protectedRoute)/_layout.tsx
import { Drawer } from "expo-router/drawer";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./sidebar";
import TopNavbar from "@/components/ui/topnavbar";

export default function ProtectedLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/Login");
    }
  }, [loading, user]);
  // console.log("User in ProtectedLayout:", user);

  if (loading || !user) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <SafeAreaView style={{ flex: 1 }}>
        <Drawer
          screenOptions={{
            drawerActiveTintColor: colorScheme === "dark" ? "#fff" : "#000",
            header: (props) => (
              <TopNavbar navigation={props.navigation} userId={user.id} />
            ),
          }}
          drawerContent={() => <Sidebar />}
        >
          <Drawer.Screen name="dashboard" options={{ title: "Dashboard" }} />
        </Drawer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

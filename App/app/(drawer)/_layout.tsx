import { Drawer } from "expo-router/drawer";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colorScheme === "dark" ? "#fff" : "#000",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Drawer.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
      <Drawer.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
    </Drawer>
  );
}

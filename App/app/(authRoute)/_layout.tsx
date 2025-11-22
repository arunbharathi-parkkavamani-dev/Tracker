import { Stack, Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { user } = useContext(AuthContext);

  // If already logged in → prevent going to login/register
  if (user) return <Redirect href="/(protectedRoute)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" />
    </Stack>
  );
}

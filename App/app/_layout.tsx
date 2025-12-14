import "../global.css"
import { useEffect } from "react";
import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { registerForPushNotifications } from "@/utils/registerPushToken";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,   // sound
    shouldSetBadge: true,    // badge
    shouldShowBanner: true,  // banner notification
    shouldShowList: true,    // show in notification list
  }),
});

export default function RootLayout() {

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotifications();
      // ❌ do NOT send to backend yet
      // Just confirm it logs in console
    })();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <PaperProvider>
          <Toast />
          <Slot screenOptions={{ headerShown: false }} />
        </PaperProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
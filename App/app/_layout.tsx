import "../global.css"
import { useEffect } from "react";
import { Slot } from 'expo-router';
import { AppState } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { checkAndStoreFCMToken } from "@/utils/fcmTokenManager";
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
    // Check FCM token on app start
    checkAndStoreFCMToken();

    // Check FCM token when app becomes active
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndStoreFCMToken();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
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
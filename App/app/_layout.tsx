import "../global.css"
import { useEffect, useState, useRef } from "react";
import { Slot } from 'expo-router';
import { AppState, AppStateStatus, View } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { checkAndStoreFCMToken } from "@/utils/fcmTokenManager";
import * as Notifications from "expo-notifications";
import SplashScreen from "@/components/SplashScreen";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let splashShown = false;

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(!splashShown);

  useEffect(() => {
    checkAndStoreFCMToken();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAndStoreFCMToken();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleSplashFinish = () => {
    splashShown = true;
    setShowSplash(false);
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationProvider>
          <PaperProvider>
            <Toast />
            {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
            {!showSplash && <Slot screenOptions={{ headerShown: false }} />}
          </PaperProvider>
        </NavigationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

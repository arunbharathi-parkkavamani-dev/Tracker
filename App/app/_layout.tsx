import "../global.css"
import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function RootLayout() {
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

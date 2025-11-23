import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
      <Toast />
      <Slot />
      </PaperProvider>
    </AuthProvider>
  );
}

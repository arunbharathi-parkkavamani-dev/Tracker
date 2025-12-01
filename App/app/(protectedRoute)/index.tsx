import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ProtectedIndex() {
  useEffect(() => {
    // Redirect to dashboard as the main page
    router.replace('/(protectedRoute)/dashboard');
  }, []);

  return null; // This component won't render anything
}
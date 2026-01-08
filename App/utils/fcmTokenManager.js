import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "@/api/axiosInstance";
import { registerForPushNotifications } from "./registerPushToken";

export const storeFCMToken = async (sessionId, retryCount = 0) => {
  try {

    // Get or register for push token
    const pushToken = await registerForPushNotifications();

    if (!pushToken) {
      // console.log("❌ No FCM token available");
      return false;
    }

    if (!sessionId) {
      // console.log("❌ No session ID available");
      return false;
    }

    // Store FCM token
    await axiosInstance.post(
      "/auth/store-push-token",
      {
        sessionId,
        fcmToken: pushToken,
      },
      { withCredentials: true }
    );


    // Store success flag
    await AsyncStorage.setItem("fcm_token_stored", "true");
    await AsyncStorage.setItem("last_fcm_token", pushToken);

    return true;
  } catch (error) {
    console.error(`❌ Failed to store FCM token (attempt ${retryCount + 1}):`, error);

    // Retry up to 3 times with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s

      await new Promise(resolve => setTimeout(resolve, delay));
      return storeFCMToken(sessionId, retryCount + 1);
    }

    return false;
  }
};

export const checkAndStoreFCMToken = async () => {
  try {
    const isStored = await AsyncStorage.getItem("fcm_token_stored");
    const sessionId = await AsyncStorage.getItem("current_session_id");

    if (isStored === "true" || !sessionId) {
      return true;
    }

    return await storeFCMToken(sessionId);
  } catch (error) {
    console.error("❌ Error checking FCM token status:", error);
    return false;
  }
};
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

let authContextLogout = null;
let failedRequestCount = 0;
const MAX_FAILED_REQUESTS = 5;

export const setAuthLogout = (logoutFn) => {
  authContextLogout = logoutFn;
};

const resetFailedCount = () => {
  failedRequestCount = 0;
};

const incrementFailedCount = async () => {
  failedRequestCount++;
  
  if (failedRequestCount >= MAX_FAILED_REQUESTS) {
    await forceLogout();
  }
};

const forceLogout = async () => {
  try {
    await axios.post("http://10.167.107.208:3000/api/auth/logout", {}, {
      headers: {
        'x-device-uuid': await getDeviceUUID(),
        'Authorization': `Bearer ${await AsyncStorage.getItem("auth_token")}`
      }
    });
  } catch (error) {
    console.log("Logout API failed:", error);
  }
  
  await AsyncStorage.multiRemove(["auth_token", "refresh_token", "current_session_id", "fcm_token_stored"]);
  failedRequestCount = 0;
  
  if (authContextLogout) {
    authContextLogout();
  }
  
  try {
    router.replace("/(authRoute)/Login");
  } catch (routerError) {
    console.log("Router error:", routerError);
  }
};

const axiosInstance = axios.create({
  baseURL: "http://10.167.107.208:3000/api",
  timeout: 50000,
  withCredentials: true,
});

const getDeviceUUID = async () => {
  let uuid = await AsyncStorage.getItem('device_uuid');
  if (!uuid) {
    uuid = 'mobile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem('device_uuid', uuid);
  }
  return uuid;
};

// Enhanced request interceptor with optimized query support
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['x-device-uuid'] = await getDeviceUUID();
    
    // Handle FormData for file uploads
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (['post', 'put', 'patch'].includes(config.method?.toLowerCase()) && config.data) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    resetFailedCount();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errorData = error.response?.data;

    if (error.response?.status === 401 && errorData?.expired && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");
        
        const refreshResponse = await axios.post(
          "http://10.167.107.208:3000/api/auth/refresh",
          { refreshToken, platform: "mobile" },
          { headers: { 'x-device-uuid': await getDeviceUUID() } }
        );
        
        if (refreshResponse.data.accessToken) {
          await AsyncStorage.setItem("auth_token", refreshResponse.data.accessToken);
          resetFailedCount();
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await forceLogout();
        return Promise.reject(refreshError);
      }
    }
    
    if (error.response?.status === 401) {
      await forceLogout();
      return Promise.reject(error);
    }

    if (error.response?.status >= 400) {
      await incrementFailedCount();
    }

    return Promise.reject(error);
  }
);

export { getDeviceUUID };
export default axiosInstance;

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

let authContextLogout = null;

export const setAuthLogout = (logoutFn) => {
  authContextLogout = logoutFn;
};

const axiosInstance = axios.create({
  baseURL: "http://10.50.131.208:3000/api",
  timeout: 50000,
  withCredentials: true,
});

// Request interceptor - add token from AsyncStorage
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase()) && config.data) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for mobile token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorData = error.response?.data;

    // Handle token expiration with automatic refresh
    if (error.response?.status === 401 && errorData?.expired && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");
        
        const refreshResponse = await axios.post(
          "http://10.50.131.208:3000/api/auth/refresh",
          { refreshToken, platform: "mobile" }
        );
        
        // Update tokens in AsyncStorage
        if (refreshResponse.data.accessToken) {
          await AsyncStorage.setItem("auth_token", refreshResponse.data.accessToken);
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.multiRemove(["auth_token", "refresh_token"]);
        
        // Navigate to login (implement navigation as needed)
        console.log("Session expired - redirect to login");
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle any 401 error - logout and redirect
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["auth_token", "refresh_token"]);
      
      // Use auth context logout if available
      if (authContextLogout) {
        authContextLogout();
      }
      
      // Redirect to login
      try {
        router.replace("/(authRoute)/Login");
      } catch (routerError) {
        console.log("Router error:", routerError);
      }
      
      console.log("Unauthorized - redirect to login");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

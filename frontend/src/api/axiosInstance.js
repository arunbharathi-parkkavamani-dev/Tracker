import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "https://tracker-mxp9.onrender.com/api",
  timeout: 100000,
  withCredentials: true,
});

// Request interceptor - avoid custom headers to prevent preflight
axiosInstance.interceptors.request.use(
  (config) => {
    // Only set Content-Type for POST/PUT/PATCH with body
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase()) && config.data) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token automatically
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorData = error.response?.data;

    // Handle token expiration with automatic refresh
    if (error.response?.status === 401 && errorData?.expired && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await axios.post(
          "https://tracker-mxp9.onrender.com/api/auth/refresh",
          {}, // Empty body for web (uses cookies)
          { withCredentials: true }
        );
        
        // Update token in cookie for web
        if (refreshResponse.data.accessToken) {
          Cookies.set("auth_token", refreshResponse.data.accessToken);
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        Cookies.remove("auth_token");
        Cookies.remove("refresh_token");
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other 401 errors (invalid token, no token)
    if (error.response?.status === 401 && errorData?.action === "login") {
      Cookies.remove("auth_token");
      Cookies.remove("refresh_token");
      
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
)

export default axiosInstance;
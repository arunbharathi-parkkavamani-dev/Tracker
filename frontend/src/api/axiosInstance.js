import axios from "axios";
import Cookies from "js-cookie";

let authContextLogout = null;

export const setAuthLogout = (logoutFn) => {
  authContextLogout = logoutFn;
};

const axiosInstance = axios.create({
  baseURL: "http://192.168.29.83:3000/api",
  timeout: 100000,
  withCredentials: true,
});

// Request interceptor - add auth token and content-type
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token from cookies or localStorage
    let token = Cookies.get('auth_token');
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type for POST/PUT/PATCH with body (but not for FormData)
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase()) && config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and logout
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorData = error.response?.data;

    // Handle any 401 response - clear cookies and redirect
    if (error.response?.status === 401) {
      // Try refresh only once if token is expired
      if (errorData?.expired && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshResponse = await axios.post(
            "http://192.168.29.83/api/auth/refresh",
            {},
            { withCredentials: true }
          );
          
          if (refreshResponse.data.accessToken) {
            Cookies.set("auth_token", refreshResponse.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - proceed to logout
        }
      }
      
      // Use auth context logout if available, otherwise fallback
      if (authContextLogout) {
        authContextLogout();
      } else {
        Cookies.remove("auth_token");
        Cookies.remove("refresh_token");
        if (typeof window !== 'undefined') {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
)

export default axiosInstance;
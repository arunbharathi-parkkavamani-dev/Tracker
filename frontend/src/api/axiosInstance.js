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

    // Token expired -> try refresh once
    if(error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.get("https://tracker-mxp9.onrender.com/api/auth/refresh", {
          withCredentials: true,
        });
        return axiosInstance(originalRequest);
      // eslint-disable-next-line no-unused-vars
      } catch (refreshError) {
        Cookies.remove("auth_token");
        Cookies.remove("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
)

export default axiosInstance;
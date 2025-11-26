import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "https://tracker-mxp9.onrender.com/api",
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor to refresh token automatically
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expired -> try refresh once
    if(error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true
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
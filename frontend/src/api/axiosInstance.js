import axios from "axios";
import Cookies from "js-cookie";

let authContextLogout = null;
let failedRequestCount = 0;
const MAX_FAILED_REQUESTS = 5;

const baseUrl = "http://192.168.29.71:3000"

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
  // Temporarily disabled force logout
  console.log('Force logout disabled temporarily');
  return;
  
  try {
    // Call logout API
    await axios.post(`${baseUrl}/api/auth/logout`, {}, {
      headers: {
        'x-device-uuid': getDeviceUUID(),
        'Authorization': `Bearer ${Cookies.get('auth_token') || localStorage.getItem('auth_token')}`
      },
      withCredentials: true
    });
  } catch (error) {
    console.log("Logout API failed:", error);
  }
  
  // Clear cookies and localStorage
  Cookies.remove("auth_token");
  Cookies.remove("refresh_token");
  localStorage.removeItem('auth_token');
  
  // Reset counter
  failedRequestCount = 0;
  
  // Call auth context logout
  if (authContextLogout) {
    authContextLogout();
  } else if (typeof window !== 'undefined') {
    window.location.href = "/login";
  }
};

const axiosInstance = axios.create({
  baseURL: `${baseUrl}/api`,
  timeout: 100000,
  withCredentials: true,
});

// Generate or get device UUID
const getDeviceUUID = () => {
  let uuid = localStorage.getItem('device_uuid');
  if (!uuid) {
    uuid = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_uuid', uuid);
  }
  return uuid;
};

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
    
    // Add device UUID to all requests
    config.headers['x-device-uuid'] = getDeviceUUID();
    
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
  (response) => {
    // Reset failed count on successful response
    resetFailedCount();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errorData = error.response?.data;

    // Handle any 401 response - clear cookies and redirect
    if (error.response?.status === 401) {
      // Temporarily disabled 401 handling
      console.log('401 handling disabled temporarily');
      return Promise.reject(error);
      
      // Try refresh only once if token is expired
      if (errorData?.expired && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshResponse = await axios.post(
            `${baseUrl}/api/auth/refresh`,
            {},
            { 
              withCredentials: true,
              headers: { 'x-device-uuid': getDeviceUUID() }
            }
          );
          
          if (refreshResponse.data.accessToken) {
            Cookies.set("auth_token", refreshResponse.data.accessToken);
            localStorage.setItem('auth_token', refreshResponse.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            resetFailedCount(); // Reset on successful refresh
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - proceed to logout
        }
      }
      
      await forceLogout();
      return Promise.reject(error);
    }

    // Track failed requests (4xx, 5xx errors)
    if (error.response?.status >= 400) {
      // Temporarily disabled failed request tracking
      // await incrementFailedCount();
    }

    return Promise.reject(error);
  }
)

export { getDeviceUUID };
export default axiosInstance;
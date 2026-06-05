import { useAuth } from "../context/authProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosInstance, { getDeviceUUID } from "../api/axiosInstance";

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const performLogout = async () => {
    try {
      // Call logout API with current device UUID before clearing
      const deviceUuid = localStorage.getItem('device_uuid');
      await axiosInstance.post("/auth/logout", {}, {
        headers: {
          'x-device-uuid': deviceUuid
        }
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear all auth data and device_uuid
      Cookies.remove("auth_token");
      Cookies.remove("refresh_token");
      localStorage.clear(); // Clear entire localStorage to ensure device_uuid is removed
      localStorage.removeItem('auth_token');
      localStorage.removeItem('device_uuid');
      localStorage.removeItem('refresh_token');
      
      // Verify device_uuid is cleared
      if (localStorage.getItem('device_uuid')) {
        console.warn('device_uuid still exists after clear, forcing removal');
        Object.keys(localStorage).forEach(key => {
          if (key.includes('device') || key.includes('uuid')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Clear context and redirect
      await logout();
      
      // Small delay to ensure storage operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate("/login");
    }
  };
  useEffect(() => {
    performLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Logging out...</h1>
      </div>
    </div>
  );
};

export default LogoutPage;

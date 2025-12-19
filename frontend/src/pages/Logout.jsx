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
      // Call logout API
      await axiosInstance.post("/auth/logout", {}, {
        headers: {
          'x-device-uuid': getDeviceUUID()
        }
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }
    
    // Clear local storage and context
    await logout();
    Cookies.remove("auth_token");
    Cookies.remove("refresh_token");
    localStorage.removeItem('auth_token');
    navigate("/login");
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

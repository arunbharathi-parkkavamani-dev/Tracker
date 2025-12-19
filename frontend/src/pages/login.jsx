import axiosInstance, { getDeviceUUID } from "../api/axiosInstance";
import { useState } from "react";
import { useAuth } from "../context/authProvider.jsx";
import {jwtDecode} from "jwt-decode";
import { useNavigate } from "react-router-dom";
import LMXLogo from "../assets/LMX_Logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post(
        "/auth/login",
        { workEmail, password, platform: "web", deviceUUID: getDeviceUUID() }
      );

      if (response.status === 200 && response.data.accessToken) {
        const decoded = jwtDecode(response.data.accessToken);
        
        localStorage.setItem('auth_token', response.data.accessToken);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        
        setUser(decoded);
        navigate("/dashboard");
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center shadow-lg">
      <div className="bg-gray-50 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LMXLogo} alt="LMX Logo" className="h-16 mx-auto mb-4" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
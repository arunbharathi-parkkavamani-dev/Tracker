import axiosInstance from "../api/axiosInstance";
import { useState } from "react";
import { useAuth } from "../context/authProvider";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
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
      { workEmail, password },
      { withCredentials: true }
    );

    if (response.status === 200) {
      console.log("Login successful:", response.data);

      // If backend sends token in response
      if (response.data.token) {
        const decoded = jwtDecode(response.data.token);
        setUser(decoded); // updates context immediately
      }

      // If backend uses cookies only, you can still call:
      setUser(jwtDecode(Cookies.get("auth_token")));

      // navigate now that context is updated
      navigate("/dashboard");
    } else {
      setError("Login failed");
    }
  } catch (err) {
    setError("Invalid email or password");
    console.error("Login failed:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
        
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Email
          </label>
          <input
            type="email"
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full border border-b-stone-600 px-3 py-2 focus:outline-none text-gray-800 dark:text-black"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-b-stone-600 px-3 py-2 focus:outline-none text-gray-800 dark:text-black"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {user && (
          <p className="text-green-500 text-sm text-center mt-4">
            Login successful! Redirecting...
          </p>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;

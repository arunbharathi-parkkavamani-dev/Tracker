/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";
import { setAuthLogout } from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // decoded user payload
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = Cookies.get("auth_token");
    if (!token) {
      token = localStorage.getItem("auth_token");
    }
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        Cookies.remove("auth_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("refresh_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  useEffect(() => {
    setAuthLogout(logout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming auth context
export const useAuth = () => useContext(AuthContext);

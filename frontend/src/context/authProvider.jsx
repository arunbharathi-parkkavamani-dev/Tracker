/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // decoded user payload
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("auth_token"); // read the cookie
    console.log("Auth check - Token found:", !!token);
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", { exp: decoded.exp, role: decoded.role, platform: decoded.platform });
        
        // Check if token is expired (with 30 second buffer for time differences)
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = decoded.exp - currentTime;
        
        console.log("Token expiry check:", { 
          currentTime, 
          tokenExp: decoded.exp, 
          timeUntilExpiry: Math.round(timeUntilExpiry),
          isExpired: timeUntilExpiry < -30 // 30 second buffer
        });
        
        if (decoded.exp && timeUntilExpiry < -30) {
          console.log("Token expired, clearing auth");
          Cookies.remove("auth_token");
          Cookies.remove("refresh_token");
          setUser(null);
        } else {
          console.log("Token valid, setting user");
          setUser(decoded);
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
        setUser(null);
        Cookies.remove("auth_token");
        Cookies.remove("refresh_token");
      }
    } else {
      console.log("No token found");
    }
    setLoading(false);
  }, []);

  const logout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming auth context
export const useAuth = () => useContext(AuthContext);

// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // decoded user payload
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("auth_token") || Cookies.get("refresh_token");
    console.log("Token from cookie:", token);  // 🔍 check if token exists

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded payload:", decoded); // 🔍 check payload shape
        setUser(decoded);
      } catch (err) {
        console.error("Failed to decode token:", err);
        setUser(null);
      }
    } else {
      console.log("No token found in cookies");
      setUser(null);
    }

    setLoading(false);
  }, []);


  const logout = () => {
    Cookies.remove("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

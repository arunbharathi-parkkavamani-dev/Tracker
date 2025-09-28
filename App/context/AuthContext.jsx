import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseJwt = (token) => {
    try {
      const base64Payload = token.split(".")[1];
      const jsonPayload = atob(base64Payload); // ✅ decode base64
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Failed to parse token", err);
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          const decoded = parseJwt(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setUser(decoded);
          } else {
            setUser(null);
            await AsyncStorage.removeItem("auth_token");
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load token:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (token) => {
    try {
      await AsyncStorage.setItem("auth_token", token);
      const decoded = parseJwt(token);
      setUser(decoded);
      console.log("User logged in:", decoded);
      
    } catch (err) {
      console.error("Failed to save token:", err);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
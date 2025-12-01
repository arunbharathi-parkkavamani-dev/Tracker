import React, { createContext, useState, useEffect, Children} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {jwtDecode} from "jwt-decode";
import { setAuthLogout } from "@/api/axiosInstance";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadToken = async () => {
        try {
            const token = await AsyncStorage.getItem("auth_token");

            if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (error) {
                console.log("JWT decode error:", error);
                setUser(null);
                await AsyncStorage.removeItem("auth_token");
            }
            }
        } finally {
            setLoading(false);
        }
        };

        loadToken();
    }, []);

    const login = async (token, refreshToken = null) => {
        await AsyncStorage.setItem("auth_token", token);
        if (refreshToken) {
            await AsyncStorage.setItem("refresh_token", refreshToken);
        }
        const decoded = jwtDecode(token);
        setUser(decoded);
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(["auth_token", "refresh_token"]);
        setUser(null);
    };

    // Register logout function with axios
    useEffect(() => {
        setAuthLogout(logout);
    }, []);

    return(
        <AuthContext.Provider value={{user, loading, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}
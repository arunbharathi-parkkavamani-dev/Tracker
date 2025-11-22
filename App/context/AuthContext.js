import React, { createContext, useState, useEffect, Children} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {jwtDecode} from "jwt-decode";


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

    const login = async (token) => {
        await AsyncStorage.setItem("auth_token", token);
        const decoded = jwtDecode(token);
        setUser(decoded);
    };

    const logout = async () => {
        await AsyncStorage.removeItem("auth_token");
        setUser(null);
    };

    return(
        <AuthContext.Provider value={{user, loading, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}
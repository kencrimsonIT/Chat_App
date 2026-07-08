import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load auth data from sessionStorage on mount
    useEffect(() => {
        try {
            const accessToken = sessionStorage.getItem("accessToken");
            const refreshToken = sessionStorage.getItem("refreshToken");
            const userId = sessionStorage.getItem("userId");
            const username = sessionStorage.getItem("username");
            const email = sessionStorage.getItem("email");
            const rolesRaw = sessionStorage.getItem("roles");

            if (accessToken && userId) {
                setTokens({
                    accessToken,
                    refreshToken,
                });
                setUser({
                    userId,
                    username,
                    email,
                    roles: rolesRaw ? JSON.parse(rolesRaw) : [],
                });
            }
        } catch (err) {
            console.error("Failed to load auth from sessionStorage:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback((data) => {
        const { accessToken, refreshToken, userId, username, email, roles } = data;

        // Save to sessionStorage (per-tab)
        sessionStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("refreshToken", refreshToken);
        sessionStorage.setItem("userId", userId);
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("roles", JSON.stringify(roles));

        // Update state
        setTokens({ accessToken, refreshToken });
        setUser({ userId, username, email, roles });
    }, []);

    const logout = useCallback(() => {
        // Clear sessionStorage
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("roles");

        // Clear state
        setTokens(null);
        setUser(null);
    }, []);

    const isAuthenticated = !!user && !!tokens;

    const value = {
        user,
        tokens,
        loading,
        isAuthenticated,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;

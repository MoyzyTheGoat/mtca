import React, { createContext, useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    });

    // keep user stored across refreshes
    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    // Register user
    const register = async (username, password, is_admin = false) => {
        try {
            const payload = { username, password, is_admin };
            const res = await api.post("/register", payload);
            return res.data;
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Registration failed";
            alert("Register failed: " + message);
            throw error;
        }
    };

    // Login user
    const login = async (username, password) => {
        try {
            // Backend uses OAuth2PasswordRequestForm, so send as form-encoded
            const params = new URLSearchParams();
            params.append("username", username);
            params.append("password", password);

            const res = await api.post("/login", params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const { access_token, refresh_token } = res.data;

            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            setUser({ username });
            navigate("/"); // redirect after successful login
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Login failed";
            alert("Login failed: " + message);
            throw error;
        }
    };

    // Logout user
    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ user, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

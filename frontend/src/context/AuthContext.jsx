// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("access_token") || null);

    useEffect(() => {
        if (token) {
            setUser({ username: "User" }); // placeholder; could decode JWT if needed
        } else {
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error("Invalid credentials");

        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        setToken(data.access_token);
    };

    const register = async (email, password) => {
        const res = await fetch("http://127.0.0.1:8000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error("Registration failed");
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handle = async (e) => {
        e.preventDefault();

        try {
            // Backend uses OAuth2PasswordRequestForm, so use form-encoded body
            const params = new URLSearchParams();
            params.append("username", username);
            params.append("password", password);

            const res = await api.post("/login", params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const { access_token, refresh_token } = res.data;
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            alert("Admin logged in successfully!");
            navigate("/admin");
        } catch (err) {
            console.error("Login error:", err);
            const message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                "Login failed";
            alert("Login failed: " + message);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4 text-center">Admin Login</h2>
            <form onSubmit={handle} className="space-y-3">
                <input
                    required
                    className="w-full p-2 border rounded"
                    placeholder="Admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    required
                    type="password"
                    className="w-full p-2 border rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Login
                    </button>
                </div>
            </form>
        </div>
    );
}

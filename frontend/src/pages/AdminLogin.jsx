import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const handle = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const params = new URLSearchParams();
            params.append("username", username);
            params.append("password", password);

            const res = await api.post("/login", params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const { access_token, refresh_token } = res.data;
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            alert("Admin logged in");
            navigate("/admin");
        } catch (err) {
            const message = err.response?.data?.detail || err.message || "Login failed";
            alert("Login failed: " + message);
            console.error(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Admin Login</h2>
            <form onSubmit={handle} className="space-y-3">
                <input required className="w-full p-2 border rounded" placeholder="Admin username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input required type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="flex justify-end">
                    <button disabled={busy} className="px-4 py-2 bg-brand-500 text-white rounded">{busy ? "Logging..." : "Login"}</button>
                </div>
            </form>
        </div>
    );
}

import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handle = async (e) => {
        e.preventDefault();
        try {
            await register(username, password, false);
            alert("Registered — now login");
            navigate("/login");
        } catch (err) {
            console.error(err);
            alert("Registration failed: " + (err?.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Register</h2>
            <form onSubmit={handle} className="space-y-3">
                <input required className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                <input required type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <div className="flex justify-end">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded">Register</button>
                </div>
            </form>
        </div>
    );
}

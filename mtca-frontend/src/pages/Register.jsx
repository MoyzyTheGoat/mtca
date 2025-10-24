import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const handle = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await register(username, password, false);
            alert("Registered — please login");
            navigate("/login");
        } catch (err) {
            alert("Registration failed: " + (err.message || err));
            console.error(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Register</h2>
            <form onSubmit={handle} className="space-y-3">
                <input required className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input required type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="flex justify-end">
                    <button disabled={busy} className="px-4 py-2 bg-brand-500 text-white rounded">{busy ? "Registering..." : "Register"}</button>
                </div>
            </form>
        </div>
    );
}

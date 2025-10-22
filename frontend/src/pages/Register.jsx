// src/pages/Register.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(username, password);
            navigate("/products");
        } catch (err) {
            alert(err.message || "Registration failed");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-white">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/50 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-96 border border-white/30"
            >
                <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">
                    Create Account
                </h2>
                <p className="text-gray-500 text-center mb-6">
                    Join the supermarket experience 🚀
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <motion.button
                        type="submit"
                        whileTap={{ scale: 0.95 }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-all shadow-md"
                    >
                        Register
                    </motion.button>
                </form>

                <p className="text-sm text-gray-600 mt-4 text-center">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="text-indigo-600 hover:underline font-medium"
                    >
                        Login
                    </a>
                </p>
            </motion.div>
        </div>
    );
}

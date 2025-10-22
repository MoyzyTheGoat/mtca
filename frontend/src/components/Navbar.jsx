import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api";

export default function Navbar() {
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <nav className="bg-white shadow-sm">
            <div className="app-container flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-xl font-bold" style={{ color: "var(--accent)" }}>Queue Reducer</Link>
                    <Link to="/products" className="text-sm text-gray-600">Products</Link>
                    <Link to="/admin" className="text-sm text-gray-600">Admin</Link>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate("/checkout")} className="px-3 py-1 rounded-md border">Cart</button>
                    <button onClick={handleLogout} className="px-3 py-1 rounded-md bg-red-50 text-red-700">Logout</button>
                </div>
            </div>
        </nav>
    );
}

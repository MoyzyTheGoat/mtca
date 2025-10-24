import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <header className="bg-white/80 sticky top-0 backdrop-blur z-40 border-b">
            <div className="container flex items-center justify-between py-4">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold shadow">
                        Q
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-gray-800">QueueReducer</div>
                        <div className="text-xs text-gray-500">Fast supermarket pickups</div>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/" className="text-gray-700 hover:text-brand-700">Products</Link>
                    <Link to="/cart" className="text-gray-700 hover:text-brand-700">Cart</Link>

                    {!user ? (
                        <>
                            <Link to="/login" className="px-3 py-1 rounded bg-brand-500 text-white">Login</Link>
                            <Link to="/register" className="px-3 py-1 rounded border border-gray-200">Register</Link>
                        </>
                    ) : (
                        <>
                            <span className="px-2 py-1 text-sm bg-indigo-50 rounded">Hi, {user.username}</span>
                            <button onClick={logout} className="px-3 py-1 rounded border">Logout</button>
                        </>
                    )}

                    <Link to="/admin/login" className="text-sm text-gray-500 hover:text-brand-600">Admin</Link>
                </div>
            </div>
        </header>
    );
}

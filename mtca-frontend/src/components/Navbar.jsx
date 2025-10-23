import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="font-bold text-xl text-indigo-700">QueueReducer</Link>

                <div className="flex items-center gap-4">
                    <Link to="/" className="hover:underline">Products</Link>
                    <Link to="/cart" className="hover:underline">Cart</Link>

                    {!user ? (
                        <>
                            <Link to="/login" className="px-3 py-1 rounded bg-indigo-600 text-white">Login</Link>
                            <Link to="/register" className="px-3 py-1 rounded border border-indigo-600">Register</Link>
                        </>
                    ) : (
                        <>
                            <span className="px-2 py-1 text-sm bg-indigo-50 rounded">Hi, {user.username}</span>
                            <button onClick={logout} className="px-3 py-1 rounded border">Logout</button>
                        </>
                    )}

                    <Link to="/admin/login" className="ml-3 text-xs text-gray-500">Admin</Link>
                </div>
            </div>
        </nav>
    );
}

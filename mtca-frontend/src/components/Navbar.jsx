import React from "react";
import { Link } from "react-router-dom";

function CartIcon({ className = "w-5 h-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1" fill="currentColor" />
            <circle cx="18" cy="20" r="1" fill="currentColor" />
        </svg>
    );
}

export default function Navbar() {
    return (
        <header className="bg-white/70 sticky top-0 backdrop-blur z-40 border-b">
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
                    <div className="relative hidden md:block">
                        <input placeholder="Search products..." className="input w-64 pl-3 pr-10" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                            🔎
                        </div>
                    </div>

                    <Link to="/cart" className="flex items-center gap-2">
                        <div className="relative">
                            <CartIcon className="w-5 h-5 text-gray-700" />
                            <div className="absolute -top-2 -right-2 bg-accent text-xs px-1.5 rounded-full text-white shadow">3</div>
                        </div>
                        <span className="hidden md:inline text-gray-700">Cart</span>
                    </Link>

                    <Link to="/admin/login" className="text-sm text-gray-500 hover:text-brand-600">Admin</Link>
                </div>
            </div>
        </header>
    );
}

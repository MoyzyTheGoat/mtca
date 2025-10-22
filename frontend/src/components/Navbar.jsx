import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
export default function Navbar() {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);



    const { token, logout } = useContext(AuthContext);

    const navItems = [
        { name: "Home", to: "/" },
        { name: "Products", to: "/products" },
        { name: "Orders", to: "/orders" },
        ...(token ? [{ name: "Admin", to: "/admin" }] : []),
        ...(token
            ? [{ name: "Logout", to: "#", action: logout }]
            : [
                { name: "Login", to: "/login" },
                { name: "Register", to: "/register" },
            ]),
    ];


    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 
                 bg-white/30 backdrop-blur-xl shadow-lg
                 border border-white/20 rounded-full 
                 px-6 py-3 flex items-center justify-between 
                 w-[90%] max-w-4xl"
        >
            <h1 className="text-2xl font-bold text-indigo-700">Supermarket</h1>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/40 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            <ul
                className={`${isOpen ? "block" : "hidden"
                    } md:flex absolute md:static top-16 left-0 md:top-0 
        w-full md:w-auto bg-white/40 md:bg-transparent 
        backdrop-blur-xl md:backdrop-blur-0 border md:border-0 
        border-white/20 md:border-none rounded-2xl md:rounded-none 
        py-4 md:py-0`}
            >
                {navItems.map(({ name, to, action }) => (
                    <li key={name} className="md:ml-6 text-center">
                        {action ? (
                            <button
                                onClick={() => {
                                    action();
                                    setIsOpen(false);
                                }}
                                className={`block md:inline px-4 py-2 rounded-full text-lg transition-all duration-300 ${pathname === to
                                    ? "text-indigo-700 bg-white/50 shadow-sm"
                                    : "text-gray-700 hover:text-indigo-700 hover:bg-white/30"
                                    }`}
                            >
                                {name}
                            </button>
                        ) : (
                            <Link
                                to={to}
                                className={`block md:inline px-4 py-2 rounded-full text-lg transition-all duration-300 ${pathname === to
                                    ? "text-indigo-700 bg-white/50 shadow-sm"
                                    : "text-gray-700 hover:text-indigo-700 hover:bg-white/30"
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {name}
                            </Link>
                        )}
                    </li>
                ))}

            </ul>
        </motion.nav>
    );
}

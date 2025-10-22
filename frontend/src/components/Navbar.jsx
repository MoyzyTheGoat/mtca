import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
        { name: "Orders", path: "/orders" },
        { name: "Admin", path: "/admin" },
    ];

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="sticky top-0 bg-indigo-600 text-white shadow-lg z-50"
        >
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                <motion.h1
                    className="text-2xl font-bold tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    MTCA Market
                </motion.h1>

                <ul className="flex space-x-8">
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <Link
                                to={item.path}
                                className={`${location.pathname === item.path
                                        ? "border-b-2 border-white text-white"
                                        : "text-indigo-100 hover:text-white"
                                    } font-medium transition-colors duration-200`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.nav>
    );
};

export default Navbar;

import React, { useEffect, useState } from "react";
import { getProducts } from "../api";
import ProductCard from "../components/ProductCard";
import { motion } from "framer-motion";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});

    useEffect(() => {
        getProducts().then(setProducts).catch(console.error);
    }, []);

    // ✅ Handle "Add to Cart" button click
    function handleAdd(product, qty) {
        setCart((c) => {
            const prev = c[product.id]?.qty || 0;
            return { ...c, [product.id]: { product, qty: prev + qty } };
        });

        // Toast-like notification
        const toast = document.createElement("div");
        toast.innerText = `${product.name} x${qty} added to cart`;
        toast.className =
            "fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    return (
        <motion.div
            className="max-w-6xl mx-auto px-4 py-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.h1
                className="text-3xl font-bold text-gray-800 mb-8 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                🛒 Explore Our Products
            </motion.h1>

            {/* 🔹 Product Grid */}
            <motion.div
                layout
                className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
                {products.map((p, index) => (
                    <motion.div
                        key={p.id}
                        className="overflow-hidden rounded-2xl" // prevents overflow
                        whileHover={{ scale: 1.02 }} // subtle scale
                        transition={{ duration: 0.3 }}
                    >
                        <ProductCard product={p} onAdd={handleAdd} />
                    </motion.div>
                ))}
            </motion.div>

            {/* 🔹 Cart Preview */}
            <motion.div
                className="mt-12 p-6 bg-white rounded-xl shadow-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 flex items-center">
                    <span className="mr-2">🧺</span> Cart Preview
                </h2>

                {Object.values(cart).length === 0 ? (
                    <p className="text-gray-500">No items yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {Object.values(cart).map((line) => (
                            <motion.li
                                key={line.product.id}
                                className="py-2 flex justify-between text-gray-700"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <span>{line.product.name}</span>
                                <span className="font-semibold text-indigo-600">
                                    x{line.qty}
                                </span>
                            </motion.li>
                        ))}
                    </ul>
                )}

                <div className="mt-6 text-center">
                    <a
                        href="/orders"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-transform duration-300 hover:scale-105"
                    >
                        Go to Checkout
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
}

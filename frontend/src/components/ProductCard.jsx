// src/components/ProductCard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

// Backend URL
const BACKEND_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function ProductCard({ product }) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    const updateQty = (delta) => {
        setQuantity((q) => Math.max(1, Math.min(product.quantity, q + delta)));
    };

    const addToCart = () => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        const existing = cart.find((item) => item.product_id === product.id);
        if (existing) {
            existing.quantity = Math.min(product.quantity, existing.quantity + quantity);
        } else {
            cart.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity,
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    // Determine image URL
    const imageSrc = product.image_url
        ? `${BACKEND_URL}/${product.image_url.replace(/^\/+/, "")}`
        : "/placeholder.png";



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
        >
            <div className="relative">
                <img
                    src={imageSrc}
                    alt={product.name}
                    className="h-48 w-full object-cover"
                />


                <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                    ₦{product.price}
                </span>
            </div>

            <div className="p-4 flex flex-col justify-between h-52">
                <div>
                    <h2 className="font-semibold text-lg text-gray-800">{product.name}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => updateQty(-1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700"
                        >
                            −
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                        <button
                            onClick={() => updateQty(1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700"
                        >
                            +
                        </button>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={addToCart}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold text-white ${added ? "bg-green-500" : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
                            } transition-all`}
                    >
                        {added ? "Added!" : "Add to Cart"}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

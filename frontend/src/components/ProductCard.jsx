import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus } from "lucide-react";

export default function ProductCard({ product, onAdd }) {
    const [qty, setQty] = useState(1);

    return (
        <div className="bg-white rounded-2xl shadow-soft-xl border border-gray-100 overflow-hidden relative">
            {/* Image Container */}
            <div className="h-48 bg-gray-50 flex justify-center items-center overflow-hidden">
                <motion.img
                    src={product.image_url || "https://via.placeholder.com/400x300?text=No+Image"}
                    alt={product.name}
                    className="object-cover h-full w-full transition-transform duration-500"
                    whileHover={{ scale: 1.05 }} // Only image zooms
                />
            </div>

            {/* Card Content */}
            <div className="p-4 flex flex-col h-48">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {product.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {product.description || "No description provided"}
                </p>
                <p className="text-primary text-lg font-bold mt-auto">₦{product.price}</p>

                {/* Quantity + Add to Cart */}
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="font-medium">{qty}</span>
                        <button
                            onClick={() => setQty((q) => q + 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onAdd(product, qty)}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow"
                    >
                        <ShoppingCart size={16} /> Add
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

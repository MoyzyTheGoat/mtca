import React from "react";
import { motion } from "framer-motion";

export default function ProductCard({ product, onAdd }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="card p-4 rounded-xl shadow-sm hover:shadow-lg transition-shadow"
            style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
            <div className="flex gap-4">
                <div className="w-28 h-20 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-white font-semibold animate-float">
                    {/* placeholder - replace with image URL if available */}
                    <span className="text-sm">{product.name?.slice(0, 1)}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-800 font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">In stock: <span className="font-medium">{product.quantity}</span></p>
                    <div className="mt-2 text-brand-600 font-bold">₦{Number(product.price).toFixed(2)}</div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
                <button
                    onClick={() => {
                        onAdd(product);
                    }}
                    className="btn btn-primary flex-1"
                >
                    Add to cart
                </button>

                <button
                    onClick={() => alert(`Quick view - ${product.name}`)}
                    className="btn btn-ghost px-3 py-2"
                    aria-label="Quick view"
                >
                    View
                </button>
            </div>
        </motion.div>
    );
}

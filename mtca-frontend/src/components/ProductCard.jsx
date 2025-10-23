import React from "react";

export default function ProductCard({ product, onAdd }) {
    return (
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="mt-2 text-gray-600">₦{product.price?.toFixed(2)}</p>
                <p className="mt-1 text-sm text-gray-400">In stock: {product.quantity}</p>
            </div>
            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => onAdd(product)}
                    className="w-full px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
                    disabled={product.quantity <= 0}
                >
                    Add to cart
                </button>
            </div>
        </div>
    );
}

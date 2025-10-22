import React, { useState } from "react";

export default function ProductCard({ product, onAdd }) {
    // quantity for this product before adding to cart
    const [qty, setQty] = useState(1);

    return (
        <div className="border rounded p-4 flex flex-col gap-2">
            <div className="font-semibold">{product.name}</div>
            <div className="text-sm text-gray-600">Price: ₦{product.price}</div>
            <div className="text-sm text-gray-600">In stock: {product.quantity}</div>

            <div className="mt-auto flex items-center gap-2">
                <input
                    type="number"
                    min="1"
                    max={product.quantity || 9999}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-20 p-1 border rounded"
                />
                <button
                    onClick={() => onAdd(product, qty)}
                    className="px-3 py-1 rounded bg-indigo-600 text-white"
                >
                    Add
                </button>
            </div>
        </div>
    );
}

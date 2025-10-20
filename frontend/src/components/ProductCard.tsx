import React from "react";

interface ProductCardProps {
    name: string;
    price: number;
    quantity: number;
}

export default function ProductCard({ name, price, quantity }: ProductCardProps) {
    return (
        <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-gray-600">${price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Qty: {quantity}</p>
        </div>
    );
}

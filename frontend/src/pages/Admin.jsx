import React, { useState } from "react";
import { getOrderByCode } from "../api";

export default function Admin() {
    const [code, setCode] = useState("");
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");

    async function fetchOrder(e) {
        e.preventDefault();
        setError("");
        try {
            const res = await getOrderByCode(code);
            setOrder(res);
        } catch (err) {
            setError(err.message || "Not found");
            setOrder(null);
        }
    }

    return (
        <div>
            <h1 className="text-2xl mb-4">Admin: retrieve order by code</h1>
            <form onSubmit={fetchOrder} className="flex gap-2">
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-char code (e.g. X7P9QZ)"
                    maxLength={6}
                    className="border p-2 rounded"
                />
                <button className="px-3 py-1 rounded bg-indigo-600 text-white">Lookup</button>
            </form>

            {error && <div className="mt-3 text-red-600">{error}</div>}

            {order && (
                <div className="mt-4 p-3 border rounded">
                    <div><strong>Order ID:</strong> {order.id}</div>
                    <div><strong>Code:</strong> {order.code}</div>
                    <div><strong>Product ID:</strong> {order.product_id}</div>
                    <div><strong>Quantity:</strong> {order.quantity}</div>
                </div>
            )}
        </div>
    );
}

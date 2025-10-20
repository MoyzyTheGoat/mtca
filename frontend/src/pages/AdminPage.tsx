import React, { useState } from "react";
import { createProduct, deleteProduct } from "../api/api";

export default function AdminPage() {
    const [token, setToken] = useState("");
    const [form, setForm] = useState({ name: "", price: "", quantity: "" });

    const handleCreate = async () => {
        try {
            const data = {
                name: form.name,
                price: parseFloat(form.price),
                quantity: parseInt(form.quantity),
            };
            await createProduct(token, data);
            alert("✅ Product created successfully!");
        } catch (err) {
            alert("❌ " + (err as Error).message);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">👑 Admin Panel</h1>
            <input
                placeholder="Admin token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="border p-2 w-full rounded"
            />
            <div className="grid gap-2">
                <input
                    placeholder="Product name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border p-2 rounded"
                />
                <input
                    placeholder="Price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="border p-2 rounded"
                />
                <input
                    placeholder="Quantity"
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="border p-2 rounded"
                />
                <button
                    onClick={handleCreate}
                    className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    ➕ Add Product
                </button>
            </div>
        </div>
    );
}

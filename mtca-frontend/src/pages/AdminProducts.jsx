import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ name: "", price: 0, quantity: 0 });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const res = await api.get("/products/");
            setProducts(res.data);
        } catch (e) {
            console.error(e);
            alert("Failed to load products");
        }
    }

    async function createProduct(e) {
        e.preventDefault();
        try {
            const res = await api.post("/products/", form);
            alert("Created product");
            setForm({ name: "", price: 0, quantity: 0 });
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert("Create failed: " + (err?.response?.data?.detail || err.message));
        }
    }

    async function deleteProduct(id) {
        if (!confirm("Delete product?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (e) {
            console.error(e);
            alert("Delete failed");
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Products (Admin)</h1>

            <form onSubmit={createProduct} className="bg-white p-4 rounded shadow mb-6">
                <div className="grid md:grid-cols-3 gap-3">
                    <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="p-2 border rounded" />
                    <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} className="p-2 border rounded" />
                    <input required type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value || "0") })} className="p-2 border rounded" />
                </div>
                <div className="mt-3 flex justify-end">
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded">Create Product</button>
                </div>
            </form>

            <div className="grid gap-3">
                {products.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded shadow flex justify-between">
                        <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-sm text-gray-500">₦{p.price}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-600">Qty: {p.quantity}</div>
                            <button onClick={() => deleteProduct(p.id)} className="px-3 py-1 border rounded">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// src/pages/AdminProducts.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        name: "",
        price: "",
        quantity: "",
        description: "",
        image: null,
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products/");
            setProducts(res.data || []);
        } catch (e) {
            alert("Failed to load products");
            console.error(e);
        }
    };

    const createProduct = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("name", form.name);
        data.append("price", form.price);
        data.append("quantity", form.quantity);
        data.append("description", form.description);
        if (form.image) data.append("image", form.image);

        try {
            await api.post("/products/", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setForm({ name: "", price: "", quantity: "", description: "", image: null });
            fetchProducts();
        } catch (e) {
            alert("Create failed: " + (e.response?.data?.detail || e.message));
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm("Delete?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch {
            alert("Delete failed");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Admin – Manage Products</h1>

            <form onSubmit={createProduct} className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                    <input
                        required
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        required
                        type="number"
                        placeholder="Quantity"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                        className="p-2 border rounded bg-gray-50"
                    />
                </div>
                <div className="flex justify-end">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                        Create Product
                    </button>
                </div>
            </form>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl shadow p-3">
                        {p.image_url && (
                            <img
                                src={`http://127.0.0.1:8000${p.image_url}`}
                                alt={p.name}
                                className="h-40 w-full object-cover rounded-lg mb-2"
                            />
                        )}
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-600">₦{p.price}</div>
                        <div className="text-xs text-gray-500 mb-2">Qty: {p.quantity}</div>
                        <button
                            onClick={() => deleteProduct(p.id)}
                            className="text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

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
    const [editing, setEditing] = useState(null); // product being edited
    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        quantity: "",
        description: "",
        image: null,
        image_url: "",
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

    // 🧩 CREATE PRODUCT
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

    // 🧩 DELETE PRODUCT
    const deleteProduct = async (id) => {
        if (!confirm("Delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch {
            alert("Delete failed");
        }
    };

    // 🧩 OPEN EDIT MODAL
    const openEdit = (p) => {
        setEditing(p.id);
        setEditForm({
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            description: p.description,
            image: null,
            image_url: p.image_url,
        });
    };

    // 🧩 UPDATE PRODUCT (with optional new image)
    const updateProduct = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("name", editForm.name);
        data.append("price", editForm.price);
        data.append("quantity", editForm.quantity);
        data.append("description", editForm.description);
        if (editForm.image) data.append("image", editForm.image);

        try {
            await api.put(`/products/${editing}`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setEditing(null);
            fetchProducts();
        } catch (e) {
            alert("Update failed: " + (e.response?.data?.detail || e.message));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Admin – Manage Products</h1>

            {/* ✅ CREATE PRODUCT FORM */}
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

            {/* ✅ PRODUCT LIST */}
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
                        <div className="flex gap-2">
                            <button
                                onClick={() => openEdit(p)}
                                className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => deleteProduct(p.id)}
                                className="text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ✅ EDIT MODAL */}
            {editing && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
                        <h2 className="text-xl font-bold mb-4">Edit Product</h2>

                        <form onSubmit={updateProduct} className="space-y-3">
                            <input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Name"
                                required
                            />
                            <input
                                type="number"
                                step="0.01"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Price"
                                required
                            />
                            <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Quantity"
                                required
                            />
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Description"
                            />

                            {editForm.image_url && (
                                <img
                                    src={`http://127.0.0.1:8000${editForm.image_url}`}
                                    alt="Current"
                                    className="w-full h-32 object-cover rounded mb-2"
                                />
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditForm({ ...editForm, image: e.target.files[0] })}
                                className="w-full p-2 border rounded bg-gray-50"
                            />

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

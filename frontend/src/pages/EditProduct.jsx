// src/pages/EditProduct.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState({
        name: "",
        price: "",
        quantity: "",
        description: "",
        image_url: "",
    });
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/products/${id}`);
            setProduct(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load product");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpdate = async () => {
        setBusy(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();
            formData.append("name", product.name);
            formData.append("price", product.price);
            formData.append("quantity", product.quantity);
            formData.append("description", product.description);
            if (file) formData.append("image", file);

            await api.put(`/products/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSuccess("✅ Product updated successfully!");
            setTimeout(() => navigate("/admin"), 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update product");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-xl shadow">
            <h1 className="text-2xl font-bold mb-4">Edit Product</h1>

            {error && <p className="text-red-500 mb-3">{error}</p>}
            {success && <p className="text-green-600 mb-3">{success}</p>}

            <label className="block mb-2 font-medium">Name</label>
            <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="w-full border rounded p-2 mb-4"
            />

            <label className="block mb-2 font-medium">Price (₦)</label>
            <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                className="w-full border rounded p-2 mb-4"
            />

            <label className="block mb-2 font-medium">Quantity</label>
            <input
                type="number"
                name="quantity"
                value={product.quantity}
                onChange={handleChange}
                className="w-full border rounded p-2 mb-4"
            />

            <label className="block mb-2 font-medium">Description</label>
            <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                className="w-full border rounded p-2 mb-4"
                rows="3"
            />

            <label className="block mb-2 font-medium">Image</label>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full mb-4"
            />

            {product.image_url && (
                <img
                    src={product.image_url}
                    alt="Preview"
                    className="w-40 rounded-lg mb-4 border"
                />
            )}

            <button
                onClick={handleUpdate}
                disabled={busy}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
                {busy ? "Updating..." : "Update Product"}
            </button>
        </div>
    );
}

// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";
import { getAllOrders, getProducts } from "../api";
import { clearTokens } from "../api";
import { useNavigate } from "react-router-dom";

export default function Admin() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // fetch protected orders (requires admin)
        async function load() {
            try {
                const [o, p] = await Promise.all([getAllOrders(50, 0), getProducts(50, 0)]);
                setOrders(o || []);
                setProducts(p || []);
            } catch (err) {
                console.error(err);
                if (err.status === 401) {
                    setError("Unauthorized. Please login as admin.");
                } else {
                    setError(err.message || "Failed to fetch admin data");
                }
            }
        }
        load();
    }, []);

    function handleLogout() {
        clearTokens();
        navigate("/login");
    }

    return (
        <div className="pt-24 max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <div>
                    <button className="mr-2 px-3 py-1 bg-red-100 text-red-700 rounded" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {error && <div className="mb-4 text-red-600">{error}</div>}

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((p) => (
                        <div key={p.id} className="p-3 border rounded">
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-sm text-gray-600">₦{p.price}</div>
                            <div className="text-sm text-gray-600">Stock: {p.quantity}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-2">Recent Orders</h2>
                {orders.length === 0 ? (
                    <div className="text-gray-600">No orders found (or not authorized)</div>
                ) : (
                    <ul className="space-y-2">
                        {orders.map((o) => (
                            <li key={o.id} className="p-3 border rounded flex justify-between">
                                <div>
                                    <div className="font-medium">Order #{o.id}</div>
                                    <div className="text-sm text-gray-600">Product ID: {o.product_id} × {o.quantity}</div>
                                </div>
                                <div className="text-sm text-gray-500">{o.code}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

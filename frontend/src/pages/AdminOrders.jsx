// src/pages/AdminOrders.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function OrderProductCard({ product, qty, collected }) {
    const imageSrc = product?.image_url ? `${BACKEND_URL}${product.image_url}` : "/placeholder.png";
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 ${collected ? "opacity-60" : ""}`}
        >
            <div className="relative">
                <img src={imageSrc} alt={product?.name || "product"} className="h-44 w-full object-cover" onError={(e) => (e.currentTarget.src = "/placeholder.png")} />
                <div className="absolute left-2 top-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    Qty: {qty}
                </div>
                <div className="absolute right-2 bottom-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                    ₦{product?.price ?? "—"}
                </div>
                {collected && (
                    <div className="absolute left-2 bottom-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                        Collected
                    </div>
                )}
            </div>

            <div className="p-4 h-28 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{product?.name ?? "Unknown product"}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product?.description ?? ""}</p>
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCode, setSelectedCode] = useState(null);
    const [productCache, setProductCache] = useState({});
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");

    const fetchOrders = async (limit = 200) => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get(`/orders/?limit=${limit}`);
            setOrders(res.data || []);
        } catch (e) {
            console.error(e);
            setError("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const codes = useMemo(() => {
        const map = new Map();
        for (const o of (orders || [])) {
            const list = map.get(o.code) || [];
            list.push(o);
            map.set(o.code, list);
        }
        return Array.from(map.entries()).map(([code, items]) => ({ code, items }));
    }, [orders]);

    const fetchProductsFor = async (productIds = []) => {
        const toFetch = productIds.filter((id) => id && !productCache[id]);
        if (!toFetch.length) return;
        try {
            const promises = toFetch.map((id) => api.get(`/products/${id}`));
            const results = await Promise.all(promises);
            const newCache = { ...productCache };
            results.forEach((r) => {
                if (r.data && r.data.id) newCache[r.data.id] = r.data;
            });
            setProductCache(newCache);
        } catch (e) {
            console.error("Failed to fetch some products", e);
        }
    };

    useEffect(() => {
        if (!selectedCode) return;
        const entry = codes.find((c) => c.code === selectedCode);
        if (!entry) return;
        const ids = entry.items.map((it) => it.product_id);
        fetchProductsFor([...new Set(ids)]);
    }, [selectedCode, orders]);

    const handleLookup = () => {
        if (!query) return;
        setSelectedCode(query.trim());
    };

    const openCode = (code) => {
        setSelectedCode(code);
    };

    // NEW: mark collected handler
    const handleMarkCollected = async (code) => {
        if (!code) return;
        if (!confirm(`Mark order code ${code} as collected? This cannot be undone.`)) return;
        try {
            const res = await api.post(`/orders/collect/${encodeURIComponent(code)}`);
            // res.data is an array of updated orders
            const updatedRows = res.data || [];
            // update local orders state: replace matching ids
            setOrders((prev) =>
                prev.map((r) => {
                    // if any updatedRows has this id, replace with the updated one
                    const found = updatedRows.find((u) => u.id === r.id);
                    return found ? found : r;
                })
            );
            alert(`Marked ${updatedRows.length} row(s) for code ${code} as collected.`);
        } catch (e) {
            console.error("Failed to mark collected:", e);
            const detail = e.response?.data?.detail || e.message || "Failed to mark collected";
            alert(String(detail));
        }
    };

    const renderSelected = () => {
        if (!selectedCode) return <div className="text-gray-500">Select an order code to view items</div>;
        const entry = codes.find((c) => c.code === selectedCode);
        if (!entry) return <div className="text-red-500">No orders found for code {selectedCode}</div>;

        // Determine collected state by checking if all items for code are collected
        const allCollected = entry.items.every((it) => !!it.collected);

        return (
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Orders for code {selectedCode}</h2>
                        <div className="text-sm text-gray-500 mt-1">{entry.items.length} item(s)</div>
                        {allCollected ? <div className="text-sm text-green-600 mt-1">This order code has been collected.</div> : null}
                    </div>

                    <div className="space-x-2">
                        <button onClick={() => handleMarkCollected(selectedCode)} disabled={allCollected} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                            Mark collected
                        </button>
                        <button onClick={() => setSelectedCode(null)} className="px-3 py-1 rounded border">
                            Close
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {entry.items.map((it) => {
                        const product = productCache[it.product_id];
                        return (
                            <OrderProductCard
                                key={`${selectedCode}-${it.id}`}
                                product={product || { name: "Loading...", price: 0, description: "" }}
                                qty={it.quantity}
                                collected={!!it.collected}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Admin - Orders</h1>

                <div className="flex items-center gap-2">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Lookup code (e.g. WKOWDN)" className="px-3 py-2 border rounded-md" />
                    <button onClick={handleLookup} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Lookup</button>
                    <button onClick={() => fetchOrders(200)} className="px-3 py-2 border rounded-md">Fetch recent</button>
                </div>
            </div>

            {loading && <div className="text-gray-500">Loading orders…</div>}
            {error && <div className="text-red-500">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 bg-white p-4 rounded shadow">
                    <h3 className="font-semibold mb-2">Order codes</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
                        {codes.length === 0 && <div className="text-sm text-gray-500">No orders yet</div>}
                        {codes.map((entry) => {
                            const collected = entry.items.every((it) => !!it.collected);
                            return (
                                <div key={entry.code} onClick={() => openCode(entry.code)} className={`cursor-pointer p-3 rounded border ${selectedCode === entry.code ? "bg-indigo-50 border-indigo-200" : "hover:bg-gray-50"}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{entry.code}</div>
                                            <div className="text-xs text-gray-500">{entry.items.length} item(s)</div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {collected ? <span className="text-green-600">Collected</span> : <span className="text-yellow-600">Pending</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="md:col-span-2 bg-gray-50 p-4 rounded shadow">
                    {renderSelected()}
                </div>
            </div>
        </div>
    );
}

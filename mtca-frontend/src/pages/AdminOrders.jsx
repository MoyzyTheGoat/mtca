import React, { useState } from "react";
import api from "../api/axios";

export default function AdminOrders() {
    const [code, setCode] = useState("");
    const [order, setOrder] = useState(null);
    const [ordersList, setOrdersList] = useState([]);

    const lookup = async () => {
        try {
            const res = await api.get(`/orders/code/${code}`);
            setOrder(res.data);
        } catch (e) {
            console.error(e);
            alert("Not found or error");
            setOrder(null);
        }
    };

    const fetchAll = async () => {
        try {
            const res = await api.get("/orders/?limit=50&offset=0");
            setOrdersList(res.data);
        } catch (e) {
            console.error(e);
            alert("Failed to fetch");
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Orders (Admin)</h1>

            <div className="bg-white p-4 rounded shadow mb-4">
                <div className="flex gap-2">
                    <input className="p-2 border rounded" placeholder="Enter code like X7P9QZ" value={code} onChange={(e) => setCode(e.target.value)} />
                    <button onClick={lookup} className="px-3 py-1 bg-indigo-600 text-white rounded">Lookup by code</button>
                    <button onClick={fetchAll} className="px-3 py-1 border rounded">Fetch recent orders</button>
                </div>
                {order && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded">
                        <div className="font-semibold">Order #{order.id} — Code: {order.code}</div>
                        <div>Product ID: {order.product_id} — Quantity: {order.quantity}</div>
                    </div>
                )}
            </div>

            <div>
                {ordersList.map(o => (
                    <div key={o.id} className="bg-white p-3 rounded shadow mb-2">
                        <div className="font-semibold">#{o.id} — Code {o.code}</div>
                        <div className="text-sm text-gray-600">Product {o.product_id} — Qty {o.quantity}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// src/pages/Checkout.jsx
import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
    const navigate = useNavigate();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const [busy, setBusy] = useState(false);

    const placeOrder = async () => {
        if (cart.length === 0) return alert("Cart is empty");
        setBusy(true);
        try {
            const payload = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
            const res = await api.post("/orders/", payload);
            localStorage.removeItem("cart");
            const code = res.data?.code || (Array.isArray(res.data) ? res.data[0]?.code : null);
            alert("Order placed. Code: " + (code || "Check admin"));
            navigate("/");
        } catch (e) {
            console.error(e);
            alert("Failed to place order: " + (e.response?.data?.detail || e.message));
        } finally {
            setBusy(false);
        }
    };

    const total = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

    return (
        <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Checkout</h2>
            <div className="space-y-2">
                {cart.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                        <div>{i.name} × {i.quantity}</div>
                        <div>₦{(i.price * i.quantity).toFixed(2)}</div>
                    </div>
                ))}
            </div>
            <div className="mt-4 font-bold">Total: ₦{total.toFixed(2)}</div>
            <div className="mt-4 flex justify-end">
                <button disabled={busy} onClick={placeOrder} className="px-4 py-2 bg-brand-500 text-white rounded">{busy ? "Placing..." : "Place order"}</button>
            </div>
        </div>
    );
}

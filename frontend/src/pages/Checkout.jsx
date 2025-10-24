import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Checkout() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const placeOrder = async () => {
        if (!cart.length) {
            setError("Your cart is empty.");
            return;
        }

        setBusy(true);
        setError("");

        try {
            const payload = cart.map((item) => ({
                product_id: item.product_id || item.id, // ✅ fixed
                quantity: item.quantity,
            }));

            console.log("🛰 Sending payload:", payload);

            const res = await api.post("/orders/", payload);
            console.log("✅ Order created:", res.data);

            localStorage.removeItem("cart");
            navigate(`/order/${res.data.code}`);
        } catch (err) {
            console.error("❌ Order error:", err.response?.data);
            const msg =
                err.response?.data?.detail?.[0]?.msg ||
                (typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : "Order failed");
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    if (!cart.length) {
        return (
            <div className="text-center text-gray-500 py-20">
                Your cart is empty.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow mt-10">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>

            {cart.map((item) => (
                <div
                    key={item.product_id || item.id}
                    className="flex justify-between items-center py-3 border-b"
                >
                    <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                            ₦{item.price} × {item.quantity}
                        </p>
                    </div>
                    <div className="font-semibold">
                        ₦{item.price * item.quantity}
                    </div>
                </div>
            ))}

            <div className="flex justify-between font-semibold text-lg mt-4">
                <span>Total:</span>
                <span>₦{total}</span>
            </div>

            {error && <p className="text-red-500 mt-3">{error}</p>}

            <div className="mt-6 text-right">
                <button
                    onClick={placeOrder}
                    disabled={busy}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                    {busy ? "Placing order..." : "Place Order"}
                </button>
            </div>
        </div>
    );
}

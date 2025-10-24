import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Checkout() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const placeOrder = async () => {
        setBusy(true);
        setError("");
        try {
            const payload = cart.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
            }));
            const res = await api.post("/orders/", payload);
            localStorage.removeItem("cart");

            // Navigate to order code page with the generated code
            navigate(`/order/${res.data.code}`);
        } catch (err) {
            setError(err.response?.data?.detail || "Order failed");
            console.error(err);
        } finally {
            setBusy(false);
        }
    };

    if (!cart.length) {
        return <div className="text-center text-gray-500 py-20">Cart is empty.</div>;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>

            {cart.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                    <div>
                        {item.name} × {item.quantity}
                    </div>
                    <div>₦{item.price * item.quantity}</div>
                </div>
            ))}

            <div className="flex justify-between font-semibold text-lg mt-4">
                <span>Total:</span>
                <span>₦{total}</span>
            </div>

            {error && <p className="text-red-500 mt-2">{error}</p>}

            <div className="mt-6 text-right">
                <button
                    disabled={busy}
                    onClick={placeOrder}
                    className="px-5 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
                >
                    {busy ? "Placing order..." : "Place Order"}
                </button>
            </div>
        </div>
    );
}

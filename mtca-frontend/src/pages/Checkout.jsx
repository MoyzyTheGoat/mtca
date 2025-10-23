import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
    const navigate = useNavigate();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const [loading, setLoading] = useState(false);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return alert("Cart is empty");
        setLoading(true);

        // backend expects POST /orders/ with list of OrderCreate objects {product_id, quantity}
        const payload = cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
        try {
            const res = await api.post("/orders/", payload);
            // backend returns the created order (or last created order in your crud)
            // We'll clear cart and show pick-up code if present
            localStorage.removeItem("cart");
            setLoading(false);
            const code = res.data?.code || (Array.isArray(res.data) ? res.data[0]?.code : null);
            alert(`Order placed. Pick up code: ${code || "Check admin for code"}`);
            navigate("/");
        } catch (e) {
            setLoading(false);
            console.error(e);
            alert("Failed to place order. Check console.");
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>
            <p className="mb-4">Confirm order & place it. You will get a unique 6-character pickup code.</p>

            <button onClick={handlePlaceOrder} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
                {loading ? "Placing..." : "Place Order"}
            </button>
        </div>
    );
}

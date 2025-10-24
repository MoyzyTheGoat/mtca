import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);

    useEffect(() => {
        setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    }, []);

    const updateQty = (idx, qty) => {
        const c = [...cart];
        c[idx].quantity = Math.max(1, qty);
        setCart(c);
        localStorage.setItem("cart", JSON.stringify(c));
    };

    const removeItem = (idx) => {
        const c = [...cart];
        c.splice(idx, 1);
        setCart(c);
        localStorage.setItem("cart", JSON.stringify(c));
    };

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    return (
        <>
            <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
            {cart.length === 0 ? (
                <div>
                    <p>Your cart is empty.</p>
                    <Link to="/" className="text-indigo-600">Go to products</Link>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {cart.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded shadow flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-sm text-gray-500">₦{item.price.toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input className="w-16 p-1 border rounded" type="number" value={item.quantity}
                                        onChange={(e) => updateQty(idx, parseInt(e.target.value || "1"))} />
                                    <button onClick={() => removeItem(idx)} className="px-3 py-1 border rounded">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-lg font-semibold">Total: ₦{total.toFixed(2)}</div>
                        <button onClick={() => navigate("/checkout")} className="px-4 py-2 bg-indigo-600 text-white rounded">
                            Checkout
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

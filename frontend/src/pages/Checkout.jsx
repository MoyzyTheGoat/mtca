import React, { useState, useEffect } from "react";
import { createOrder } from "../api";

/*
This is a very simple checkout page:
- The user manually composes order lines (for demo)
- In a real app you'd store the cart centrally; here we allow the user to type
  a JSON array or follow the simple form to create the order.
*/

export default function Checkout() {
    const [payloadText, setPayloadText] = useState('[{"product_id":1,"quantity":1}]');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        setLoading(true);
        try {
            const payload = JSON.parse(payloadText);
            const res = await createOrder(payload);
            setResult(res);
            alert(`Order created. Pickup code: ${res.code}`);
        } catch (err) {
            alert("Error creating order: " + (err.message || err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1 className="text-2xl mb-4">Checkout</h1>

            <p className="mb-2 text-sm text-gray-600">
                Provide the order payload as JSON: an array of {"{product_id, quantity}"}. Example pre-filled.
            </p>

            <textarea
                rows="6"
                className="w-full border p-2 rounded"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
            />

            <div className="mt-3">
                <button onClick={handleCreate} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white">
                    {loading ? "Creating..." : "Place order"}
                </button>
            </div>

            {result && (
                <div className="mt-4 p-3 border rounded bg-green-50">
                    <div><strong>Order created</strong></div>
                    <div>Order ID: {result.id}</div>
                    <div>Pickup code: <code>{result.code}</code></div>
                </div>
            )}
        </div>
    );
}

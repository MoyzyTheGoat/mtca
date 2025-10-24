// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

export default function Home() {
    const [products, setProducts] = useState([]);

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products/");
            console.log(res.data); // inside fetchProducts

            setProducts(res.data || []);
        } catch (e) {
            console.error(e);
            alert("Cannot fetch products: " + (e.response?.data?.detail || e.message));
        }
    };



    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((c) => c.product_id === product.id);
        if (existing) existing.quantity = Math.min(product.quantity, existing.quantity + 1);
        else cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1 });
        localStorage.setItem("cart", JSON.stringify(cart));
        // simple toast
        const el = document.createElement("div");
        el.textContent = `${product.name} added`;
        Object.assign(el.style, { position: "fixed", right: "20px", bottom: "20px", background: "#111827", color: "white", padding: "8px 12px", borderRadius: "8px", zIndex: 9999 });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1400);
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Products</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
            </div>
        </>
    );
}

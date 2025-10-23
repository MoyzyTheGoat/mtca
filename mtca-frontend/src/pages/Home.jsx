import React, { useEffect, useState } from "react";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

export default function Home() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const res = await api.get("/products/");
            setProducts(res.data);
        } catch (e) {
            console.error("Could not load products", e);
            setProducts([]);
        }
    }

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((c) => c.product_id === product.id);
        if (existing) {
            existing.quantity = Math.min(product.quantity, existing.quantity + 1);
        } else {
            cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1 });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Added to cart");
    };

    return (
        <>
            <h1 className="text-2xl font-bold mb-4">Products</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map((p) => (
                    <ProductCard key={p.id} product={p} onAdd={addToCart} />
                ))}
            </div>
        </>
    );
}

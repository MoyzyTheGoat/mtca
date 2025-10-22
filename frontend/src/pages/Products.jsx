import React, { useEffect, useState } from "react";
import { getProducts } from "../api";
import ProductCard from "../components/ProductCard";
import { motion } from "framer-motion";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({}); // {productId: {product, qty}}

    useEffect(() => {
        getProducts().then(setProducts).catch(console.error);
    }, []);

    function handleAdd(product, qty) {
        setCart((c) => {
            const prev = c[product.id]?.qty || 0;
            return { ...c, [product.id]: { product, qty: prev + qty } };
        });
        // simple toast
        alert(`${product.name} x${qty} added to cart`);
    }

    return (
        <div>
            <h1 className="text-2xl mb-4">Products</h1>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                    <motion.div key={p.id} whileHover={{ scale: 1.02 }}>
                        <ProductCard product={p} onAdd={handleAdd} />
                    </motion.div>
                ))}
            </motion.div>
            <div className="mt-6">
                <h2 className="text-xl">Cart Preview</h2>
                <ul>
                    {Object.values(cart).length === 0 && <li>No items yet.</li>}
                    {Object.values(cart).map((line) => (
                        <li key={line.product.id}>
                            {line.product.name} x {line.qty}
                        </li>
                    ))}
                </ul>
                <div className="mt-2">
                    <a href="/checkout" className="px-4 py-2 rounded bg-indigo-600 text-white">Go to checkout</a>
                </div>
            </div>
        </div>
    );
}

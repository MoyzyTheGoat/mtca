import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../api/api";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch((err) => setError(err.message));
    }, []);

    if (error) return <div className="text-red-500 p-6">Error: {error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">🛒 Supermarket Products</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                    <ProductCard key={p.id} name={p.name} price={p.price} quantity={p.quantity} />
                ))}
            </div>
        </div>
    );
}

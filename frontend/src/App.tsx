import React from "react";
import ProductsPage from "./pages/ProductsPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <nav className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">🛍️ MTCA Frontend</h1>
        <div className="space-x-4">
          <a href="/" className="text-blue-600 hover:underline">
            Products
          </a>
          <a href="/admin" className="text-blue-600 hover:underline">
            Admin
          </a>
        </div>
      </nav>

      {/* For now, we’ll just show the products page directly */}
      <ProductsPage />
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/admin/products" className="p-4 bg-white rounded shadow">Manage Products</Link>
                <Link to="/admin/orders" className="p-4 bg-white rounded shadow">Lookup Orders</Link>
            </div>
        </div>
    );
}

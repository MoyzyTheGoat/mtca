const API_BASE = import.meta.env.VITE_API_BASE_URL;

// --- Public API ---
export async function fetchProducts() {
    const res = await fetch(`${API_BASE}/products/`);
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
    return res.json();
}

// --- Admin-only API ---
export async function createProduct(token: string, product: { name: string; price: number; quantity: number }) {
    const res = await fetch(`${API_BASE}/products/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error(`Failed to create product: ${res.status}`);
    return res.json();
}

export async function deleteProduct(token: string, id: number) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error(`Failed to delete product: ${res.status}`);
    return res.json();
}

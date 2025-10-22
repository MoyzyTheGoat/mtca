// Centralized API helper. Change API_BASE via env var or here.
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// helper: read token from localStorage
function getToken() {
    return localStorage.getItem("mtca_access_token");
}

// helper: attach auth header
function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// low-level fetch wrapper that handles JSON and errors
async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const defaultHeaders = { "Content-Type": "application/json" };
    options.headers = { ...defaultHeaders, ...options.headers };

    const res = await fetch(url, options);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        // Attach server message if available
        const message = data?.detail || data?.message || res.statusText;
        const err = new Error(message);
        err.status = res.status;
        throw err;
    }
    return data;
}

/* PRODUCTS */
export function getProducts(limit = 50, offset = 0) {
    return request(`/products/?limit=${limit}&offset=${offset}`, {
        method: "GET",
    });
}

/* ORDERS */
// Create order expects array of {product_id, quantity}
export function createOrder(orderPayload) {
    return request(`/orders/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(orderPayload),
    });
}

export function getOrderByCode(code) {
    return request(`/orders/code/${encodeURIComponent(code)}`, {
        method: "GET",
        headers: authHeaders(),
    });
}

export function getOrders(limit = 20, offset = 0) {
    return request(`/orders/?limit=${limit}&offset=${offset}`, {
        method: "GET",
        headers: authHeaders(),
    });
}

/* AUTH */
// Login uses form data (OAuth2PasswordRequestForm). We emulate form submit.
export async function login(username, password) {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    // Note: backend login returns access_token & refresh_token
    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        body: form,
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Login failed");
    }
    const data = await res.json();
    // Save tokens to localStorage (simple approach)
    localStorage.setItem("mtca_access_token", data.access_token);
    localStorage.setItem("mtca_refresh_token", data.refresh_token || "");
    return data;
}

export async function register(username, password, is_admin = false) {
    return request(`/register`, {
        method: "POST",
        body: JSON.stringify({ username, password, is_admin }),
    });
}

export async function refreshToken() {
    const refresh = localStorage.getItem("mtca_refresh_token");
    if (!refresh) throw new Error("No refresh token");
    return request(`/refresh`, {
        method: "POST",
        body: JSON.stringify({ refresh_token: refresh }),
    });
}

// Helper to clear tokens on logout
export function logout() {
    localStorage.removeItem("mtca_access_token");
    localStorage.removeItem("mtca_refresh_token");
}

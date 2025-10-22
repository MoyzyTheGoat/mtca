// src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function getAccessToken() {
    return localStorage.getItem("mtca_access_token");
}
function getRefreshToken() {
    return localStorage.getItem("mtca_refresh_token");
}
function setTokens({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem("mtca_access_token", access_token);
    if (refresh_token) localStorage.setItem("mtca_refresh_token", refresh_token);
}
export function clearTokens() {
    localStorage.removeItem("mtca_access_token");
    localStorage.removeItem("mtca_refresh_token");
}

/**
 * Try to refresh the access token using the refresh token.
 * Returns true if refresh succeeded (and saves new token), false otherwise.
 */
async function tryRefresh() {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
        const res = await fetch(`${API_BASE}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        // API returns { access_token, token_type } or similar
        if (data.access_token) {
            setTokens({ access_token: data.access_token });
            return true;
        }
        return false;
    } catch (err) {
        console.error("refresh failed", err);
        return false;
    }
}

/**
 * request: helper that automatically tries to refresh on 401 once.
 * path: string starting with '/'
 * opts: fetch options
 */
export async function request(path, opts = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };

    const attachAuth = () => {
        const token = getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    };

    attachAuth();
    let res = await fetch(url, { ...opts, headers });

    if (res.status === 401) {
        // try refresh once
        const refreshed = await tryRefresh();
        if (refreshed) {
            // retry original request with new token
            const token = getAccessToken();
            if (token) headers["Authorization"] = `Bearer ${token}`;
            res = await fetch(url, { ...opts, headers });
        }
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const message = data?.detail || data?.message || res.statusText;
        const err = new Error(message);
        err.status = res.status;
        err.body = data;
        throw err;
    }
    return data;
}

/* AUTH */

/**
 * Login: backend expects OAuth2PasswordRequestForm (form-encoded)
 * returns { access_token, refresh_token, token_type }
 */
export async function login(username, password) {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);

    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Login failed");
    }
    const data = await res.json();
    setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
    return data;
}

/**
 * Register: JSON payload { username, password, is_admin }
 */
export async function register(username, password, is_admin = false) {
    return request("/register", {
        method: "POST",
        body: JSON.stringify({ username, password, is_admin }),
    });
}

/* PUBLIC PRODUCTS */
export async function getProducts(limit = 50, offset = 0) {
    // your backend route: GET /products/
    return request(`/products/?limit=${limit}&offset=${offset}`, { method: "GET" });
}

/* PROTECTED ORDERS (admin) */
export async function getAllOrders(limit = 50, offset = 0) {
    return request(`/orders/?limit=${limit}&offset=${offset}`, { method: "GET" });
}

/* GET ORDER BY CODE (admin protected) */
export async function getOrderByCode(code) {
    return request(`/orders/code/${encodeURIComponent(code)}`, { method: "GET" });
}

/* Create order (customer) - uses authHeaders by default; if orders are public remove auth) */
export async function createOrder(payload) {
    return request(`/orders/`, { method: "POST", body: JSON.stringify(payload) });
}

export { API_BASE };

// src/api/axios.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: API_BASE,
    // intentionally do NOT set a global Content-Type so we can send form-encoded when needed
});

// attach token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor with refresh logic
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (!original) return Promise.reject(err);

        const status = err.response?.status;
        if (status === 401 && !original._retry && !isRefreshing) {
            original._retry = true;
            isRefreshing = true;
            try {
                const refresh_token = localStorage.getItem("refresh_token");
                if (!refresh_token) throw err;
                // use plain axios to call refresh (to avoid interceptors loop)
                const r = await axios.post(`${API_BASE}/refresh`, { refresh_token });
                const newAccess = r.data.access_token;
                localStorage.setItem("access_token", newAccess);
                api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
                // run queued requests
                refreshQueue.forEach(cb => cb(newAccess));
                refreshQueue = [];
                isRefreshing = false;
                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch (e) {
                isRefreshing = false;
                refreshQueue = [];
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                return Promise.reject(err);
            }
        } else if (status === 401 && original._retry) {
            // queue while refresh is in progress
            return new Promise((resolve, reject) => {
                refreshQueue.push((newToken) => {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    resolve(api(original));
                });
            });
        }
        return Promise.reject(err);
    }
);

export default api;

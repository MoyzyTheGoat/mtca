import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: API_BASE,
    // Remove default Content-Type here — let individual requests decide
});

// Automatically attach access token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Refresh token logic (unchanged)
let isRefreshing = false;
let waitQueue = [];

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;

        if (err.response?.status === 401 && !original._retry && !isRefreshing) {
            original._retry = true;
            isRefreshing = true;

            try {
                const refresh_token = localStorage.getItem("refresh_token");
                if (!refresh_token) {
                    isRefreshing = false;
                    return Promise.reject(err);
                }

                const r = await axios.post(`${API_BASE}/refresh`, { refresh_token });
                localStorage.setItem("access_token", r.data.access_token);
                api.defaults.headers.common.Authorization = `Bearer ${r.data.access_token}`;
                isRefreshing = false;

                // retry queued requests
                waitQueue.forEach((cb) => cb(r.data.access_token));
                waitQueue = [];
                original.headers.Authorization = `Bearer ${r.data.access_token}`;
                return api(original);
            } catch (e) {
                isRefreshing = false;
                waitQueue = [];
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                return Promise.reject(err);
            }
        } else if (err.response?.status === 401 && original._retry) {
            return new Promise((resolve) => {
                waitQueue.push((newToken) => {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    resolve(api(original));
                });
            });
        }

        return Promise.reject(err);
    }
);

export default api;

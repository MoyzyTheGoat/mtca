// src/api/auth.js
const BASE_URL = "http://127.0.0.1:8000"; // change to your FastAPI backend base URL if different

export async function loginUser(credentials) {
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    if (!res.ok) throw new Error("Invalid login credentials");
    return res.json();
}

export async function registerUser(data) {
    const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Registration failed");
    return res.json();
}

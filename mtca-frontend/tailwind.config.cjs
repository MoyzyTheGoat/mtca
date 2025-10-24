// frontend/tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#f4f6ff",
                    100: "#e9eeff",
                    200: "#cfd8ff",
                    400: "#7166f6",
                    500: "#4f46e5",
                    600: "#3f3bc4",
                    700: "#2d2a8f",
                },
                accent: "#ffb86b",
            },
            boxShadow: {
                "soft-lg": "0 10px 30px rgba(18, 18, 60, 0.08)",
                "glow-sm": "0 8px 30px rgba(79,70,229,0.12)",
            },
            keyframes: {
                float: {
                    "0%,100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                pop: {
                    "0%": { transform: "scale(0.98)", opacity: 0.6 },
                    "100%": { transform: "scale(1)", opacity: 1 },
                },
                fadeInUp: {
                    "0%": { opacity: 0, transform: "translateY(8px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
            },
            animation: {
                float: "float 4s ease-in-out infinite",
                pop: "pop .25s cubic-bezier(.2,.8,.2,1)",
                fadeInUp: "fadeInUp .45s ease both",
            },
        },
    },
    plugins: [],
};

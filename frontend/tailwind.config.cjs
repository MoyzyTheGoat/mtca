/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // ✅ Scan all your React files
    ],
    theme: {
        extend: {
            fontFamily: {
                // ✅ Adds modern, clean fonts
                sans: ["Inter", "ui-sans-serif", "system-ui"],
            },
            colors: {
                // ✅ Custom color palette for a supermarket/e-commerce vibe
                primary: "#4F46E5", // Indigo 600
                secondary: "#10B981", // Emerald 500
                accent: "#F59E0B", // Amber 500
            },
            boxShadow: {
                // ✅ Soft shadows for card and button animations
                "soft-xl": "0 10px 25px rgba(0, 0, 0, 0.1)",
            },
            animation: {
                // ✅ Smooth fade and bounce animations
                fadeIn: "fadeIn 0.5s ease-out forwards",
                bounceSlow: "bounce 2s infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: 0, transform: "translateY(10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"), // ✅ Beautiful input & button styles
        require("@tailwindcss/typography"), // ✅ Better text styling for admin dashboard
    ],
};

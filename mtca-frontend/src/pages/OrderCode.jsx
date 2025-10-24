import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function OrderCode() {
    const { code } = useParams();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[80vh] text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="bg-white shadow-2xl rounded-3xl p-10"
            >
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    🎉 Order Successful!
                </h1>
                <p className="text-gray-500 mb-5">
                    Please keep this code safe — you’ll need it to pick up your order.
                </p>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-5xl font-extrabold text-indigo-600 tracking-widest bg-indigo-50 rounded-xl py-6 px-10 mb-6"
                >
                    {code?.toUpperCase()}
                </motion.div>

                <Link
                    to="/"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    Back to Home
                </Link>
            </motion.div>
        </motion.div>
    );
}

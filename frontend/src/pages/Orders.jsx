import { motion } from "framer-motion";

const Orders = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.h1
                className="text-4xl font-bold text-indigo-700 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Your Orders
            </motion.h1>

            <motion.p
                className="text-gray-600 text-lg max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                Track your pickup orders or enter your 6-character order code below.
            </motion.p>

            <motion.input
                type="text"
                placeholder="Enter Order Code"
                className="mt-6 px-4 py-2 rounded-lg border-2 border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                whileFocus={{ scale: 1.05 }}
            />

            <motion.button
                className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Retrieve Order
            </motion.button>
        </div>
    );
};

export default Orders;

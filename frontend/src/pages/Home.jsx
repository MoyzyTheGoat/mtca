import { motion } from "framer-motion";

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20">
            <motion.h1
                className="text-5xl font-bold text-indigo-700 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Welcome to MTCA Supermarket
            </motion.h1>

            <motion.p
                className="text-lg text-gray-600 max-w-2xl mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                Skip the queue. Shop faster. Get your groceries ready for pickup.
            </motion.p>

            <motion.a
                href="/products"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Shop Now
            </motion.a>
        </div>
    );
};

export default Home;

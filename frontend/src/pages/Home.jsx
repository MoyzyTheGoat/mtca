import React from "react"; // imports the React library so JSX works

// Define a functional React component
const Home = () => {
    return (
        <div className="max-w-5xl mx-auto p-6 text-center">
            <h1 className="text-4xl font-bold text-indigo-600 mb-4">Welcome to MTCA Supermarket</h1>
            <p className="text-gray-600 text-lg">
                Order your groceries quickly and skip the long queues.
            </p>
        </div>
    );
};

// Export it as the default export so App.jsx can import it
export default Home;

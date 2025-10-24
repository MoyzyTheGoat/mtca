import React from "react";

export default function Footer() {
    return (
        <footer className="mt-12 border-t bg-white/60">
            <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">© {new Date().getFullYear()} QueueReducer</div>
                <div className="text-sm text-gray-500">Built with ♥ using FastAPI & React</div>
            </div>
        </footer>
    );
}

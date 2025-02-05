import React from "react";

export function PageHeader({ children }) {
    return (
        <div className="relative w-full max-w-screen-lg mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 text-white">
                {/* Left Side: Title or Children */}
                <div className="mb-2 sm:mb-0">
                    <div className="text-lg sm:text-xl font-semibold">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

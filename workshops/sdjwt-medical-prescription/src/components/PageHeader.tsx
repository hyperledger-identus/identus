import { useMountedApp } from "@/reducers/store";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export function PageHeader({ children }) {
    const app = useMountedApp();
    const { db, mediatorDID, initAgent } = app;

    const agent = app.agent.instance;
    const handleStart = async () => {
        if (agent) {
            app.startAgent({ agent });
        }
    };

    const handleStop = async () => {
        if (agent) {
            app.stopAgent({ agent });
        }
    };

    useEffect(() => {
        if (!app.agent.instance && db.instance) {
            initAgent({ mediatorDID, pluto: db.instance, defaultSeed: app.defaultSeed });
        }
    }, [app.agent, db]);

    const canStart =
        (app.db.connected && !app.agent.instance?.state) ||
        app.agent.instance?.state === "stopped";

    const [isClicked, setIsClicked] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

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

                {/* Right Side: Status, Buttons, Menu Button */}
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    {/* Status */}
                    <div className="text-center sm:text-left">
                        <p className="text-sm sm:text-base font-medium">
                            <b>Status:</b> {app.agent.instance?.state ?? "stopped"}
                        </p>
                        {app.agent.instance?.state === "running" && app.agent.selfDID && (
                            <button
                                onClick={() => {
                                    navigator.clipboard
                                        .writeText(app.agent.selfDID!.toString())
                                        .then(() => {
                                            setIsClicked(true);
                                            setTimeout(() => setIsClicked(false), 300);
                                        });
                                }}
                                className={`text-xs sm:text-sm text-blue-500 transition-transform duration-300 ${isClicked ? "scale-110" : ""
                                    }`}
                            >
                                Copy DID
                            </button>
                        )}
                    </div>

                    {/* Start Button */}
                    {canStart && (
                        <button
                            className="w-full sm:w-auto px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 text-sm sm:text-base"
                            onClick={handleStart}
                        >
                            Start
                        </button>
                    )}

                    {/* Stop Button */}
                    {app.agent.instance?.state === "running" && (
                        <button
                            className="w-full sm:w-auto px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 text-sm sm:text-base"
                            onClick={handleStop}
                        >
                            Stop
                        </button>
                    )}

                    {/* Menu Button (Visible on small screens) */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 sm:hidden"
                    >
                        {/* Hamburger Icon */}
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Menu for large screens */}
            <div className="hidden sm:block ">
                <ul className="flex justify-center space-x-4 text-white py-2">
                    <li>
                        <Link
                            href="/"
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            Edge Agent
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/verification"
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            OOB Verification
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/connections"
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            Connections
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/credentials"
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            Credentials
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/messages"
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            Messages
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/debug"
                            className="px-4 py-2 hover:bg-gray-700 rounded"
                        >
                            Debug
                        </Link>
                    </li>
                </ul>
            </div>

            {/* Responsive Menu for small screens */}
            {menuOpen && (
                <div
                    onMouseLeave={() => setMenuOpen(false)}
                    className="absolute inset-0 text-white flex flex-col items-center justify-center z-10 bg-gray-800 sm:hidden"
                >
                    <ul className="w-full text-center">
                        <li className="px-5 py-3 hover:bg-gray-700 rounded-lg">
                            <Link
                                href="/"
                                className="inline-block w-full px-4 py-2"
                            >
                                Edge Agent
                            </Link>
                        </li>
                        <li className="px-5 py-3 hover:bg-gray-700 rounded-lg">
                            <Link
                                href="/verification"
                                className="inline-block w-full px-4 py-2"
                            >
                                OOB Verification
                            </Link>
                        </li>
                        <li className="px-5 py-3 hover:bg-gray-700 rounded-lg">
                            <Link
                                href="/connections"
                                className="inline-block w-full px-4 py-2"
                            >
                                Connections
                            </Link>
                        </li>
                        <li className="px-5 py-3 hover:bg-gray-700 rounded-lg">
                            <Link
                                href="/credentials"
                                className="inline-block w-full px-4 py-2"
                            >
                                Credentials
                            </Link>
                        </li>
                        <li className="px-5 py-3 hover:bg-gray-700 rounded-lg">
                            <Link
                                href="/messages"
                                className="inline-block w-full px-4 py-2"
                            >
                                Messages
                            </Link>
                        </li>
                        <li className="px-5 py-3 hover:bg-gray-700 rounded-lg">
                            <Link
                                href="/debug"
                                className="inline-block w-full px-4 py-2"
                            >
                                Debug
                            </Link>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

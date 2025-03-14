"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white px-6">
      {/* Header Section */}
      <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg text-center">
        🚀 Welcome to <span className="text-yellow-300">Opinion Trade</span>
      </h1>
      <p className="text-lg mb-12 text-center opacity-90 max-w-md">
        Make smart trades, track live data, and stay ahead in the market.
      </p>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        
        {/* Charts Section */}
        <Link href="/charts">
          <div className="group p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg transform transition-transform hover:scale-105 cursor-pointer">
            <h2 className="text-2xl font-semibold text-blue-200 group-hover:text-blue-300">📊 View Live Charts</h2>
            <p className="text-sm text-gray-200 mt-2">Stay updated with real-time market trends.</p>
          </div>
        </Link>

        {/* Authentication Section */}
        <Link href="/auth">
          <div className="group p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg transform transition-transform hover:scale-105 cursor-pointer">
            <h2 className="text-2xl font-semibold text-green-200 group-hover:text-green-300">🔐 Login / Register</h2>
            <p className="text-sm text-gray-200 mt-2">Sign in to manage your trades and portfolio.</p>
          </div>
        </Link>

        {/* Trades Section */}
        <Link href="/trades">
          <div className="group p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg transform transition-transform hover:scale-105 cursor-pointer">
            <h2 className="text-2xl font-semibold text-purple-200 group-hover:text-purple-300">💰 My Trades</h2>
            <p className="text-sm text-gray-200 mt-2">View and manage all your trade activities.</p>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm opacity-75">
        © 2025 Opinion Trade | Built for Smart Investors
      </footer>
    </div>
  );
}

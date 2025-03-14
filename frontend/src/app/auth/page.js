"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Auth() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [mode, setMode] = useState("login");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = mode === "login" ? "/login" : "/register";
    const res = await axios.post(`http://localhost:5000${endpoint}`, form);

    if (mode === "login") {
      localStorage.setItem("token", res.data.token);
      router.push("/trades");
    } else {
      alert("User registered! Please login.");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="p-8 rounded-lg bg-white shadow-2xl w-full max-w-md">
        <Link href="/" className="text-blue-500 hover:underline block mb-4">← Back to Home</Link>
        <h1 className="text-2xl font-bold mb-6 text-center">{mode === "login" ? "🔐 Login" : "📝 Register"}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400" 
            type="text" placeholder="Username"
            onChange={(e) => setForm({ ...form, username: e.target.value })} />

          <input className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400" 
            type="password" placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <button className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <button className="text-sm mt-4 text-gray-500 hover:underline" 
          onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

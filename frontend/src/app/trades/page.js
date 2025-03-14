"use client"; // Ensure client-side behavior

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/auth"); // Redirect if not logged in
      return;
    }

    axios
      .get("http://localhost:5000/user/trades", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTrades(res.data))
      .catch((err) => console.error("Error fetching trades:", err));
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Trades</h1>
      {trades.length === 0 ? (
        <p>No trades found.</p>
      ) : (
        <ul>
          {trades.map((trade) => (
            <li key={trade._id} className="border-b py-2">
              {trade.eventId} - {trade.amount} - {trade.prediction} - <strong>{trade.status}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

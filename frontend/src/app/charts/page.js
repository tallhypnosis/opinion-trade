"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function ChartsPage() {
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    axios.get("http://localhost:5000/events").then((res) => {
      setEvents(res.data);
    });
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <Link href="/" className="text-blue-500 hover:underline mb-4 block">← Back to Home</Link>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">📈 Live Event Odds</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event, index) => (
          <div key={event.eventId || index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
            <h2 className="text-xl font-semibold">{event.name}</h2>
            <p className="text-gray-600">{event.category}</p>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData[event.eventId] || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="odds" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

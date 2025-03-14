"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const socket = io("http://localhost:5000"); // Ensure this matches your backend port

export default function Home() {
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState({}); // Store odds history

  useEffect(() => {
    axios.get("http://localhost:5000/events").then((res) => {
      setEvents(res.data);
      const initialData = res.data.reduce((acc, event) => {
        acc[event.eventId] = [{ time: new Date().toLocaleTimeString(), odds: event.odds }];
        return acc;
      }, {});
      setChartData(initialData);
    });

    socket.on("eventUpdate", (updatedEvent) => {
      setEvents((prevEvents) =>
        prevEvents.map((ev) => (ev.eventId === updatedEvent.eventId ? updatedEvent : ev))
      );

      setChartData((prevData) => ({
        ...prevData,
        [updatedEvent.eventId]: [
          ...(prevData[updatedEvent.eventId] || []),
          { time: new Date().toLocaleTimeString(), odds: updatedEvent.odds },
        ],
      }));
    });

    return () => socket.off("eventUpdate");
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Live Event Odds</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.eventId} className="border p-4 rounded-lg shadow-md">
            <h2 className="font-semibold">{event.name}</h2>
            <p className="text-sm text-gray-500">{event.category}</p>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData[event.eventId] || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="odds" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

//
// "use client"; // Ensure this runs on the client side

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       router.push("/trades"); // Redirect if user is logged in
//     }
//   }, []);

//   return (
//     <div className="p-6 text-center">
//       <h1 className="text-2xl font-bold">Welcome to Opinion Trade</h1>
//       <p className="mt-4">
//         Please <a href="/auth" className="text-blue-500">login</a> to continue.
//       </p>
//     </div>
//   );
// }

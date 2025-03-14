"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/auth"); // Redirect to login if not authenticated
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

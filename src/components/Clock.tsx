"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";

export function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card>
      <div className="text-5xl font-bold tracking-tight">{time}</div>
      <div className="text-muted text-lg mt-1">{date}</div>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface SunData {
  sunrise: string;
  sunset: string;
  civilTwilightBegin: string;
  civilTwilightEnd: string;
  dayLength: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SunriseSunset() {
  const [sun, setSun] = useState<SunData | null>(null);

  const fetchSun = useCallback(async () => {
    try {
      const res = await fetch("/api/sun");
      if (!res.ok) throw new Error("Failed to fetch");
      setSun(await res.json());
    } catch {
      // Non-critical widget
    }
  }, []);

  useEffect(() => {
    fetchSun();
    const interval = setInterval(fetchSun, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSun]);

  if (!sun) {
    return (
      <Card>
        <div className="text-muted text-sm animate-pulse">Loading sun data...</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-2xl">🌅</div>
          <div className="text-sm font-medium">{formatTime(sun.sunrise)}</div>
          <div className="text-xs text-muted">Sunrise</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted">Day length</div>
          <div className="text-sm font-medium">{formatDuration(sun.dayLength)}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl">🌇</div>
          <div className="text-sm font-medium">{formatTime(sun.sunset)}</div>
          <div className="text-xs text-muted">Sunset</div>
        </div>
      </div>
    </Card>
  );
}

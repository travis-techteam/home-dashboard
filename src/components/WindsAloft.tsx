"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface WindLevel {
  altitude: string;
  direction: string;
  speed: string;
  temperature: string;
}

interface WindsData {
  station: string;
  raw: string;
  altitudes: WindLevel[];
}

export function WindsAloft() {
  const [winds, setWinds] = useState<WindsData | null>(null);

  const fetchWinds = useCallback(async () => {
    try {
      const res = await fetch("/api/winds");
      if (!res.ok) throw new Error("Failed to fetch");
      setWinds(await res.json());
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchWinds();
    const interval = setInterval(fetchWinds, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWinds]);

  if (!winds) {
    return (
      <Card title="Winds Aloft">
        <div className="text-muted text-sm animate-pulse">
          Loading winds...
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Winds Aloft — ${winds.station}`}>
      {winds.altitudes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs">
                <th className="text-left pb-2 font-medium">Alt (ft)</th>
                <th className="text-left pb-2 font-medium">Dir</th>
                <th className="text-left pb-2 font-medium">Speed</th>
                <th className="text-left pb-2 font-medium">Temp</th>
              </tr>
            </thead>
            <tbody>
              {winds.altitudes.map((level) => (
                <tr key={level.altitude} className="border-t border-card-border">
                  <td className="py-1.5 text-muted">{level.altitude}</td>
                  <td className="py-1.5">{level.direction}</td>
                  <td className="py-1.5">{level.speed}</td>
                  <td className="py-1.5 text-muted">{level.temperature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="font-mono text-xs text-muted bg-black/30 rounded-lg p-3 break-all">
          {winds.raw}
        </div>
      )}
    </Card>
  );
}

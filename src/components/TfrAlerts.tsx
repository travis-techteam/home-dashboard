"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface TfrInfo {
  notamNumber: string;
  type: string;
  facility: string;
  state: string;
  description: string;
  effectiveStart: string;
  effectiveEnd: string;
  altitudeLow: string;
  altitudeHigh: string;
}

export function TfrAlerts() {
  const [tfrs, setTfrs] = useState<TfrInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTfrs = useCallback(async () => {
    try {
      const res = await fetch("/api/tfr");
      if (!res.ok) throw new Error("Failed to fetch");
      setTfrs(await res.json());
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTfrs();
    const interval = setInterval(fetchTfrs, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTfrs]);

  if (loading) {
    return (
      <Card title="TFR Alerts">
        <div className="text-muted text-sm animate-pulse">
          Checking TFRs...
        </div>
      </Card>
    );
  }

  return (
    <Card title="TFR Alerts (100 NM)">
      {tfrs.length === 0 ? (
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-sm font-medium">
            ✓ No active TFRs nearby
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {tfrs.map((tfr, i) => (
            <div
              key={i}
              className="bg-red-950/30 border border-red-900/50 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 text-xs font-bold">⚠ TFR</span>
                <span className="text-xs text-muted">{tfr.notamNumber}</span>
              </div>
              <div className="text-xs text-muted line-clamp-2">
                {tfr.description || tfr.type}
              </div>
              {(tfr.altitudeLow || tfr.altitudeHigh) && (
                <div className="text-xs text-muted mt-1">
                  Alt: {tfr.altitudeLow || "SFC"} - {tfr.altitudeHigh || "UNL"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

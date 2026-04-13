"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface GarbageData {
  trash: { next: string; label: string; day: string };
  recycling: { next: string; label: string; day: string };
}

export function GarbageSchedule() {
  const [data, setData] = useState<GarbageData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/garbage");
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Check once per hour
    const interval = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) return null;

  const isTrashToday = data.trash.label === "Today";
  const isRecyclingToday = data.recycling.label === "Today";
  const isTrashTomorrow = data.trash.label === "Tomorrow";
  const isRecyclingTomorrow = data.recycling.label === "Tomorrow";

  return (
    <Card title="Pickup Schedule">
      <div className="flex gap-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗑️</span>
          <div>
            <div
              className={`text-sm font-medium ${isTrashToday || isTrashTomorrow ? "text-yellow-400" : ""}`}
            >
              {data.trash.label}
            </div>
            <div className="text-xs text-muted">Trash</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">♻️</span>
          <div>
            <div
              className={`text-sm font-medium ${isRecyclingToday || isRecyclingTomorrow ? "text-green-400" : ""}`}
            >
              {data.recycling.label}
            </div>
            <div className="text-xs text-muted">Recycling</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

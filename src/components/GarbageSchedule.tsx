"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface GarbageData {
  trash: { next: string; label: string; day: string };
  recycling: { next: string; label: string; day: string };
}

function TrashIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function RecycleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 12.013 3a1.784 1.784 0 0 1 1.575.887l3.974 6.929" />
      <path d="m20.9 13.4-4.096 1.098 1.097 4.096" />
    </svg>
  );
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
    const interval = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) return null;

  const isTrashSoon = data.trash.label === "Today" || data.trash.label === "Tomorrow";
  const isRecyclingSoon = data.recycling.label === "Today" || data.recycling.label === "Tomorrow";

  return (
    <Card title="Pickup Schedule">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <TrashIcon />
          <div>
            <div className={`text-sm font-medium ${isTrashSoon ? "text-yellow-400" : ""}`}>
              {data.trash.label}
            </div>
            <div className="text-xs text-muted">Trash</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RecycleIcon />
          <div>
            <div className={`text-sm font-medium ${isRecyclingSoon ? "text-green-400" : ""}`}>
              {data.recycling.label}
            </div>
            <div className="text-xs text-muted">Recycling</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";
import type { TafForecast as TafData, TafPeriod } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  VFR: "#22c55e",
  MVFR: "#3b82f6",
  IFR: "#ef4444",
  LIFR: "#d946ef",
};

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || "#71717a";
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: color, color: "#000" }}
    >
      {category}
    </span>
  );
}

function PeriodRow({ period }: { period: TafPeriod }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-card-border last:border-0">
      <CategoryBadge category={period.flightCategory} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted">
          {period.timeFrom} &ndash; {period.timeTo}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-sm">
          <span>{period.wind}</span>
          <span>Vis: {period.visibility}</span>
          <span>{period.ceiling}</span>
        </div>
        {period.weather && (
          <div className="text-sm text-yellow-400 mt-0.5">
            {period.weather}
          </div>
        )}
      </div>
    </div>
  );
}

export function TafForecast() {
  const [taf, setTaf] = useState<TafData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTaf = useCallback(async () => {
    try {
      const res = await fetch("/api/taf");
      if (!res.ok) throw new Error("Failed to fetch");
      setTaf(await res.json());
      setError(null);
    } catch {
      setError("TAF unavailable");
    }
  }, []);

  useEffect(() => {
    fetchTaf();
    const interval = setInterval(fetchTaf, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTaf]);

  if (error) {
    return (
      <Card title="TAF Forecast">
        <div className="text-muted text-sm">{error}</div>
      </Card>
    );
  }

  if (!taf) {
    return (
      <Card title="TAF Forecast">
        <div className="text-muted text-sm animate-pulse">Loading TAF...</div>
      </Card>
    );
  }

  return (
    <Card title={`TAF Forecast \u2014 ${taf.airport}`}>
      <div className="text-muted text-xs mb-2">
        Issued: {taf.issueTime} &middot; Valid: {taf.validFrom} &ndash;{" "}
        {taf.validTo}
      </div>
      <div>
        {taf.periods.map((period, i) => (
          <PeriodRow key={i} period={period} />
        ))}
      </div>
    </Card>
  );
}

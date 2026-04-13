"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";
import type { MetarData } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  VFR: "#22c55e",
  MVFR: "#3b82f6",
  IFR: "#ef4444",
  LIFR: "#d946ef",
};

export function AviationWeather() {
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetar = useCallback(async () => {
    try {
      const res = await fetch("/api/metar");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMetar(data);
      setError(null);
    } catch {
      setError("Aviation weather unavailable");
    }
  }, []);

  useEffect(() => {
    fetchMetar();
    const interval = setInterval(fetchMetar, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetar]);

  if (error) {
    return (
      <Card title="Aviation Weather">
        <div className="text-muted text-sm">{error}</div>
      </Card>
    );
  }

  if (!metar) {
    return (
      <Card title="Aviation Weather">
        <div className="text-muted text-sm animate-pulse">Loading METAR...</div>
      </Card>
    );
  }

  const categoryColor = CATEGORY_COLORS[metar.flightCategory] || "#71717a";

  return (
    <Card title={`Aviation Weather \u2014 ${metar.airport}`}>
      {/* Flight Category Badge */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: categoryColor, color: "#000" }}
        >
          {metar.flightCategory}
        </span>
        <span className="text-muted text-xs">
          Observed: {metar.observationTime}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 text-sm mb-3">
        <div>
          <div className="text-muted text-xs">Wind</div>
          <div>
            {metar.windDirection}&deg; @ {metar.windSpeed} kt
            {metar.windGust ? ` G${metar.windGust}` : ""}
          </div>
        </div>
        <div>
          <div className="text-muted text-xs">Visibility</div>
          <div>{metar.visibility}</div>
        </div>
        <div>
          <div className="text-muted text-xs">Temp / Dew</div>
          <div>
            {metar.temperature}&deg;C / {metar.dewpoint}&deg;C
          </div>
        </div>
        <div>
          <div className="text-muted text-xs">Altimeter</div>
          <div>{metar.altimeter}&quot;</div>
        </div>
      </div>

      {/* Raw METAR */}
      <div className="font-mono text-xs text-muted bg-black/30 rounded-lg p-3 break-all">
        {metar.raw}
      </div>

    </Card>
  );
}

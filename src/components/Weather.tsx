"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card } from "./Card";
import type { WeatherData } from "@/lib/types";

function WeatherIcon({ code, size = 48 }: { code: string; size?: number }) {
  return (
    <Image
      src={`https://openweathermap.org/img/wn/${code}@2x.png`}
      alt="weather"
      width={size}
      height={size}
      unoptimized
    />
  );
}

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch("/api/weather");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWeather(data);
      setError(null);
    } catch {
      setError("Weather unavailable");
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (error) {
    return (
      <Card>
        <div className="text-muted text-sm">{error}</div>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card>
        <div className="text-muted text-sm animate-pulse">
          Loading weather...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <WeatherIcon code={weather.current.icon} size={64} />
        <div>
          <div className="text-4xl font-bold">{weather.current.temp}&deg;</div>
          <div className="text-muted text-sm capitalize">
            {weather.current.description}
          </div>
        </div>
      </div>
      <div className="text-muted text-xs mt-2">
        Feels {weather.current.feelsLike}&deg; &middot; Wind{" "}
        {weather.current.windSpeed} mph &middot; {weather.current.humidity}%
        humidity
      </div>
      {/* Mini forecast */}
      <div className="flex gap-3 mt-3 overflow-x-auto">
        {weather.forecast.map((day) => (
          <div key={day.date} className="text-center text-xs min-w-[3rem]">
            <div className="text-muted">{day.date}</div>
            <WeatherIcon code={day.icon} size={32} />
            <div>
              <span className="text-foreground">{day.high}&deg;</span>{" "}
              <span className="text-muted">{day.low}&deg;</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

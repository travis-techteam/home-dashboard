"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";
import type { WeatherData } from "@/lib/types";

const WEATHER_ICONS: Record<string, string> = {
  "01d": "\u2600\uFE0F",
  "01n": "\uD83C\uDF19",
  "02d": "\u26C5",
  "02n": "\u2601\uFE0F",
  "03d": "\u2601\uFE0F",
  "03n": "\u2601\uFE0F",
  "04d": "\u2601\uFE0F",
  "04n": "\u2601\uFE0F",
  "09d": "\uD83C\uDF27\uFE0F",
  "09n": "\uD83C\uDF27\uFE0F",
  "10d": "\uD83C\uDF26\uFE0F",
  "10n": "\uD83C\uDF27\uFE0F",
  "11d": "\u26C8\uFE0F",
  "11n": "\u26C8\uFE0F",
  "13d": "\uD83C\uDF28\uFE0F",
  "13n": "\uD83C\uDF28\uFE0F",
  "50d": "\uD83C\uDF2B\uFE0F",
  "50n": "\uD83C\uDF2B\uFE0F",
};

function getWeatherIcon(iconCode: string): string {
  return WEATHER_ICONS[iconCode] || "\uD83C\uDF24\uFE0F";
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
        <span className="text-4xl">
          {getWeatherIcon(weather.current.icon)}
        </span>
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
            <div>{getWeatherIcon(day.icon)}</div>
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

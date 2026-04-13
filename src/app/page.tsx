"use client";

import { useState, useEffect } from "react";
import { Clock } from "@/components/Clock";
import { Weather } from "@/components/Weather";
import { AviationWeather } from "@/components/AviationWeather";
import { WeatherRadar } from "@/components/WeatherRadar";
import { Calendar } from "@/components/Calendar";

export default function Home() {
  const [config, setConfig] = useState<{
    weather: { lat: number; lon: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen p-4 flex flex-col gap-4 max-w-[1080px] mx-auto">
      {/* Top section: Clock + Weather side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Clock />
        <Weather />
      </div>

      {/* Aviation Weather */}
      <AviationWeather />

      {/* Weather Radar */}
      {config && (
        <WeatherRadar
          lat={config.weather.lat}
          lon={config.weather.lon}
          zoom={8}
        />
      )}

      {/* Calendar takes remaining space */}
      <Calendar />
    </main>
  );
}

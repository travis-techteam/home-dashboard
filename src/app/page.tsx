"use client";

import { Clock } from "@/components/Clock";
import { Weather } from "@/components/Weather";
import { AviationWeather } from "@/components/AviationWeather";
import { Calendar } from "@/components/Calendar";

export default function Home() {
  return (
    <main className="min-h-screen p-4 flex flex-col gap-4 max-w-[1080px] mx-auto">
      {/* Top section: Clock + Weather side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Clock />
        <Weather />
      </div>

      {/* Aviation Weather */}
      <AviationWeather />

      {/* Calendar takes remaining space */}
      <Calendar />
    </main>
  );
}

"use client";

import { Clock } from "@/components/Clock";
import { Weather } from "@/components/Weather";
import { SunriseSunset } from "@/components/SunriseSunset";
import { Cameras } from "@/components/CameraFeed";
import { AviationWeather } from "@/components/AviationWeather";
import { TafForecast } from "@/components/TafForecast";
import { SportsScores } from "@/components/SportsScores";
import { GarbageSchedule } from "@/components/GarbageSchedule";
import { Calendar } from "@/components/Calendar";

const CAMERAS = [
  { name: "Driveway", streamName: "driveway" },
  { name: "Front Yard", streamName: "front_yard" },
];

export default function Home() {
  return (
    <main className="min-h-screen p-4 flex flex-col gap-4 max-w-[1080px] mx-auto">
      {/* Top section: Clock + Weather side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Clock />
        <Weather />
      </div>

      {/* Sunrise/Sunset */}
      <SunriseSunset />

      {/* Camera Feeds */}
      <Cameras cameras={CAMERAS} />

      {/* Aviation section */}
      <AviationWeather />
      <TafForecast />

      {/* Sports + Garbage side by side */}
      <div className="grid grid-cols-2 gap-4">
        <SportsScores />
        <GarbageSchedule />
      </div>

      {/* Calendar */}
      <Calendar />
    </main>
  );
}

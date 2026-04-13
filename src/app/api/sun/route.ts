import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  const config = getConfig();
  const { lat, lon } = config.weather;

  try {
    const res = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch sun data" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const results = data.results;

    return NextResponse.json({
      sunrise: results.sunrise,
      sunset: results.sunset,
      civilTwilightBegin: results.civil_twilight_begin,
      civilTwilightEnd: results.civil_twilight_end,
      dayLength: results.day_length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sun data" },
      { status: 500 }
    );
  }
}

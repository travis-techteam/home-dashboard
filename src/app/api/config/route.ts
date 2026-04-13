import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

// Expose non-sensitive config to the client (coordinates, airport, etc.)
export async function GET() {
  const config = getConfig();

  return NextResponse.json({
    weather: {
      lat: config.weather.lat,
      lon: config.weather.lon,
      units: config.weather.units,
    },
    aviation: {
      airport: config.aviation.airport,
    },
  });
}

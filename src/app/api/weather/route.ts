import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import type { WeatherData } from "@/lib/types";

export async function GET() {
  const config = getConfig();
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { lat, lon, units } = config.weather;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather data" },
        { status: 502 }
      );
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    // Group forecast by day and get high/low
    const dailyMap = new Map<
      string,
      { high: number; low: number; description: string; icon: string }
    >();

    for (const item of forecast.list) {
      const date = new Date(item.dt * 1000).toLocaleDateString("en-US", {
        weekday: "short",
      });
      const existing = dailyMap.get(date);
      if (existing) {
        existing.high = Math.max(existing.high, item.main.temp_max);
        existing.low = Math.min(existing.low, item.main.temp_min);
      } else {
        dailyMap.set(date, {
          high: item.main.temp_max,
          low: item.main.temp_min,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        });
      }
    }

    const dailyForecast = Array.from(dailyMap.entries())
      .slice(0, 5)
      .map(([date, data]) => ({
        date,
        high: Math.round(data.high),
        low: Math.round(data.low),
        description: data.description,
        icon: data.icon,
      }));

    const weatherData: WeatherData = {
      current: {
        temp: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed),
        windDir: current.wind.deg,
      },
      forecast: dailyForecast,
      location: current.name,
    };

    return NextResponse.json(weatherData);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}

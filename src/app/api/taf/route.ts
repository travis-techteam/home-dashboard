import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import type { TafPeriod, TafForecast } from "@/lib/types";

function getFlightCategory(
  visib: string | null,
  clouds: Array<{ cover: string; base: number | null }>
): string {
  const ceiling = clouds.find(
    (c) => c.cover === "BKN" || c.cover === "OVC"
  );
  const ceilingAlt = ceiling?.base ?? 99999;

  // Parse visibility — "6+" means > 6 SM
  let vis = 99;
  if (visib) {
    if (visib === "6+" || visib === "P6SM") {
      vis = 7;
    } else {
      const parsed = parseFloat(visib);
      if (!isNaN(parsed)) vis = parsed;
    }
  }

  if (vis < 1 || ceilingAlt < 500) return "LIFR";
  if (vis < 3 || ceilingAlt < 1000) return "IFR";
  if (vis <= 5 || ceilingAlt <= 3000) return "MVFR";
  return "VFR";
}

function formatWind(dir: number | null, spd: number | null, gust: number | null): string {
  if (dir === null && spd === null) return "Calm";
  const d = dir ?? 0;
  const s = spd ?? 0;
  if (s === 0) return "Calm";
  let wind = `${String(d).padStart(3, "0")}° @ ${s} kt`;
  if (gust) wind += ` G${gust}`;
  return wind;
}

function formatCeiling(clouds: Array<{ cover: string; base: number | null }>): string {
  if (!clouds || clouds.length === 0) return "CLR";
  return clouds
    .map((c) => {
      const base = c.base ? `${Math.round(c.base / 100) * 100}` : "";
      return `${c.cover} ${base}`.trim();
    })
    .join(", ");
}

function formatTime(epoch: number): string {
  const d = new Date(epoch * 1000);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

export async function GET() {
  const config = getConfig();
  const airport = config.aviation.airport;

  try {
    const res = await fetch(
      `https://aviationweather.gov/api/data/taf?ids=${airport}&format=json`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch TAF" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.length) {
      return NextResponse.json(
        { error: `No TAF data for ${airport}` },
        { status: 404 }
      );
    }

    const taf = data[0];
    const periods: TafPeriod[] = (taf.fcsts || []).map(
      (f: {
        timeFrom: number;
        timeTo: number;
        fcstChange: string | null;
        wdir: number | null;
        wspd: number | null;
        wgst: number | null;
        visib: string | null;
        wxString: string | null;
        clouds: Array<{ cover: string; base: number | null }>;
      }) => ({
        timeFrom: formatTime(f.timeFrom),
        timeTo: formatTime(f.timeTo),
        flightCategory: getFlightCategory(f.visib, f.clouds || []),
        wind: formatWind(f.wdir, f.wspd, f.wgst),
        visibility: f.visib === "6+" ? "> 6 SM" : f.visib ? `${f.visib} SM` : "N/A",
        ceiling: formatCeiling(f.clouds || []),
        weather: f.wxString || "",
        changeType: f.fcstChange || "",
      })
    );

    const result: TafForecast = {
      airport: taf.icaoId,
      rawTAF: taf.rawTAF,
      issueTime: new Date(taf.issueTime).toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      }),
      validFrom: formatTime(taf.validTimeFrom),
      validTo: formatTime(taf.validTimeTo),
      periods,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch TAF" },
      { status: 500 }
    );
  }
}

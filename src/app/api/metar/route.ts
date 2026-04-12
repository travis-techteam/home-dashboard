import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import type { MetarData } from "@/lib/types";

export async function GET() {
  const config = getConfig();
  const airport = config.aviation.airport;

  try {
    // Fetch METAR and TAF from Aviation Weather Center (aviationweather.gov)
    const [metarRes, tafRes] = await Promise.all([
      fetch(
        `https://aviationweather.gov/api/data/metar?ids=${airport}&format=json`
      ),
      fetch(
        `https://aviationweather.gov/api/data/taf?ids=${airport}&format=raw`
      ),
    ]);

    if (!metarRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch METAR" },
        { status: 502 }
      );
    }

    const metarJson = await metarRes.json();
    const tafText = tafRes.ok ? await tafRes.text() : null;

    if (!metarJson.length) {
      return NextResponse.json(
        { error: `No METAR data for ${airport}` },
        { status: 404 }
      );
    }

    const m = metarJson[0];

    // Determine flight category from visibility and ceiling
    function getFlightCategory(
      visib: number | null,
      clouds: Array<{ cover: string; base: number | null }>
    ): string {
      const ceiling = clouds.find(
        (c) => c.cover === "BKN" || c.cover === "OVC"
      );
      const ceilingAlt = ceiling?.base ?? 99999;
      const vis = visib ?? 99;

      if (vis < 1 || ceilingAlt < 500) return "LIFR";
      if (vis < 3 || ceilingAlt < 1000) return "IFR";
      if (vis <= 5 || ceilingAlt <= 3000) return "MVFR";
      return "VFR";
    }

    const clouds = m.clouds || [];
    const cloudStr = clouds
      .map(
        (c: { cover: string; base: number | null }) =>
          `${c.cover}${c.base ? String(c.base).padStart(3, "0") : ""}`
      )
      .join(" ") || "CLR";

    const data: MetarData = {
      raw: m.rawOb,
      airport: m.icaoId,
      temperature: m.temp ?? null,
      dewpoint: m.dewp ?? null,
      windSpeed: m.wspd ?? null,
      windDirection: m.wdir ?? null,
      windGust: m.wgst ?? null,
      visibility: m.visib != null ? `${m.visib} SM` : "N/A",
      altimeter: m.altim != null ? `${(m.altim * 0.02953).toFixed(2)}` : "N/A",
      flightCategory: getFlightCategory(m.visib, clouds),
      clouds: cloudStr,
      observationTime: m.reportTime,
      taf: tafText?.trim() || null,
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch aviation weather" },
      { status: 500 }
    );
  }
}

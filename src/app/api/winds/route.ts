import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  const config = getConfig();
  const airport = config.aviation.airport;

  try {
    // Fetch winds aloft (FB) from aviationweather.gov
    const res = await fetch(
      `https://aviationweather.gov/api/data/windtemp?region=all&level=low&fcst=06`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch winds aloft" },
        { status: 502 }
      );
    }

    const text = await res.text();

    // Parse the winds aloft text to find our station
    // The format has station IDs (3-letter) and wind data at various altitudes
    // Convert ICAO (4-letter) to FAA (3-letter) by removing the K prefix
    const stationId = airport.startsWith("K") ? airport.substring(1) : airport;

    const lines = text.split("\n");
    let headerLine = "";
    let stationLine = "";

    for (const line of lines) {
      if (line.includes("FT") && line.includes("3000")) {
        headerLine = line.trim();
      }
      if (line.trim().startsWith(stationId)) {
        stationLine = line.trim();
        break;
      }
    }

    if (!stationLine) {
      return NextResponse.json({
        station: stationId,
        raw: `No winds aloft data for ${stationId}`,
        altitudes: [],
      });
    }

    // Parse altitude levels from header
    const altLabels = ["3000", "6000", "9000", "12000"];

    // The station line has the station ID followed by wind groups
    // Each wind group is 4 digits (direction + speed) or 6 digits (with temp)
    const parts = stationLine.substring(stationId.length).trim();
    const windGroups = parts.split(/\s+/);

    const altitudes = altLabels.slice(0, windGroups.length).map((alt, i) => {
      const group = windGroups[i] || "";
      let direction = "";
      let speed = "";
      let temp = "";

      if (group === "9900" || group.startsWith("9900")) {
        direction = "CALM";
        speed = "0";
        temp = group.length > 4 ? group.substring(4) : "";
      } else if (group.length >= 4) {
        const dirNum = parseInt(group.substring(0, 2)) * 10;
        const spdNum = parseInt(group.substring(2, 4));

        if (dirNum > 360) {
          // Wind > 100kts: subtract 50 from direction, add 100 to speed
          direction = `${dirNum - 500}°`;
          speed = `${spdNum + 100}`;
        } else {
          direction = `${dirNum}°`;
          speed = `${spdNum}`;
        }
        temp = group.length > 4 ? group.substring(4) : "";
      }

      // Parse temperature (can be negative with leading minus or positive)
      let tempStr = "";
      if (temp) {
        const tempVal = parseInt(temp);
        tempStr = `${tempVal > 0 ? "+" : ""}${tempVal}°C`;
      }

      return {
        altitude: alt,
        direction,
        speed: speed ? `${speed} kt` : "",
        temperature: tempStr,
      };
    });

    return NextResponse.json({
      station: stationId,
      raw: stationLine,
      altitudes,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch winds aloft" },
      { status: 500 }
    );
  }
}

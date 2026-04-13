import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

interface TfrInfo {
  notamNumber: string;
  type: string;
  facility: string;
  state: string;
  description: string;
  effectiveStart: string;
  effectiveEnd: string;
  altitudeLow: string;
  altitudeHigh: string;
}

export async function GET() {
  const config = getConfig();
  const { lat, lon } = config.weather;

  try {
    // FAA TFR API — fetches active TFRs
    const res = await fetch(
      "https://tfr.faa.gov/tfr2/list.json",
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      // Fallback: try the ADDS TFR source
      return await fetchFromADDS(lat, lon);
    }

    const data = await res.json();

    // Filter TFRs within ~100nm of our location
    const nearby: TfrInfo[] = [];
    const maxDistance = 100; // nautical miles

    for (const tfr of data.features || data || []) {
      const props = tfr.properties || tfr;
      const tfrLat = props.latitude || props.lat;
      const tfrLon = props.longitude || props.lon || props.lng;

      if (tfrLat && tfrLon) {
        const dist = getDistanceNM(lat, lon, tfrLat, tfrLon);
        if (dist <= maxDistance) {
          nearby.push({
            notamNumber: props.notamNumber || props.notam || "N/A",
            type: props.type || props.reason || "TFR",
            facility: props.facility || "",
            state: props.state || "",
            description: props.description || props.text || "",
            effectiveStart: props.effectiveStart || props.startDate || "",
            effectiveEnd: props.effectiveEnd || props.endDate || "",
            altitudeLow: props.altitudeLow || props.lowAlt || "",
            altitudeHigh: props.altitudeHigh || props.highAlt || "",
          });
        }
      }
    }

    return NextResponse.json(nearby);
  } catch {
    return await fetchFromADDS(lat, lon);
  }
}

async function fetchFromADDS(lat: number, lon: number) {
  try {
    // Use aviationweather.gov NOTAM/TFR endpoint as fallback
    const res = await fetch(
      `https://aviationweather.gov/api/data/notam?icao=K&lat=${lat}&lon=${lon}&dist=100&type=tfr&format=json`
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(
      (data || []).map(
        (n: {
          notamID?: string;
          type?: string;
          facilityDesignator?: string;
          state?: string;
          traditionalMessage?: string;
          effectiveStart?: string;
          effectiveEnd?: string;
        }) => ({
          notamNumber: n.notamID || "N/A",
          type: n.type || "TFR",
          facility: n.facilityDesignator || "",
          state: n.state || "",
          description: n.traditionalMessage || "",
          effectiveStart: n.effectiveStart || "",
          effectiveEnd: n.effectiveEnd || "",
          altitudeLow: "",
          altitudeHigh: "",
        })
      )
    );
  } catch {
    return NextResponse.json([]);
  }
}

function getDistanceNM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

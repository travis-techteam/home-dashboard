"use client";

import { Card } from "./Card";

interface WeatherRadarProps {
  lat: number;
  lon: number;
  zoom?: number;
}

export function WeatherRadar({
  lat = 39.0997,
  lon = -94.5786,
  zoom = 8,
}: WeatherRadarProps) {
  // RainViewer embed — free, no API key, animated radar
  const radarUrl = `https://www.rainviewer.com/map.html?loc=${lat},${lon},${zoom}&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&rmt=4&c=1&o=83&lm=1&layer=radar&sm=1&sn=1`;

  return (
    <Card title="Weather Radar">
      <div className="rounded-lg overflow-hidden -mx-1">
        <iframe
          src={radarUrl}
          width="100%"
          height="400"
          frameBorder="0"
          style={{ border: "none", borderRadius: "0.5rem" }}
          title="Weather Radar"
          allowFullScreen
        />
      </div>
    </Card>
  );
}

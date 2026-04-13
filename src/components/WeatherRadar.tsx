"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface WeatherRadarProps {
  lat: number;
  lon: number;
  zoom?: number;
}

// Convert lat/lon/zoom to tile coordinates
function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

// Build a grid of tiles centered on the target location
function buildTileGrid(
  lat: number,
  lon: number,
  zoom: number,
  gridSize: number = 3
) {
  const center = latLonToTile(lat, lon, zoom);
  const offset = Math.floor(gridSize / 2);
  const tiles: { x: number; y: number; row: number; col: number }[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      tiles.push({
        x: center.x - offset + col,
        y: center.y - offset + row,
        row,
        col,
      });
    }
  }

  return tiles;
}

export function WeatherRadar({ lat, lon, zoom = 7 }: WeatherRadarProps) {
  const [radarPath, setRadarPath] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const fetchRadarData = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.rainviewer.com/public/weather-maps.json"
      );
      const data = await res.json();
      const latest = data.radar.past[data.radar.past.length - 1];
      setRadarPath(latest.path);
      const time = new Date(latest.time * 1000);
      setTimestamp(
        time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch {
      // Silently fail — radar is non-critical
    }
  }, []);

  useEffect(() => {
    fetchRadarData();
    const interval = setInterval(fetchRadarData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRadarData]);

  const gridSize = 3;
  const tileSize = 256;
  const tiles = buildTileGrid(lat, lon, zoom, gridSize);
  const totalSize = gridSize * tileSize;

  return (
    <Card title="Weather Radar">
      {timestamp && (
        <div className="text-muted text-xs mb-2">Updated: {timestamp}</div>
      )}
      <div
        className="relative rounded-lg overflow-hidden mx-auto"
        style={{ width: "100%", paddingBottom: "100%", maxWidth: totalSize }}
      >
        <div
          className="absolute inset-0"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {/* Base map tiles (OpenStreetMap dark) */}
          {tiles.map((tile) => (
            /* eslint-disable @next/next/no-img-element */
            <img
              key={`base-${tile.row}-${tile.col}`}
              src={`https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${tile.x}/${tile.y}.png`}
              alt=""
              width={tileSize}
              height={tileSize}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          ))}
        </div>
        {/* Radar overlay */}
        {radarPath && (
          <div
            className="absolute inset-0"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {tiles.map((tile) => (
              <img
                key={`radar-${tile.row}-${tile.col}`}
                src={`https://tilecache.rainviewer.com${radarPath}/${tileSize}/${zoom}/${tile.x}/${tile.y}/4/1_1.png`}
                alt=""
                width={tileSize}
                height={tileSize}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

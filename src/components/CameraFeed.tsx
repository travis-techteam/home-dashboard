"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "./Card";

interface CameraStreamProps {
  name: string;
  streamName: string;
  refreshInterval?: number;
}

/* eslint-disable @next/next/no-img-element */

function CameraSnapshot({
  name,
  streamName,
  refreshInterval = 5000,
}: CameraStreamProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [error, setError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchFrame = () => {
      // Add timestamp to bust cache
      const url = `/api/camera?src=${streamName}&t=${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        if (mounted) {
          setImgSrc(url);
          setError(false);
        }
      };
      img.onerror = () => {
        if (mounted) setError(true);
      };
      img.src = url;
    };

    fetchFrame();
    timerRef.current = setInterval(fetchFrame, refreshInterval);

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streamName, refreshInterval]);

  return (
    <div className="relative">
      {error || !imgSrc ? (
        <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
          <span className="text-muted text-sm">
            {error ? "Camera offline" : "Connecting..."}
          </span>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={name}
          className="w-full rounded-lg bg-black aspect-video object-cover"
        />
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {name}
      </div>
    </div>
  );
}

interface CamerasProps {
  cameras: { name: string; streamName: string }[];
}

export function Cameras({ cameras }: CamerasProps) {
  if (!cameras || cameras.length === 0) return null;

  return (
    <Card title="Cameras">
      <div className="grid grid-cols-2 gap-2">
        {cameras.map((cam) => (
          <CameraSnapshot
            key={cam.streamName}
            name={cam.name}
            streamName={cam.streamName}
          />
        ))}
      </div>
    </Card>
  );
}

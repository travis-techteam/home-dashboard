"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";

interface CameraFeedProps {
  name: string;
  streamName: string;
  go2rtcHost?: string;
}

function CameraStream({ name, streamName, go2rtcHost = "localhost:1984" }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use MSE (Media Source Extensions) for low-overhead playback
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    video.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", () => {
      // Connect to go2rtc MSE WebSocket
      const wsUrl = `ws://${go2rtcHost}/api/ws?src=${streamName}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = "arraybuffer";

      let sourceBuffer: SourceBuffer | null = null;
      const queue: ArrayBuffer[] = [];
      let mimeType = "";

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          // First message is the codec info as JSON
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "mse") {
              mimeType = msg.value;
              if (MediaSource.isTypeSupported(mimeType)) {
                sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                sourceBuffer.mode = "segments";
                sourceBuffer.addEventListener("updateend", () => {
                  if (queue.length > 0 && sourceBuffer && !sourceBuffer.updating) {
                    sourceBuffer.appendBuffer(queue.shift()!);
                  }
                });
              }
            }
          } catch {
            // Ignore non-JSON text messages
          }
          return;
        }

        // Binary data — append to source buffer
        if (sourceBuffer) {
          if (sourceBuffer.updating || queue.length > 0) {
            // Limit queue size to prevent memory issues on Pi
            if (queue.length < 10) {
              queue.push(event.data);
            }
          } else {
            try {
              sourceBuffer.appendBuffer(event.data);
            } catch {
              // Buffer full or other error — skip frame
            }
          }
        }
      };

      ws.onerror = () => setError(true);
      ws.onclose = () => {
        // Attempt reconnect after 5 seconds
        setTimeout(() => {
          setError(false);
          // Force re-mount by toggling error state
        }, 5000);
      };

      video.play().catch(() => {
        // Autoplay may be blocked — muted videos usually work
      });
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (video.src) {
        URL.revokeObjectURL(video.src);
        video.src = "";
      }
    };
  }, [streamName, go2rtcHost]);

  if (error) {
    return (
      <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
        <span className="text-muted text-sm">Camera offline</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-lg bg-black aspect-video object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {name}
      </div>
    </div>
  );
}

interface CamerasProps {
  cameras: { name: string; streamName: string }[];
  go2rtcHost?: string;
}

export function Cameras({ cameras, go2rtcHost }: CamerasProps) {
  if (!cameras || cameras.length === 0) return null;

  return (
    <Card title="Cameras">
      <div className="grid grid-cols-2 gap-2">
        {cameras.map((cam) => (
          <CameraStream
            key={cam.streamName}
            name={cam.name}
            streamName={cam.streamName}
            go2rtcHost={go2rtcHost}
          />
        ))}
      </div>
    </Card>
  );
}

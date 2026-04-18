"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";

interface CameraStreamProps {
  name: string;
  streamName: string;
  go2rtcHost?: string;
}

function CameraStream({ name, streamName, go2rtcHost }: CameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Derive go2rtc host from current location if not specified
    // Assumes go2rtc is on the same host as the dashboard, port 1984
    const host = go2rtcHost || `${window.location.hostname}:1984`;

    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      const wsUrl = `ws://${host}/api/ws?src=${streamName}`;
      ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";

      let sourceBuffer: SourceBuffer | null = null;
      const queue: ArrayBuffer[] = [];

      ws.onopen = () => {
        // Request MSE video
        ws?.send(
          JSON.stringify({
            type: "mse",
            value: "video/mp4; codecs=\"avc1.640028,mp4a.40.2\"",
          })
        );
      };

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "mse" && mediaSource.readyState === "open") {
              const mimeType = msg.value;
              if (MediaSource.isTypeSupported(mimeType) && !sourceBuffer) {
                try {
                  sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                  sourceBuffer.mode = "segments";
                  sourceBuffer.addEventListener("updateend", () => {
                    if (
                      queue.length > 0 &&
                      sourceBuffer &&
                      !sourceBuffer.updating
                    ) {
                      try {
                        sourceBuffer.appendBuffer(queue.shift()!);
                      } catch {
                        // Buffer error — skip
                      }
                    }
                    // Prune old buffered content to prevent memory growth
                    if (sourceBuffer && video.buffered.length > 0) {
                      const start = video.buffered.start(0);
                      const end = video.currentTime - 10;
                      if (end > start && !sourceBuffer.updating) {
                        try {
                          sourceBuffer.remove(start, end);
                        } catch {
                          // Ignore
                        }
                      }
                    }
                  });
                  setError(false);
                } catch (e) {
                  console.error("Failed to add source buffer:", e);
                  setError(true);
                }
              }
            }
          } catch {
            // Ignore non-JSON messages
          }
          return;
        }

        // Binary frame data
        if (sourceBuffer) {
          if (sourceBuffer.updating || queue.length > 0) {
            if (queue.length < 30) {
              queue.push(event.data);
            }
          } else {
            try {
              sourceBuffer.appendBuffer(event.data);
            } catch {
              // Skip frame
            }
          }
        }
      };

      ws.onerror = () => {
        setError(true);
      };

      ws.onclose = () => {
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    mediaSource.addEventListener("sourceopen", () => {
      connect();
      video.play().catch(() => {
        // Autoplay may fail — video is muted so should work
      });
    });

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
        ws = null;
      }
      if (video.src) {
        URL.revokeObjectURL(video.src);
        video.src = "";
      }
    };
  }, [streamName, go2rtcHost]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-lg bg-black aspect-video object-cover"
      />
      {error && (
        <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
          <span className="text-muted text-sm">Reconnecting...</span>
        </div>
      )}
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

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, stat } from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const CAMERAS: Record<string, string> = {
  driveway: "rtsps://192.168.220.2:7441/ByeZD4pWnMEDmtDz?enableSrtp",
  front_yard: "rtsps://192.168.220.2:7441/IaqiXzt5UEjo5680?enableSrtp",
};

// Cache snapshots to disk to avoid overlapping ffmpeg calls
const CACHE_MAX_AGE_MS = 3000; // Only refetch if cache is older than 3s

async function getCachedSnapshot(
  src: string,
  rtspUrl: string
): Promise<Buffer> {
  const cachePath = path.join(os.tmpdir(), `cam_${src}.jpg`);

  // Check if cached file is fresh enough
  try {
    const fileStat = await stat(cachePath);
    const age = Date.now() - fileStat.mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      return await readFile(cachePath);
    }
  } catch {
    // No cache file — continue to fetch
  }

  // Grab a fresh frame via ffmpeg (async — doesn't block event loop)
  const tmpPath = path.join(os.tmpdir(), `cam_${src}_tmp.jpg`);
  await execAsync(
    `ffmpeg -y -rtsp_transport tcp -i '${rtspUrl}' -frames:v 1 -q:v 8 -update 1 '${tmpPath}'`,
    { timeout: 8000 }
  );

  const buffer = await readFile(tmpPath);
  // Write to cache atomically
  await writeFile(cachePath, buffer);
  return buffer;
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");

  if (!src || !CAMERAS[src]) {
    return NextResponse.json(
      { error: "Invalid camera source" },
      { status: 400 }
    );
  }

  try {
    const buffer = await getCachedSnapshot(src, CAMERAS[src]);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    // Return last cached frame if available
    try {
      const cachePath = path.join(os.tmpdir(), `cam_${src}.jpg`);
      const buffer = await readFile(cachePath);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to capture frame" },
        { status: 500 }
      );
    }
  }
}

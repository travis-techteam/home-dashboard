import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

const CAMERAS: Record<string, string> = {
  driveway: "rtsps://192.168.220.2:7441/ByeZD4pWnMEDmtDz?enableSrtp",
  front_yard: "rtsps://192.168.220.2:7441/IaqiXzt5UEjo5680?enableSrtp",
};

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");

  if (!src || !CAMERAS[src]) {
    return NextResponse.json(
      { error: "Invalid camera source" },
      { status: 400 }
    );
  }

  const rtspUrl = CAMERAS[src];

  try {
    // Grab a single frame via ffmpeg — outputs to stdout as JPEG
    const buffer = execSync(
      `ffmpeg -y -rtsp_transport tcp -i '${rtspUrl}' -frames:v 1 -q:v 5 -update 1 -f image2 pipe:1`,
      {
        timeout: 10000,
        maxBuffer: 1024 * 1024, // 1MB
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to capture frame" },
      { status: 500 }
    );
  }
}

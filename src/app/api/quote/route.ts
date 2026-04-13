import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/today");

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quote" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const quote = data[0];

    return NextResponse.json({
      text: quote.q,
      author: quote.a,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

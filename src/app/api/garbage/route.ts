import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getNextPickupDate(
  day: string,
  frequency: "weekly" | "biweekly",
  startDate?: string
): Date {
  const now = new Date();
  const targetDay = DAYS.indexOf(day);

  if (targetDay === -1) return now;

  // Find the next occurrence of the target day
  const next = new Date(now);
  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // If it's today, show today
    next.setHours(0, 0, 0, 0);
    if (frequency === "biweekly" && startDate) {
      if (!isCorrectBiweeklyWeek(next, startDate)) {
        daysUntil = 7;
      }
    }
  }

  next.setDate(now.getDate() + daysUntil);
  next.setHours(0, 0, 0, 0);

  if (frequency === "biweekly" && startDate) {
    if (!isCorrectBiweeklyWeek(next, startDate)) {
      next.setDate(next.getDate() + 7);
    }
  }

  return next;
}

function isCorrectBiweeklyWeek(date: Date, startDate: string): boolean {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks % 2 === 0;
}

function formatRelative(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export async function GET() {
  const config = getConfig();

  if (!config.garbage) {
    return NextResponse.json({ error: "Garbage schedule not configured" }, { status: 404 });
  }

  const trashDate = getNextPickupDate(
    config.garbage.trash.day,
    config.garbage.trash.frequency,
    config.garbage.trash.startDate
  );
  const recyclingDate = getNextPickupDate(
    config.garbage.recycling.day,
    config.garbage.recycling.frequency,
    config.garbage.recycling.startDate
  );

  return NextResponse.json({
    trash: {
      next: trashDate.toISOString(),
      label: formatRelative(trashDate),
      day: config.garbage.trash.day,
    },
    recycling: {
      next: recyclingDate.toISOString(),
      label: formatRelative(recyclingDate),
      day: config.garbage.recycling.day,
    },
  });
}

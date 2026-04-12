import { NextResponse } from "next/server";
import ICAL from "ical.js";
import { getConfig } from "@/lib/config";
import type { CalendarEvent } from "@/lib/types";

export async function GET() {
  const config = getConfig();
  const calendars = config.calendars.filter((c) => c.icsUrl);

  if (calendars.length === 0) {
    return NextResponse.json([]);
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endRange = new Date(now);
  endRange.setDate(endRange.getDate() + 7);

  const allEvents: CalendarEvent[] = [];

  await Promise.all(
    calendars.map(async (cal) => {
      try {
        const res = await fetch(cal.icsUrl);
        if (!res.ok) return;
        const text = await res.text();

        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");

        for (const vevent of vevents) {
          const event = new ICAL.Event(vevent);

          const start = event.startDate?.toJSDate();
          const end = event.endDate?.toJSDate();

          if (!start) continue;
          if (end && end < startOfDay) continue;
          if (start > endRange) continue;

          const isAllDay =
            event.startDate?.isDate === true;

          allEvents.push({
            id: `${cal.name}-${event.uid}-${start.toISOString()}`,
            title: event.summary || "Untitled",
            start: start.toISOString(),
            end: end ? end.toISOString() : start.toISOString(),
            allDay: isAllDay,
            calendarName: cal.name,
            calendarColor: cal.color,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch calendar for ${cal.name}:`, err);
      }
    })
  );

  allEvents.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return NextResponse.json(allEvents);
}

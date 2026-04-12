"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";
import type { CalendarEvent } from "@/lib/types";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupEventsByDay(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dayKey = new Date(event.start).toDateString();
    const existing = groups.get(dayKey) || [];
    existing.push(event);
    groups.set(dayKey, existing);
  }

  return groups;
}

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data);
      setError(null);
    } catch {
      setError("Calendar unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (loading) {
    return (
      <Card title="Calendar">
        <div className="text-muted text-sm animate-pulse">
          Loading calendar...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Calendar">
        <div className="text-muted text-sm">{error}</div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card title="Calendar">
        <div className="text-muted text-sm">
          No upcoming events. Add ICS URLs to dashboard.config.json to get
          started.
        </div>
      </Card>
    );
  }

  const grouped = groupEventsByDay(events);

  // Collect unique calendar names for legend
  const calendarNames = [
    ...new Map(events.map((e) => [e.calendarName, e.calendarColor])).entries(),
  ];

  return (
    <Card title="Calendar">
      {/* Legend */}
      {calendarNames.length > 1 && (
        <div className="flex gap-4 mb-3">
          {calendarNames.map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Events grouped by day */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([dayKey, dayEvents]) => (
          <div key={dayKey}>
            <div className="text-sm font-semibold text-muted mb-2">
              {formatDayHeader(dayEvents[0].start)}
            </div>
            <div className="space-y-1.5">
              {dayEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2">
                  <span
                    className="w-1 rounded-full mt-1 self-stretch min-h-[1.25rem]"
                    style={{ backgroundColor: event.calendarColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-muted">
                      {event.allDay
                        ? "All day"
                        : `${formatTime(event.start)} - ${formatTime(event.end)}`}
                    </div>
                  </div>
                  <span
                    className="text-xs text-muted shrink-0"
                  >
                    {event.calendarName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

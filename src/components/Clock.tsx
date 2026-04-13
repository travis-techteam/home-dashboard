"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface Quote {
  text: string;
  author: string;
}

export function Clock() {
  const [now, setNow] = useState(new Date());
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch("/api/quote");
      if (!res.ok) throw new Error("Failed to fetch");
      setQuote(await res.json());
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card>
      <div className="text-5xl font-bold tracking-tight">{time}</div>
      <div className="text-muted text-lg mt-1">{date}</div>
      {quote && (
        <div className="mt-3 pt-3 border-t border-card-border">
          <div className="italic text-sm leading-relaxed text-muted">
            &ldquo;{quote.text}&rdquo;
          </div>
          <div className="text-xs text-muted/60 mt-1 text-right">
            &mdash; {quote.author}
          </div>
        </div>
      )}
    </Card>
  );
}

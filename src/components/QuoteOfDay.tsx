"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface Quote {
  text: string;
  author: string;
}

export function QuoteOfDay() {
  const [quote, setQuote] = useState<Quote | null>(null);

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
    // Refresh once per hour (quote is daily anyway)
    const interval = setInterval(fetchQuote, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  if (!quote) return null;

  return (
    <Card>
      <div className="italic text-sm leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </div>
      <div className="text-muted text-xs mt-2 text-right">
        &mdash; {quote.author}
      </div>
    </Card>
  );
}

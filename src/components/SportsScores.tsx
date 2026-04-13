"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface GameInfo {
  team: string;
  league: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  detail: string;
  isLive: boolean;
  startTime: string;
}

function formatGameTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function SportsScores() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/sports");
      if (!res.ok) throw new Error("Failed to fetch");
      setGames(await res.json());
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    // Refresh every 2 minutes during games, 10 minutes otherwise
    const interval = setInterval(fetchScores, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  if (loading) {
    return (
      <Card title="Sports">
        <div className="text-muted text-sm animate-pulse">Loading scores...</div>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card title="Sports">
        <div className="text-muted text-sm">No games today</div>
      </Card>
    );
  }

  return (
    <Card title="Sports">
      <div className="space-y-3">
        {games.map((game, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-medium">
                  {game.league}
                </span>
                {game.isLive && (
                  <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="text-sm">
                  <span className="font-medium">{game.awayTeam}</span>
                  <span className="text-muted mx-2">
                    {game.status === "STATUS_SCHEDULED" ? "@" : game.awayScore}
                  </span>
                </div>
                {game.status !== "STATUS_SCHEDULED" && (
                  <span className="text-muted text-xs">-</span>
                )}
                <div className="text-sm">
                  {game.status !== "STATUS_SCHEDULED" && (
                    <span className="text-muted mr-2">{game.homeScore}</span>
                  )}
                  <span className="font-medium">{game.homeTeam}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted text-right">
              {game.status === "STATUS_SCHEDULED"
                ? formatGameTime(game.startTime)
                : game.detail}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

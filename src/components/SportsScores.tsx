"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";

interface GameInfo {
  team: string;
  league: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeRecord: string;
  awayRecord: string;
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

/* eslint-disable @next/next/no-img-element */

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
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted font-medium">
                {game.league}
              </span>
              {game.isLive && (
                <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">
                  LIVE
                </span>
              )}
              <span className="text-xs text-muted ml-auto">
                {game.status === "STATUS_SCHEDULED"
                  ? formatGameTime(game.startTime)
                  : game.detail}
              </span>
            </div>
            {/* Away team */}
            <div className="flex items-center gap-3 mb-1">
              {game.awayLogo && (
                <img src={game.awayLogo} alt="" width={24} height={24} />
              )}
              <span className="text-sm font-medium">{game.awayTeam}</span>
              {game.awayRecord && (
                <span className="text-xs text-muted">({game.awayRecord})</span>
              )}
              <span className="flex-1" />
              <span className="text-sm font-bold tabular-nums">
                {game.status !== "STATUS_SCHEDULED" ? game.awayScore : ""}
              </span>
            </div>
            {/* Home team */}
            <div className="flex items-center gap-3">
              {game.homeLogo && (
                <img src={game.homeLogo} alt="" width={24} height={24} />
              )}
              <span className="text-sm font-medium">{game.homeTeam}</span>
              {game.homeRecord && (
                <span className="text-xs text-muted">({game.homeRecord})</span>
              )}
              <span className="flex-1" />
              <span className="text-sm font-bold tabular-nums">
                {game.status !== "STATUS_SCHEDULED" ? game.homeScore : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

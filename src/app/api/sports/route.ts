import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

interface GameInfo {
  team: string;
  league: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  detail: string;
  isLive: boolean;
  startTime: string;
}

const LEAGUE_URLS: Record<string, string> = {
  nfl: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  mlb: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  nba: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  nhl: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
  mls: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard",
};

export async function GET() {
  const config = getConfig();
  const teams = config.sports || [];

  if (teams.length === 0) {
    return NextResponse.json([]);
  }

  const results: GameInfo[] = [];

  // Group teams by league to minimize API calls
  const leagueGroups = new Map<string, string[]>();
  for (const t of teams) {
    const group = leagueGroups.get(t.league) || [];
    group.push(t.team.toLowerCase());
    leagueGroups.set(t.league, group);
  }

  await Promise.all(
    Array.from(leagueGroups.entries()).map(async ([league, teamNames]) => {
      const url = LEAGUE_URLS[league];
      if (!url) return;

      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        for (const event of data.events || []) {
          const competitors = event.competitions?.[0]?.competitors || [];
          const homeTeam = competitors.find(
            (c: { homeAway: string }) => c.homeAway === "home"
          );
          const awayTeam = competitors.find(
            (c: { homeAway: string }) => c.homeAway === "away"
          );

          if (!homeTeam || !awayTeam) continue;

          // Check if any of our tracked teams are playing
          const homeName = homeTeam.team?.displayName?.toLowerCase() || "";
          const awayName = awayTeam.team?.displayName?.toLowerCase() || "";

          const isTracked = teamNames.some(
            (name) => homeName.includes(name) || name.includes(homeName) ||
                       awayName.includes(name) || name.includes(awayName)
          );

          if (!isTracked) continue;

          const status = event.status?.type?.name || "unknown";
          const detail = event.status?.type?.shortDetail || "";
          const isLive = status === "STATUS_IN_PROGRESS";

          results.push({
            team: teamNames.find(
              (name) => homeName.includes(name) || name.includes(homeName)
            )
              ? homeTeam.team.displayName
              : awayTeam.team.displayName,
            league: league.toUpperCase(),
            status,
            homeTeam: homeTeam.team?.abbreviation || "HOME",
            awayTeam: awayTeam.team?.abbreviation || "AWAY",
            homeLogo: homeTeam.team?.logo || "",
            awayLogo: awayTeam.team?.logo || "",
            homeScore: homeTeam.score || "0",
            awayScore: awayTeam.score || "0",
            detail,
            isLive,
            startTime: event.date || "",
          });
        }
      } catch {
        // Silently fail for individual leagues
      }
    })
  );

  return NextResponse.json(results);
}

import fs from "fs";
import path from "path";

export interface CalendarSource {
  name: string;
  color: string;
  icsUrl: string;
}

export interface GarbageSchedule {
  day: string;
  frequency: "weekly" | "biweekly";
  startDate?: string;
}

export interface SportsTeam {
  team: string;
  league: string;
}

export interface DashboardConfig {
  calendars: CalendarSource[];
  weather: {
    lat: number;
    lon: number;
    units: "imperial" | "metric";
  };
  aviation: {
    airport: string;
  };
  garbage?: {
    trash: GarbageSchedule;
    recycling: GarbageSchedule;
  };
  sports?: SportsTeam[];
  refreshIntervals: {
    calendar: number;
    weather: number;
    aviation: number;
  };
}

let cachedConfig: DashboardConfig | null = null;

export function getConfig(): DashboardConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = path.join(process.cwd(), "dashboard.config.json");
  const examplePath = path.join(process.cwd(), "dashboard.config.example.json");

  const filePath = fs.existsSync(configPath) ? configPath : examplePath;
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedConfig = JSON.parse(raw) as DashboardConfig;
  return cachedConfig;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  calendarName: string;
  calendarColor: string;
}

export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    windDir: number;
  };
  forecast: {
    date: string;
    high: number;
    low: number;
    description: string;
    icon: string;
  }[];
  location: string;
}

export interface TafPeriod {
  timeFrom: string;
  timeTo: string;
  flightCategory: string;
  wind: string;
  visibility: string;
  ceiling: string;
  weather: string;
  changeType: string;
}

export interface TafForecast {
  airport: string;
  rawTAF: string;
  issueTime: string;
  validFrom: string;
  validTo: string;
  periods: TafPeriod[];
}

export interface MetarData {
  raw: string;
  airport: string;
  temperature: number | null;
  dewpoint: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windGust: number | null;
  visibility: string;
  altimeter: string;
  flightCategory: string;
  clouds: string;
  observationTime: string;
  taf: string | null;
}

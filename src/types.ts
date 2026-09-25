export type SessionName = 'Asian' | 'London' | 'Overlap' | 'New York';

export interface SessionConfig {
  name: SessionName;
  startUTC: number; // hour 0-23
  endUTC: number; // hour 0-23 (exclusive, can wrap past 24)
  color: string;
  glow: string;
}

export interface MinuteBar {
  timestamp: number; // ms epoch
  datetime: string; // ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun
  session: SessionName;
  logReturn: number;
  range: number;
  trueRange: number;
  atr14: number;
  dateKey: string; // YYYY-MM-DD
}

export interface SessionStats {
  session: SessionName;
  count: number;
  avgRange: number;
  medianRange: number;
  stdRange: number;
  maxRange: number;
  pct95Range: number;
  skewness: number;
  kurtosis: number;
  avgVolume: number;
  realizedVol: number;
  shareOfDailyRange: number;
  returns: number[];
  ranges: number[];
}

export interface HourlyAvg {
  hour: number;
  avgRange: number;
  session: SessionName;
}

export interface WeekdaySessionAvg {
  weekday: number;
  session: SessionName;
  avgRange: number;
}

export interface YearlyTrend {
  year: number;
  session: SessionName;
  avgRange: number;
}

export interface TestResult {
  name: string;
  statistic: number;
  pValue: number;
  significant: boolean;
  description: string;
}

export interface PostHocResult {
  pair: string;
  pValue: number;
  significant: boolean;
}

export interface AnalysisResult {
  sessionStats: SessionStats[];
  hourlyAvg: HourlyAvg[];
  weekdaySessionAvg: WeekdaySessionAvg[];
  yearlyTrend: YearlyTrend[];
  tests: TestResult[];
  postHoc: PostHocResult[];
  totalBars: number;
  dateRange: { start: string; end: string };
  years: number[];
}

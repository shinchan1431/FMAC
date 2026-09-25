import type {
  MinuteBar,
  SessionStats,
  SessionName,
  HourlyAvg,
  WeekdaySessionAvg,
  YearlyTrend,
  TestResult,
  PostHocResult,
  AnalysisResult,
} from '@/types';
import { SESSION_ORDER, getSessionForHour, WEEKDAY_NAMES } from './sessions';
import {
  mean,
  median,
  stdDev,
  max as maxVal,
  percentile,
  skewness,
  kurtosis,
  jarqueBera,
  levene,
  kruskalWallis,
  dunnPostHoc,
} from './stats';

export function computeFeatures(rawTicks: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[]): MinuteBar[] {
  // Sort by timestamp
  const sorted = [...rawTicks].sort((a, b) => a.timestamp - b.timestamp);
  const bars: MinuteBar[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const d = new Date(t.timestamp);
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    const weekday = d.getUTCDay();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const session = getSessionForHour(hour);
    const dateKey = d.toISOString().slice(0, 10);

    const prevClose = i > 0 ? sorted[i - 1].close : t.open;
    const logReturn = t.close > 0 && prevClose > 0 ? Math.log(t.close / prevClose) : 0;
    const range = t.high - t.low;
    const prevHigh = i > 0 ? sorted[i - 1].high : t.high;
    const prevLow = i > 0 ? sorted[i - 1].low : t.low;
    const trueRange = Math.max(
      t.high - t.low,
      Math.abs(t.high - prevClose),
      Math.abs(t.low - prevClose),
    );

    bars.push({
      timestamp: t.timestamp,
      datetime: d.toISOString(),
      open: t.open,
      high: t.high,
      low: t.low,
      close: t.close,
      volume: t.volume,
      year,
      month,
      day,
      hour,
      minute,
      weekday,
      session,
      logReturn,
      range,
      trueRange,
      atr14: 0,
      dateKey,
    });
  }

  // Compute ATR(14) per bar using a rolling window on true range
  const period = 14;
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      bars[i].atr14 = 0;
    } else if (i === period - 1) {
      bars[i].atr14 = mean(bars.slice(0, period).map((b) => b.trueRange));
    } else {
      bars[i].atr14 = (bars[i - 1].atr14 * (period - 1) + bars[i].trueRange) / period;
    }
  }

  return bars;
}

export function computeDailyRanges(bars: MinuteBar[]): Map<string, number> {
  const dailyMap = new Map<string, { high: number; low: number }>();
  for (const b of bars) {
    const existing = dailyMap.get(b.dateKey);
    if (existing) {
      existing.high = Math.max(existing.high, b.high);
      existing.low = Math.min(existing.low, b.low);
    } else {
      dailyMap.set(b.dateKey, { high: b.high, low: b.low });
    }
  }
  const dailyRanges = new Map<string, number>();
  for (const [key, val] of dailyMap.entries()) {
    dailyRanges.set(key, val.high - val.low);
  }
  return dailyRanges;
}

export function computeSessionStats(bars: MinuteBar[]): SessionStats[] {
  const dailyRanges = computeDailyRanges(bars);
  const grouped = new Map<SessionName, MinuteBar[]>();
  for (const b of bars) {
    const arr = grouped.get(b.session) ?? [];
    arr.push(b);
    grouped.set(b.session, arr);
  }

  const stats: SessionStats[] = [];
  for (const session of SESSION_ORDER) {
    const sessionBars = grouped.get(session) ?? [];
    if (sessionBars.length === 0) continue;

    const allRanges = sessionBars.map((b) => b.range);
    const allReturns = sessionBars.map((b) => b.logReturn).filter((r) => isFinite(r));
    const volumes = sessionBars.map((b) => b.volume);

    // Cap stored arrays to prevent memory bloat — components sample down anyway
    const MAX_STORED = 5000;
    const ranges = allRanges.length > MAX_STORED ? allRanges.slice(0, MAX_STORED) : allRanges;
    const returns = allReturns.length > MAX_STORED ? allReturns.slice(0, MAX_STORED) : allReturns;

    // Session share of daily range = (session high - session low) / (day high - day low) * 100
    const sessionHighLow = new Map<string, { high: number; low: number }>();
    for (const b of sessionBars) {
      const ex = sessionHighLow.get(b.dateKey);
      if (ex) {
        ex.high = Math.max(ex.high, b.high);
        ex.low = Math.min(ex.low, b.low);
      } else {
        sessionHighLow.set(b.dateKey, { high: b.high, low: b.low });
      }
    }
    let shareSum = 0;
    let shareCount = 0;
    for (const [dateKey, hl] of sessionHighLow) {
      const dr = dailyRanges.get(dateKey) ?? 0;
      if (dr > 0) {
        shareSum += (hl.high - hl.low) / dr;
        shareCount++;
      }
    }
    const shareOfDailyRange = shareCount > 0 ? (shareSum / shareCount) * 100 : 0;

    // Realized volatility: sqrt(sum of squared returns)
    const realizedVol = Math.sqrt(allReturns.reduce((a, r) => a + r * r, 0));

    stats.push({
      session,
      count: sessionBars.length,
      avgRange: mean(allRanges),
      medianRange: median(allRanges),
      stdRange: stdDev(allRanges),
      maxRange: maxVal(allRanges),
      pct95Range: percentile(allRanges, 95),
      skewness: skewness(allReturns),
      kurtosis: kurtosis(allReturns),
      avgVolume: mean(volumes),
      realizedVol,
      shareOfDailyRange,
      returns,
      ranges,
    });
  }

  return stats;
}

export function computeHourlyAvg(bars: MinuteBar[]): HourlyAvg[] {
  const hourlyMap = new Map<number, number[]>();
  for (const b of bars) {
    const arr = hourlyMap.get(b.hour) ?? [];
    arr.push(b.range);
    hourlyMap.set(b.hour, arr);
  }
  const result: HourlyAvg[] = [];
  for (let h = 0; h < 24; h++) {
    const arr = hourlyMap.get(h) ?? [];
    result.push({ hour: h, avgRange: arr.length > 0 ? mean(arr) : 0, session: getSessionForHour(h) });
  }
  return result;
}

export function computeWeekdaySessionAvg(bars: MinuteBar[]): WeekdaySessionAvg[] {
  const map = new Map<string, number[]>();
  for (const b of bars) {
    if (b.weekday === 0 || b.weekday === 6) continue; // Skip weekends
    const key = `${b.weekday}-${b.session}`;
    const arr = map.get(key) ?? [];
    arr.push(b.range);
    map.set(key, arr);
  }
  const result: WeekdaySessionAvg[] = [];
  for (let wd = 1; wd <= 5; wd++) {
    for (const session of SESSION_ORDER) {
      const arr = map.get(`${wd}-${session}`) ?? [];
      result.push({ weekday: wd, session, avgRange: arr.length > 0 ? mean(arr) : 0 });
    }
  }
  return result;
}

export function computeYearlyTrend(bars: MinuteBar[]): YearlyTrend[] {
  const map = new Map<string, number[]>();
  for (const b of bars) {
    const key = `${b.year}-${b.session}`;
    const arr = map.get(key) ?? [];
    arr.push(b.range);
    map.set(key, arr);
  }
  const years = [...new Set(bars.map((b) => b.year))].sort();
  const result: YearlyTrend[] = [];
  for (const year of years) {
    for (const session of SESSION_ORDER) {
      const arr = map.get(`${year}-${session}`) ?? [];
      if (arr.length > 0) {
        result.push({ year, session, avgRange: mean(arr) });
      }
    }
  }
  return result;
}

export function runHypothesisTests(sessionStats: SessionStats[]): { tests: TestResult[]; postHoc: PostHocResult[] } {
  const tests: TestResult[] = [];
  const postHoc: PostHocResult[] = [];
  const alpha = 0.05;

  // 1. Normality test (Jarque-Bera) per session
  for (const s of sessionStats) {
    const sample = s.returns.length > 5000 ? s.returns.slice(0, 5000) : s.returns;
    const jb = jarqueBera(sample);
    tests.push({
      name: `Normality (${s.session})`,
      statistic: jb.statistic,
      pValue: jb.pValue,
      significant: jb.pValue < alpha,
      description: `Jarque-Bera test on returns — ${jb.pValue < alpha ? 'not normal' : 'possibly normal'}`,
    });
  }

  // 2. Kruskal-Wallis test across sessions
  const rangeGroups = sessionStats.map((s) => {
    const sample = s.ranges.length > 5000 ? s.ranges.slice(0, 5000) : s.ranges;
    return sample;
  });
  const kw = kruskalWallis(rangeGroups);
  tests.push({
    name: 'Kruskal-Wallis (sessions)',
    statistic: kw.statistic,
    pValue: kw.pValue,
    significant: kw.pValue < alpha,
    description: `Volatility ${kw.pValue < alpha ? 'differs significantly' : 'does not differ significantly'} across sessions`,
  });

  // 3. Levene's test for variance equality
  const lev = levene(rangeGroups);
  tests.push({
    name: "Levene's (variance)",
    statistic: lev.statistic,
    pValue: lev.pValue,
    significant: lev.pValue < alpha,
    description: `Variances ${lev.pValue < alpha ? 'are not equal' : 'are approximately equal'} across sessions`,
  });

  // 4. Dunn's post-hoc
  const dunn = dunnPostHoc(rangeGroups, sessionStats.map((s) => s.session));
  for (const d of dunn) {
    postHoc.push(d);
  }

  return { tests, postHoc };
}

export function runFullAnalysis(bars: MinuteBar[]): AnalysisResult {
  const sessionStats = computeSessionStats(bars);
  const hourlyAvg = computeHourlyAvg(bars);
  const weekdaySessionAvg = computeWeekdaySessionAvg(bars);
  const yearlyTrend = computeYearlyTrend(bars);
  const { tests, postHoc } = runHypothesisTests(sessionStats);

  // Use a loop instead of Math.min/max(...spread) to avoid call stack overflow on large arrays
  let minTs = Infinity;
  let maxTs = -Infinity;
  const yearSet = new Set<number>();
  for (const b of bars) {
    if (b.timestamp < minTs) minTs = b.timestamp;
    if (b.timestamp > maxTs) maxTs = b.timestamp;
    yearSet.add(b.year);
  }
  const years = [...yearSet].sort();

  return {
    sessionStats,
    hourlyAvg,
    weekdaySessionAvg,
    yearlyTrend,
    tests,
    postHoc,
    totalBars: bars.length,
    dateRange: {
      start: new Date(minTs).toISOString().slice(0, 10),
      end: new Date(maxTs).toISOString().slice(0, 10),
    },
    years,
  };
}

export { WEEKDAY_NAMES };

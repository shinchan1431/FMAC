import type { MinuteBar } from '@/types';
import { computeFeatures } from './analysis';
import { getSessionForHour } from './sessions';

// Deterministic PRNG (mulberry32) for reproducible sample data
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal distribution
function gaussian(rng: () => number, mu: number, sigma: number): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + z * sigma;
}

interface SessionVolProfile {
  baseVol: number; // base volatility (price units)
  peakHours: number[]; // hours with extra volatility
  peakMultiplier: number;
}

const SESSION_PROFILES: Record<string, SessionVolProfile> = {
  Asian: { baseVol: 0.8, peakHours: [1, 2, 3], peakMultiplier: 1.3 },
  London: { baseVol: 1.5, peakHours: [7, 8, 9], peakMultiplier: 1.6 },
  Overlap: { baseVol: 2.8, peakHours: [13, 14, 15], peakMultiplier: 1.8 },
  'New York': { baseVol: 2.2, peakHours: [17, 18, 19], peakMultiplier: 1.5 },
};

const YEARLY_PRICE_LEVELS: { year: number; basePrice: number }[] = [
  { year: 2020, basePrice: 1700 },
  { year: 2021, basePrice: 1800 },
  { year: 2022, basePrice: 1850 },
  { year: 2023, basePrice: 1950 },
  { year: 2024, basePrice: 2300 },
];

function getPriceForYear(year: number): number {
  const entry = YEARLY_PRICE_LEVELS.find((y) => y.year === year);
  if (entry) return entry.basePrice;
  const last = YEARLY_PRICE_LEVELS[YEARLY_PRICE_LEVELS.length - 1];
  return last.basePrice + (year - last.year) * 200;
}

export function generateSampleData(): Promise<MinuteBar[]> {
  return new Promise((resolve) => {
    const rng = mulberry32(42);
    const rawTicks: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[] = [];

    const startDate = new Date(Date.UTC(2023, 0, 9)); // Jan 9, 2023 (Monday)
    const endDate = new Date(Date.UTC(2024, 11, 31)); // Dec 31, 2024

    let current = new Date(startDate);
    let currentPrice = getPriceForYear(2020);

    // Progress callback for UI
    let tickCount = 0;

    while (current <= endDate) {
      const day = current.getUTCDay();
      // Skip weekends
      if (day !== 0 && day !== 6) {
        const year = current.getUTCFullYear();
        const basePrice = getPriceForYear(year);
        // Slowly drift price toward the year's target
        const drift = (basePrice - currentPrice) * 0.001;
        currentPrice += drift + gaussian(rng, 0, 0.5);

        for (let hour = 0; hour < 24; hour++) {
          for (let minute = 0; minute < 60; minute++) {
            const session = getSessionForHour(hour);
            const profile = SESSION_PROFILES[session];
            let vol = profile.baseVol;
            if (profile.peakHours.includes(hour)) {
              vol *= profile.peakMultiplier;
            }
            // Add some noise
            vol *= 1 + (rng() - 0.5) * 0.4;

            const open = currentPrice;
            const move = gaussian(rng, 0, vol / 3);
            const close = Math.max(open + move, 1);
            const high = Math.max(open, close) + Math.abs(gaussian(rng, 0, vol / 4));
            const low = Math.min(open, close) - Math.abs(gaussian(rng, 0, vol / 4));
            const volume = Math.floor(50 + vol * 30 + gaussian(rng, 0, 20));

            rawTicks.push({
              timestamp: Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), hour, minute),
              open,
              high: Math.max(high, 1),
              low: Math.max(low, 0.5),
              close,
              volume: Math.max(volume, 1),
            });

            currentPrice = close;
            tickCount++;
          }
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const bars = computeFeatures(rawTicks);
    resolve(bars);
  });
}

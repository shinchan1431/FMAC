// Statistical functions implemented from scratch — no external stats library needed.

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
}

export function stdDev(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

export function max(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => (b > a ? b : a), xs[0]);
}

export function skewness(xs: number[]): number {
  if (xs.length < 3) return 0;
  const m = mean(xs);
  const sd = stdDev(xs);
  if (sd === 0) return 0;
  const n = xs.length;
  const s = (n / ((n - 1) * (n - 2))) * xs.reduce((a, b) => a + ((b - m) / sd) ** 3, 0);
  return s;
}

export function kurtosis(xs: number[]): number {
  if (xs.length < 4) return 0;
  const m = mean(xs);
  const v = variance(xs);
  if (v === 0) return 0;
  const n = xs.length;
  const s2 = xs.reduce((a, b) => a + ((b - m) / Math.sqrt(v)) ** 4, 0);
  const k = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * s2 - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return k;
}

// --- Normality test (Jarque-Bera approximation) ---
export function jarqueBera(xs: number[]): { statistic: number; pValue: number } {
  const n = xs.length;
  if (n < 8) return { statistic: 0, pValue: 1 };
  const s = skewness(xs);
  const k = kurtosis(xs);
  const jb = (n / 6) * (s ** 2 + 0.25 * k ** 2);
  // JB ~ chi-square(2); p-value from survival function
  const pValue = chiSquareSurvival(jb, 2);
  return { statistic: jb, pValue };
}

// --- Levene's test ---
export function levene(groups: number[][]): { statistic: number; pValue: number } {
  const k = groups.length;
  let totalN = 0;
  const groupMeans: number[] = [];
  const transformed: number[][] = [];

  for (const g of groups) {
    const m = median(g);
    const ti = g.map((v) => Math.abs(v - m));
    transformed.push(ti);
    groupMeans.push(mean(ti));
    totalN += g.length;
  }
  const grandMean = mean(transformed.flat());
  let between = 0;
  let within = 0;
  for (let i = 0; i < k; i++) {
    between += transformed[i].length * (groupMeans[i] - grandMean) ** 2;
    within += transformed[i].reduce((a, b) => a + (b - groupMeans[i]) ** 2, 0);
  }
  if (within === 0) return { statistic: 0, pValue: 1 };
  const df1 = k - 1;
  const df2 = totalN - k;
  const F = (between / df1) / (within / df2);
  const pValue = fSurvival(F, df1, df2);
  return { statistic: F, pValue };
}

// --- Kruskal-Wallis test ---
export function kruskalWallis(groups: number[][]): { statistic: number; pValue: number } {
  const allValues: { val: number; group: number }[] = [];
  groups.forEach((g, i) => g.forEach((v) => allValues.push({ val: v, group: i })));
  const sorted = [...allValues].sort((a, b) => a.val - b.val);
  const ranks = new Array(sorted.length).fill(0);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length - 1 && sorted[j + 1].val === sorted[i].val) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avgRank;
    i = j + 1;
  }
  const groupRanks: number[] = new Array(groups.length).fill(0);
  const groupSizes: number[] = new Array(groups.length).fill(0);
  sorted.forEach((s, idx) => {
    groupRanks[s.group] += ranks[idx];
    groupSizes[s.group]++;
  });
  const N = sorted.length;
  let H = 0;
  for (let g = 0; g < groups.length; g++) {
    H += (groupRanks[g] ** 2) / groupSizes[g];
  }
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1);
  const df = groups.length - 1;
  const pValue = chiSquareSurvival(H, df);
  return { statistic: H, pValue };
}

// --- Dunn's post-hoc test with Bonferroni correction ---
export function dunnPostHoc(groups: number[][], groupNames: string[]): { pair: string; pValue: number; significant: boolean }[] {
  const allValues: { val: number; group: number }[] = [];
  groups.forEach((g, i) => g.forEach((v) => allValues.push({ val: v, group: i })));
  const sorted = [...allValues].sort((a, b) => a.val - b.val);
  const ranks = new Array(sorted.length).fill(0);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length - 1 && sorted[j + 1].val === sorted[i].val) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avgRank;
    i = j + 1;
  }
  const N = sorted.length;
  const groupRanks: number[] = new Array(groups.length).fill(0);
  const groupSizes: number[] = new Array(groups.length).fill(0);
  sorted.forEach((s, idx) => {
    groupRanks[s.group] += ranks[idx];
    groupSizes[s.group]++;
  });
  const meanRanks = groupRanks.map((r, i) => r / groupSizes[i]);
  const numComparisons = (groups.length * (groups.length - 1)) / 2;
  const alpha = 0.05;
  const results: { pair: string; pValue: number; significant: boolean }[] = [];
  for (let a = 0; a < groups.length; a++) {
    for (let b = a + 1; b < groups.length; b++) {
      const se = Math.sqrt((N * (N + 1) / 12) * (1 / groupSizes[a] + 1 / groupSizes[b]));
      const z = Math.abs(meanRanks[a] - meanRanks[b]) / se;
      const pValue = 2 * (1 - normalCDF(z));
      const adjustedP = Math.min(pValue * numComparisons, 1);
      results.push({
        pair: `${groupNames[a]} vs ${groupNames[b]}`,
        pValue: adjustedP,
        significant: adjustedP < alpha,
      });
    }
  }
  return results;
}

// --- Pearson correlation ---
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

// --- Chi-square survival function (1 - CDF) ---
function chiSquareSurvival(x: number, df: number): number {
  if (x <= 0) return 1;
  return gammaRegularizedQ(df / 2, x / 2);
}

// --- F-distribution survival function ---
function fSurvival(F: number, d1: number, d2: number): number {
  if (F <= 0) return 1;
  return gammaRegularizedQ(d2 / 2, d1 / 2, (d2 / 2) * (d1 * F + d2) / (d1 * F));
}

// --- Normal CDF ---
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// --- Error function (Abramowitz & Stegun approximation) ---
function erf(x: number): number {
  const sign = Math.sign(x);
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// --- Regularized upper incomplete gamma function Q(a, x) ---
// Uses series expansion for x < a+1, continued fraction for x >= a+1
function gammaRegularizedQ(a: number, x: number, a2?: number): number {
  // Two-arg form: Q(a, x)
  if (a2 === undefined) {
    return upperIncompleteGammaQ(a, x);
  }
  // Three-arg form: Q(a, b, x) = Q(b, x) for F-distribution
  return upperIncompleteGammaQ(a2, x);
}

function upperIncompleteGammaQ(a: number, x: number): number {
  if (x < 0 || a <= 0) return 1;
  if (x === 0) return 1;
  const gln = logGamma(a);
  if (x < a + 1) {
    // Series expansion
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 0; n < 200; n++) {
      ap++;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gln) * sum;
  } else {
    // Continued fraction (Lentz's method)
    let b = x + 1 - a;
    let c = 1e30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 200; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-14) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }
}

function logGamma(a: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.371192376616522, 0.9997993964226663, -0.0004958829692868219,
    0.0000143288279342519,
  ];
  let y = a;
  let tmp = a + 5.5;
  tmp -= (a + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 7; j++) {
    y++;
    ser += c[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / a);
}

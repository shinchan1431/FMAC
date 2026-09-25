import type { SessionStats } from '@/types';
import { getSessionColor, SESSION_ORDER } from '@/lib/sessions';
import { percentile } from '@/lib/stats';

interface Props {
  stats: SessionStats[];
}

export default function BoxPlot({ stats }: Props) {
  if (stats.length === 0) return null;

  const sorted = [...stats].sort((a, b) => SESSION_ORDER.indexOf(a.session) - SESSION_ORDER.indexOf(b.session));

  const allRanges = sorted.flatMap((s) => s.ranges);
  if (allRanges.length === 0) return null;

  // Cap at 99th percentile for display clarity
  const globalMax = percentile(allRanges, 99);
  const globalMin = 0;

  const chartWidth = 700;
  const chartHeight = 320;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const yMax = globalMax;
  const yMin = globalMin;
  const yRange = yMax - yMin || 1;
  const yTicks = 6;

  function getY(val: number): number {
    return padding.top + plotH - ((val - yMin) / yRange) * plotH;
  }

  const boxWidth = 80;
  const spacing = plotW / sorted.length;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-ink-50 mb-1">Range Distribution by Session</h3>
      <p className="text-xs text-ink-300 mb-4">Box plots show the spread of minute ranges per session. Whiskers extend to the 5th–95th percentile; outliers beyond are omitted for clarity.</p>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 500 }}>
          {/* Y-axis */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const val = yMin + (yRange * i) / yTicks;
            const y = getY(val);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#4A4C54" strokeWidth="0.5" opacity={0.3} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9A9CA5" fontFamily="monospace">{val.toFixed(1)}</text>
              </g>
            );
          })}

          {/* Boxes */}
          {sorted.map((s, i) => {
            const color = getSessionColor(s.session);
            const q5 = percentile(s.ranges, 5);
            const q25 = percentile(s.ranges, 25);
            const q50 = s.medianRange;
            const q75 = percentile(s.ranges, 75);
            const q95 = s.pct95Range;

            const cx = padding.left + spacing * i + spacing / 2;
            const bx = cx - boxWidth / 2;

            return (
              <g key={s.session}>
                {/* Whisker line */}
                <line x1={cx} y1={getY(q95)} x2={cx} y2={getY(q5)} stroke={color} strokeWidth="1.5" opacity={0.6} />
                {/* Whisker caps */}
                <line x1={cx - 15} y1={getY(q95)} x2={cx + 15} y2={getY(q95)} stroke={color} strokeWidth="1.5" opacity={0.6} />
                <line x1={cx - 15} y1={getY(q5)} x2={cx + 15} y2={getY(q5)} stroke={color} strokeWidth="1.5" opacity={0.6} />
                {/* Box */}
                <rect
                  x={bx}
                  y={getY(q75)}
                  width={boxWidth}
                  height={getY(q25) - getY(q75)}
                  fill={color}
                  fillOpacity={0.25}
                  stroke={color}
                  strokeWidth="2"
                  rx={4}
                  style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
                />
                {/* Median line */}
                <line x1={bx} y1={getY(q50)} x2={bx + boxWidth} y2={getY(q50)} stroke={color} strokeWidth="3" />
                {/* Mean marker */}
                <circle cx={cx} cy={getY(s.avgRange)} r={4} fill="#0E0F14" stroke={color} strokeWidth="2" />
                {/* Labels */}
                <text x={cx} y={chartHeight - 25} textAnchor="middle" fontSize="12" fill="#E8E9EC" fontWeight="600">{s.session}</text>
                <text x={cx} y={chartHeight - 10} textAnchor="middle" fontSize="9" fill="#6E7079" fontFamily="monospace">n={s.count.toLocaleString()}</text>

                <title>{`${s.session}: Q5=${q5.toFixed(2)} Q25=${q25.toFixed(2)} Median=${q50.toFixed(2)} Q75=${q75.toFixed(2)} Q95=${q95.toFixed(2)} Mean=${s.avgRange.toFixed(2)}`}</title>
              </g>
            );
          })}

          <text x={15} y={padding.top + plotH / 2} textAnchor="middle" fontSize="10" fill="#9A9CA5" transform={`rotate(-90, 15, ${padding.top + plotH / 2})`}>Range (price units)</text>
        </svg>
      </div>
    </div>
  );
}

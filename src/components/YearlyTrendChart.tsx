import type { YearlyTrend } from '@/types';
import { getSessionColor, SESSION_ORDER } from '@/lib/sessions';

interface Props {
  data: YearlyTrend[];
}

export default function YearlyTrendChart({ data }: Props) {
  if (data.length === 0) return null;

  const years = [...new Set(data.map((d) => d.year))].sort();
  const maxVal = Math.max(...data.map((d) => d.avgRange), 0.01);

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 120, bottom: 40, left: 50 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const xStep = plotW / Math.max(years.length - 1, 1);
  const yMax = Math.ceil(maxVal * 1.15);
  const yTicks = 5;

  function getX(year: number): number {
    return padding.left + years.indexOf(year) * xStep;
  }

  function getY(val: number): number {
    return padding.top + plotH - (val / yMax) * plotH;
  }

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-ink-50 mb-1">Yearly Volatility Trend by Session</h3>
      <p className="text-xs text-ink-300 mb-4">Average range per session across years — shows whether volatility is rising or falling over time</p>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 500 }}>
          {/* Grid lines */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const y = padding.top + (plotH * i) / yTicks;
            const val = yMax - (yMax * i) / yTicks;
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#4A4C54" strokeWidth="0.5" opacity={0.3} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9A9CA5" fontFamily="monospace">{val.toFixed(1)}</text>
              </g>
            );
          })}

          {/* Lines per session */}
          {SESSION_ORDER.map((session) => {
            const sessionData = data.filter((d) => d.session === session);
            if (sessionData.length === 0) return null;
            const color = getSessionColor(session);
            const points = sessionData.map((d) => `${getX(d.year)},${getY(d.avgRange)}`).join(' ');
            return (
              <g key={session}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
                />
                {sessionData.map((d) => (
                  <g key={`${d.year}-${d.session}`}>
                    <circle cx={getX(d.year)} cy={getY(d.avgRange)} r={4} fill={color} stroke="#0E0F14" strokeWidth="1.5" />
                    <title>{`${session} ${d.year}: ${d.avgRange.toFixed(3)}`}</title>
                  </g>
                ))}
              </g>
            );
          })}

          {/* X-axis labels */}
          {years.map((y) => (
            <text key={y} x={getX(y)} y={chartHeight - 12} textAnchor="middle" fontSize="11" fill="#C8CAD0" fontFamily="monospace">{y}</text>
          ))}

          {/* Legend */}
          {SESSION_ORDER.map((session, i) => {
            const color = getSessionColor(session);
            const ly = padding.top + i * 22;
            return (
              <g key={session}>
                <line x1={padding.left + plotW + 15} y1={ly + 5} x2={padding.left + plotW + 35} y2={ly + 5} stroke={color} strokeWidth="2.5" />
                <circle cx={padding.left + plotW + 25} cy={ly + 5} r={3} fill={color} />
                <text x={padding.left + plotW + 42} y={ly + 9} fontSize="11" fill="#C8CAD0">{session}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

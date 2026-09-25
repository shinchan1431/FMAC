import type { HourlyAvg } from '@/types';
import { getSessionColor, SESSIONS } from '@/lib/sessions';

interface Props {
  data: HourlyAvg[];
}

export default function HourlyChart({ data }: Props) {
  if (data.length === 0) return null;

  const maxRange = Math.max(...data.map((d) => d.avgRange), 0.01);
  const chartWidth = 900;
  const chartHeight = 280;
  const barWidth = chartWidth / 24;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const yMax = Math.ceil(maxRange * 1.15);
  const yTicks = 5;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-ink-50 mb-1">Average Range by Hour of Day (UTC)</h3>
      <p className="text-xs text-ink-300 mb-4">Each bar represents the mean minute range at that UTC hour, colored by trading session</p>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 600 }}>
          {/* Session background bands */}
          {SESSIONS.map((s) => {
            const x = padding.left + s.startUTC * barWidth;
            const w = (s.endUTC > s.startUTC ? s.endUTC - s.startUTC : 24 - s.startUTC + s.endUTC) * barWidth;
            return (
              <rect
                key={s.name}
                x={x}
                y={padding.top}
                width={w}
                height={plotH}
                fill={s.color}
                opacity={0.06}
              />
            );
          })}

          {/* Y-axis grid lines and labels */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const y = padding.top + (plotH * i) / yTicks;
            const val = yMax - (yMax * i) / yTicks;
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#4A4C54" strokeWidth="0.5" opacity={0.4} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9A9CA5" fontFamily="monospace">{val.toFixed(1)}</text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d) => {
            const barH = (d.avgRange / yMax) * plotH;
            const x = padding.left + d.hour * barWidth;
            const y = padding.top + plotH - barH;
            const color = getSessionColor(d.session);
            return (
              <g key={d.hour} className="group">
                <rect
                  x={x + 2}
                  y={y}
                  width={barWidth - 4}
                  height={barH}
                  fill={color}
                  opacity={0.85}
                  rx={2}
                  className="transition-all duration-300 group-hover:opacity-100"
                  style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
                />
                <title>{`Hour ${d.hour}:00 UTC — ${d.session} — Avg range: ${d.avgRange.toFixed(3)}`}</title>
              </g>
            );
          })}

          {/* X-axis labels */}
          {Array.from({ length: 24 }, (_, h) => (
            <text
              key={h}
              x={padding.left + h * barWidth + barWidth / 2}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize="9"
              fill="#6E7079"
              fontFamily="monospace"
            >
              {h}
            </text>
          ))}
          <text x={padding.left + plotW / 2} y={chartHeight - 2} textAnchor="middle" fontSize="10" fill="#9A9CA5">Hour (UTC)</text>

          {/* Y-axis label */}
          <text x={15} y={padding.top + plotH / 2} textAnchor="middle" fontSize="10" fill="#9A9CA5" transform={`rotate(-90, 15, ${padding.top + plotH / 2})`}>Avg Range</text>
        </svg>
      </div>
      {/* Session legend */}
      <div className="flex flex-wrap gap-4 mt-3 justify-center">
        {SESSIONS.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}66` }} />
            <span className="text-xs text-ink-200">{s.name} ({s.startUTC}:00–{s.endUTC}:00)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

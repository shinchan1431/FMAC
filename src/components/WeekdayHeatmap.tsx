import type { WeekdaySessionAvg } from '@/types';
import { getSessionColor, SESSION_ORDER, WEEKDAY_NAMES } from '@/lib/sessions';

interface Props {
  data: WeekdaySessionAvg[];
}

export default function WeekdayHeatmap({ data }: Props) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.avgRange), 0.01);

  function getCellColor(val: number): string {
    const intensity = val / maxVal;
    // Gold gradient: dark ink -> gold
    const r = Math.round(30 + intensity * 182);
    const g = Math.round(30 + intensity * 145);
    const b = Math.round(38 + intensity * 17);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function getTextColor(val: number): string {
    return val / maxVal > 0.55 ? '#0E0F14' : '#E8E9EC';
  }

  const cellW = 140;
  const cellH = 50;
  const labelW = 80;
  const labelH = 30;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-ink-50 mb-1">Weekday × Session Heatmap</h3>
      <p className="text-xs text-ink-300 mb-4">Average minute range for each weekday and trading session. Darker = lower volatility, brighter gold = higher.</p>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${labelW + cellW * SESSION_ORDER.length} ${labelH + cellH * 5}`} className="w-full" style={{ minWidth: 500 }}>
          {/* Session column headers */}
          {SESSION_ORDER.map((session, i) => (
            <g key={session}>
              <rect x={labelW + i * cellW} y={0} width={cellW} height={labelH} fill={getSessionColor(session)} opacity={0.15} rx={4} />
              <circle cx={labelW + i * cellW + 12} cy={labelH / 2} r={4} fill={getSessionColor(session)} />
              <text x={labelW + i * cellW + 22} y={labelH / 2 + 4} fontSize="12" fill="#E8E9EC" fontWeight="600">{session}</text>
            </g>
          ))}

          {/* Weekday rows */}
          {[1, 2, 3, 4, 5].map((wd, rowIdx) => {
            const cells = data.filter((d) => d.weekday === wd);
            return (
              <g key={wd}>
                <text x={labelW - 10} y={labelH + rowIdx * cellH + cellH / 2 + 4} textAnchor="end" fontSize="12" fill="#C8CAD0" fontWeight="500">
                  {WEEKDAY_NAMES[wd]}
                </text>
                {SESSION_ORDER.map((session, colIdx) => {
                  const cell = cells.find((c) => c.session === session);
                  const val = cell?.avgRange ?? 0;
                  return (
                    <g key={session} className="group">
                      <rect
                        x={labelW + colIdx * cellW + 2}
                        y={labelH + rowIdx * cellH + 2}
                        width={cellW - 4}
                        height={cellH - 4}
                        fill={getCellColor(val)}
                        rx={6}
                        className="transition-all duration-300"
                        style={{ filter: val / maxVal > 0.7 ? `drop-shadow(0 0 8px rgba(212,175,55,0.3))` : 'none' }}
                      />
                      <text
                        x={labelW + colIdx * cellW + cellW / 2}
                        y={labelH + rowIdx * cellH + cellH / 2 + 5}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="700"
                        fill={getTextColor(val)}
                        fontFamily="monospace"
                      >
                        {val.toFixed(2)}
                      </text>
                      <title>{`${WEEKDAY_NAMES[wd]} — ${session}: ${val.toFixed(3)}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

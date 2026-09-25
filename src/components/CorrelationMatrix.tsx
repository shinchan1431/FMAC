import type { SessionStats } from '@/types';
import { getSessionColor, SESSION_ORDER } from '@/lib/sessions';
import { pearsonCorrelation } from '@/lib/stats';

interface Props {
  stats: SessionStats[];
}

export default function CorrelationMatrix({ stats }: Props) {
  if (stats.length < 2) return null;

  const sorted = [...stats].sort((a, b) => SESSION_ORDER.indexOf(a.session) - SESSION_ORDER.indexOf(b.session));

  // Compute correlation matrix between sessions using range time series
  // We'll use a simplified approach: correlate the average range stats
  // For a proper matrix, we correlate session range arrays (sampled)
  const matrix: number[][] = [];
  for (let i = 0; i < sorted.length; i++) {
    matrix.push([]);
    const sampleI = sorted[i].ranges.length > 2000 ? sorted[i].ranges.slice(0, 2000) : sorted[i].ranges;
    for (let j = 0; j < sorted.length; j++) {
      const sampleJ = sorted[j].ranges.length > 2000 ? sorted[j].ranges.slice(0, 2000) : sorted[j].ranges;
      matrix[i].push(pearsonCorrelation(sampleI, sampleJ));
    }
  }

  function getCellColor(val: number): string {
    // -1 = rose, 0 = ink, +1 = gold
    const v = Math.max(-1, Math.min(1, val));
    if (v >= 0) {
      const r = Math.round(30 + v * 182);
      const g = Math.round(30 + v * 145);
      const b = Math.round(38 + v * 17);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(30 + Math.abs(v) * 221);
      const g = Math.round(30 + Math.abs(v) * 83);
      const b = Math.round(38 + Math.abs(v) * 95);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  function getTextColor(val: number): string {
    return Math.abs(val) > 0.55 ? '#0E0F14' : '#E8E9EC';
  }

  const cellSize = 70;
  const labelSize = 80;

  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-ink-50 mb-1">Session Range Correlation Matrix</h3>
      <p className="text-xs text-ink-300 mb-4">Pearson correlation between minute ranges of each session pair. Gold = positive, rose = negative.</p>
      <div className="w-full overflow-x-auto scrollbar-thin flex justify-center">
        <svg viewBox={`0 0 ${labelSize + cellSize * sorted.length + 20} ${labelSize + cellSize * sorted.length + 20}`} style={{ minWidth: 400, maxWidth: 500 }}>
          {/* Column headers */}
          {sorted.map((s, i) => (
            <text
              key={`col-${s.session}`}
              x={labelSize + i * cellSize + cellSize / 2}
              y={labelSize - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#C8CAD0"
              fontWeight="600"
              transform={sorted.length > 2 ? `rotate(-25, ${labelSize + i * cellSize + cellSize / 2}, ${labelSize - 10})` : undefined}
            >
              {s.session}
            </text>
          ))}

          {/* Row headers + cells */}
          {sorted.map((rowSession, i) => (
            <g key={`row-${rowSession.session}`}>
              <text
                x={labelSize - 8}
                y={labelSize + i * cellSize + cellSize / 2 + 4}
                textAnchor="end"
                fontSize="10"
                fill="#C8CAD0"
                fontWeight="600"
              >
                {rowSession.session}
              </text>
              {sorted.map((_, j) => {
                const val = matrix[i][j];
                return (
                  <g key={`cell-${i}-${j}`}>
                    <rect
                      x={labelSize + j * cellSize + 2}
                      y={labelSize + i * cellSize + 2}
                      width={cellSize - 4}
                      height={cellSize - 4}
                      fill={getCellColor(val)}
                      rx={6}
                      className="transition-all"
                    />
                    <text
                      x={labelSize + j * cellSize + cellSize / 2}
                      y={labelSize + i * cellSize + cellSize / 2 + 4}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill={getTextColor(val)}
                      fontFamily="monospace"
                    >
                      {val.toFixed(2)}
                    </text>
                    <title>{`${rowSession.session} vs ${sorted[j].session}: r=${val.toFixed(3)}`}</title>
                  </g>
                );
              })}
            </g>
          ))}

          {/* Color scale legend */}
          <g>
            {Array.from({ length: 21 }, (_, k) => {
              const v = -1 + (k / 20) * 2;
              return (
                <rect key={k} x={labelSize + k * 8} y={labelSize + sorted.length * cellSize + 10} width={8} height={12} fill={getCellColor(v)} />
              );
            })}
            <text x={labelSize} y={labelSize + sorted.length * cellSize + 35} fontSize="9" fill="#9A9CA5" fontFamily="monospace">-1</text>
            <text x={labelSize + cellSize * sorted.length} y={labelSize + sorted.length * cellSize + 35} textAnchor="end" fontSize="9" fill="#9A9CA5" fontFamily="monospace">+1</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

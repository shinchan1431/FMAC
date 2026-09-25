import type { SessionStats } from '@/types';
import { getSessionColor, SESSION_ORDER } from '@/lib/sessions';
import { Info } from 'lucide-react';

interface Props {
  stats: SessionStats[];
}

export default function SessionTable({ stats }: Props) {
  if (stats.length === 0) return null;
  const sorted = [...stats].sort((a, b) => SESSION_ORDER.indexOf(a.session) - SESSION_ORDER.indexOf(b.session));

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-ink-50">Session Summary</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-ink-300 cursor-help" />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-ink-800 border border-ink-500 rounded-lg text-xs text-ink-200 z-10">
            Descriptive statistics per trading session. Range = High − Low per minute. Share of daily range = session's contribution to the day's total range.
          </div>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-500">
              <th className="text-left py-3 px-2 font-medium text-ink-200">Session</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Avg Range</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Median</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Std Dev</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">95th Pct</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Max</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Skew</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Kurtosis</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Realized Vol</th>
              <th className="text-right py-3 px-2 font-medium text-ink-200">Daily Share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.session} className="border-b border-ink-500/30 hover:bg-ink-600/40 transition-colors">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getSessionColor(s.session), boxShadow: `0 0 8px ${getSessionColor(s.session)}` }} />
                    <span className="font-medium text-ink-50">{s.session}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-2 stat-value text-gold-200">{s.avgRange.toFixed(2)}</td>
                <td className="text-right py-3 px-2 stat-value text-ink-100">{s.medianRange.toFixed(2)}</td>
                <td className="text-right py-3 px-2 stat-value text-ink-100">{s.stdRange.toFixed(2)}</td>
                <td className="text-right py-3 px-2 stat-value text-ink-100">{s.pct95Range.toFixed(2)}</td>
                <td className="text-right py-3 px-2 stat-value text-accent-rose">{s.maxRange.toFixed(2)}</td>
                <td className="text-right py-3 px-2 stat-value text-ink-100">{s.skewness.toFixed(3)}</td>
                <td className="text-right py-3 px-2 stat-value text-ink-100">{s.kurtosis.toFixed(3)}</td>
                <td className="text-right py-3 px-2 stat-value text-accent-cyan">{s.realizedVol.toFixed(4)}</td>
                <td className="text-right py-3 px-2 stat-value text-accent-emerald">{s.shareOfDailyRange.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

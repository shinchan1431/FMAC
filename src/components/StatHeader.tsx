import { TrendingUp, Activity, BarChart3, Coins } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { getSessionColor } from '@/lib/sessions';

interface Props {
  result: AnalysisResult;
}

export default function StatHeader({ result }: Props) {
  const totalBars = result.totalBars;
  const formattedBars = totalBars >= 1e6
    ? `${(totalBars / 1e6).toFixed(2)}M`
    : totalBars >= 1e3
    ? `${(totalBars / 1e3).toFixed(1)}K`
    : `${totalBars}`;

  const topSession = [...result.sessionStats].sort((a, b) => b.avgRange - a.avgRange)[0];
  const lowSession = [...result.sessionStats].sort((a, b) => a.avgRange - b.avgRange)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card
        icon={<BarChart3 className="w-5 h-5" />}
        label="Data Points"
        value={formattedBars}
        sub={`${result.dateRange.start} → ${result.dateRange.end}`}
        color="text-gold-300"
      />
      <Card
        icon={<Activity className="w-5 h-5" />}
        label="Most Volatile"
        value={topSession?.session ?? '—'}
        sub={topSession ? `Avg range: ${topSession.avgRange.toFixed(2)}` : ''}
        color="text-accent-rose"
        dotColor={topSession ? getSessionColor(topSession.session) : undefined}
      />
      <Card
        icon={<TrendingUp className="w-5 h-5" />}
        label="Least Volatile"
        value={lowSession?.session ?? '—'}
        sub={lowSession ? `Avg range: ${lowSession.avgRange.toFixed(2)}` : ''}
        color="text-accent-cyan"
        dotColor={lowSession ? getSessionColor(lowSession.session) : undefined}
      />
      <Card
        icon={<Coins className="w-5 h-5" />}
        label="Years Analyzed"
        value={`${result.years.length}`}
        sub={result.years.join(', ')}
        color="text-accent-emerald"
      />
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
  color,
  dotColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  dotColor?: string;
}) {
  return (
    <div className="glass-card glass-card-hover p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <span className={color}>{icon}</span>
        <span className="text-xs font-medium text-ink-200 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {dotColor && (
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
        )}
        <span className="text-2xl font-bold text-ink-50 stat-value">{value}</span>
      </div>
      <p className="text-xs text-ink-300 mt-2 font-mono truncate">{sub}</p>
    </div>
  );
}

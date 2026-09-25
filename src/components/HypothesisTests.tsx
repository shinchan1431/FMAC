import type { TestResult, PostHocResult } from '@/types';
import { CheckCircle2, XCircle, FlaskConical } from 'lucide-react';

interface Props {
  tests: TestResult[];
  postHoc: PostHocResult[];
}

export default function HypothesisTests({ tests, postHoc }: Props) {
  if (tests.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Main tests */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-gold-300" />
          <h3 className="text-lg font-semibold text-ink-50">Hypothesis Tests</h3>
          <span className="text-xs text-ink-300 ml-auto">α = 0.05</span>
        </div>
        <div className="space-y-3">
          {tests.map((t) => (
            <div
              key={t.name}
              className={`p-4 rounded-xl border transition-all ${
                t.significant
                  ? 'bg-accent-rose/5 border-accent-rose/30'
                  : 'bg-accent-emerald/5 border-accent-emerald/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {t.significant ? (
                    <XCircle className="w-4 h-4 text-accent-rose" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                  )}
                  <span className="font-medium text-ink-50 text-sm">{t.name}</span>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  t.significant ? 'bg-accent-rose/10 text-accent-rose' : 'bg-accent-emerald/10 text-accent-emerald'
                }`}>
                  p = {t.pValue < 0.001 ? '<0.001' : t.pValue.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-300">
                <span className="font-mono">Statistic: {t.statistic.toFixed(4)}</span>
                <span>{t.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post-hoc Dunn's test */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-ink-50">Post-hoc Dunn's Test</h3>
          <span className="text-xs text-ink-300 ml-auto">Bonferroni-corrected</span>
        </div>
        {postHoc.length === 0 ? (
          <p className="text-sm text-ink-300">No post-hoc results available.</p>
        ) : (
          <div className="space-y-2">
            {postHoc.map((r) => (
              <div
                key={r.pair}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  r.significant
                    ? 'bg-accent-rose/5 border-accent-rose/20'
                    : 'bg-ink-600/40 border-ink-500/30'
                }`}
              >
                <span className="text-sm text-ink-100 font-medium">{r.pair}</span>
                <div className="flex items-center gap-3">
                  {r.significant && <XCircle className="w-3.5 h-3.5 text-accent-rose" />}
                  <span className={`text-xs font-mono ${r.significant ? 'text-accent-rose' : 'text-ink-300'}`}>
                    p = {r.pValue < 0.001 ? '<0.001' : r.pValue.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-ink-300 pt-2 border-t border-ink-500/30 mt-3">
              Red = significant difference between that pair of sessions. Non-highlighted = no significant difference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

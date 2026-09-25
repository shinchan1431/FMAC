import { useState, useCallback, useRef, useEffect } from 'react';
import { Coins, Upload, Loader2, AlertTriangle, Download, Clock, FileUp } from 'lucide-react';
import type { MinuteBar, AnalysisResult } from '@/types';
import { generateSampleData } from '@/lib/sampleData';
import { computeFeatures, runFullAnalysis } from '@/lib/analysis';
import { parseCSV } from '@/lib/csvParser';
import { SESSIONS } from '@/lib/sessions';
import StatHeader from '@/components/StatHeader';
import SessionTable from '@/components/SessionTable';
import HourlyChart from '@/components/HourlyChart';
import WeekdayHeatmap from '@/components/WeekdayHeatmap';
import YearlyTrendChart from '@/components/YearlyTrendChart';
import BoxPlot from '@/components/BoxPlot';
import HypothesisTests from '@/components/HypothesisTests';
import CorrelationMatrix from '@/components/CorrelationMatrix';

type AppState = 'idle' | 'loading' | 'ready' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dataSource, setDataSource] = useState<'sample' | 'csv'>('sample');
  const [csvName, setCsvName] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadSampleData = useCallback(async () => {
    setState('loading');
    setDataSource('sample');
    setProgress(0);
    setProgressLabel('Generating synthetic XAUUSD tick data (2020–2024)...');
    await new Promise((r) => setTimeout(r, 100));
    try {
      const bars = await generateSampleData();
      setProgress(50);
      setProgressLabel('Computing features and statistical tests...');
      await new Promise((r) => setTimeout(r, 100));
      const analysis = runFullAnalysis(bars);
      setProgress(100);
      setResult(analysis);
      setState('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  }, []);

  const handleCSVFile = useCallback(async (file: File) => {
    setState('loading');
    setDataSource('csv');
    setCsvName(file.name);
    setProgress(10);
    setProgressLabel(`Reading ${file.name}...`);
    try {
      const text = await file.text();
      setProgress(30);
      setProgressLabel('Parsing CSV rows...');
      await new Promise((r) => setTimeout(r, 50));
      const ticks = parseCSV(text);
      setProgress(50);
      setProgressLabel(`Computing features on ${ticks.length.toLocaleString()} ticks...`);
      await new Promise((r) => setTimeout(r, 50));
      const bars = computeFeatures(ticks);
      setProgress(70);
      setProgressLabel('Running statistical analysis...');
      await new Promise((r) => setTimeout(r, 50));
      const analysis = runFullAnalysis(bars);
      setProgress(100);
      setResult(analysis);
      setState('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to parse CSV');
      setState('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      handleCSVFile(file);
    } else {
      setErrorMsg('Please drop a CSV file');
      setState('error');
    }
  }, [handleCSVFile]);

  const exportResults = useCallback(() => {
    if (!result) return;
    const lines: string[] = [];
    lines.push('XAUUSD Session Volatility Analysis Report');
    lines.push(`Date Range: ${result.dateRange.start} to ${result.dateRange.end}`);
    lines.push(`Total bars: ${result.totalBars}`);
    lines.push('');
    lines.push('Session Summary:');
    lines.push('Session,Avg Range,Median,Std Dev,95th Pct,Max,Skew,Kurtosis,Realized Vol,Daily Share %');
    for (const s of result.sessionStats) {
      lines.push(`${s.session},${s.avgRange.toFixed(4)},${s.medianRange.toFixed(4)},${s.stdRange.toFixed(4)},${s.pct95Range.toFixed(4)},${s.maxRange.toFixed(4)},${s.skewness.toFixed(4)},${s.kurtosis.toFixed(4)},${s.realizedVol.toFixed(6)},${s.shareOfDailyRange.toFixed(2)}`);
    }
    lines.push('');
    lines.push('Hypothesis Tests:');
    lines.push('Test,Statistic,p-value,Significant');
    for (const t of result.tests) {
      lines.push(`${t.name},${t.statistic.toFixed(6)},${t.pValue.toFixed(6)},${t.significant}`);
    }
    lines.push('');
    lines.push("Dunn's Post-hoc:");
    lines.push('Pair,p-value,Significant');
    for (const p of result.postHoc) {
      lines.push(`${p.pair},${p.pValue.toFixed(6)},${p.significant}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xauusd-volatility-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  // Auto-load sample data on first mount
  useEffect(() => {
    loadSampleData();
  }, [loadSampleData]);

  return (
    <div className="min-h-screen text-ink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-ink-800/70 border-b border-ink-500/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/30">
                  <Coins className="w-5 h-5 text-ink-900" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-emerald animate-pulse-gold" />
              </div>
              <div>
                <h1 className="text-lg font-bold gold-text leading-tight">XAUUSD Session Volatility</h1>
                <p className="text-xs text-ink-300 leading-tight">Statistical analysis of gold's intraday trading sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {state === 'ready' && (
                <button
                  onClick={exportResults}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-600/60 hover:bg-ink-500/60 border border-ink-500/40 text-sm text-ink-100 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export Report</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCSVFile(f);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold-300/10 hover:bg-gold-300/20 border border-gold-300/30 text-sm text-gold-200 transition-all"
              >
                <FileUp className="w-4 h-4" />
                <span className="hidden sm:inline">Upload CSV</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading state */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-ink-500/30" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-300 animate-spin" />
              <Coins className="absolute inset-0 m-auto w-8 h-8 text-gold-300" />
            </div>
            <p className="text-ink-100 font-medium mb-2">{progressLabel}</p>
            <div className="w-64 h-1.5 bg-ink-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-ink-300 mt-2 font-mono">{progress}%</p>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="glass-card p-8 max-w-md text-center">
              <AlertTriangle className="w-12 h-12 text-accent-rose mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink-50 mb-2">Something went wrong</h3>
              <p className="text-sm text-ink-300 mb-4">{errorMsg}</p>
              <button
                onClick={loadSampleData}
                className="px-4 py-2 rounded-lg bg-gold-300/20 hover:bg-gold-300/30 border border-gold-300/30 text-gold-200 text-sm transition-all"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        )}

        {/* Ready state */}
        {state === 'ready' && result && (
          <div className="space-y-6 animate-fade-in">
            {/* Data source badge */}
            <div className="flex items-center gap-2 text-xs text-ink-300">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {dataSource === 'sample' ? 'Sample dataset' : `CSV: ${csvName}`} — {result.totalBars.toLocaleString()} minute bars — {result.dateRange.start} to {result.dateRange.end}
              </span>
            </div>

            {/* Stat cards */}
            <StatHeader result={result} />

            {/* Session table */}
            <SessionTable stats={result.sessionStats} />

            {/* Hourly chart */}
            <HourlyChart data={result.hourlyAvg} />

            {/* Heatmap + Box plot */}
            <div className="grid lg:grid-cols-2 gap-6">
              <WeekdayHeatmap data={result.weekdaySessionAvg} />
              <BoxPlot stats={result.sessionStats} />
            </div>

            {/* Yearly trend */}
            <YearlyTrendChart data={result.yearlyTrend} />

            {/* Hypothesis tests */}
            <HypothesisTests tests={result.tests} postHoc={result.postHoc} />

            {/* Correlation matrix */}
            <CorrelationMatrix stats={result.sessionStats} />

            {/* Disclaimer */}
            <div className="glass-card p-5 border-ink-500/30">
              <p className="text-xs text-ink-300 leading-relaxed">
                <strong className="text-ink-200">Disclaimer:</strong> This is a descriptive statistical study of historical price data, not a trading recommendation.
                Past volatility patterns do not guarantee future behavior. Session boundaries are defined in UTC and may shift with daylight saving time changes.
                Always conduct your own research before making trading decisions.
              </p>
            </div>
          </div>
        )}

        {/* Idle / drag-drop zone (shown briefly before auto-load) */}
        {state === 'idle' && (
          <div
            className={`flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-2xl transition-all ${
              dragOver ? 'border-gold-300 bg-gold-300/5' : 'border-ink-500/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-ink-300 mb-4" />
            <p className="text-ink-200 mb-2">Drag and drop a CSV file here, or</p>
            <button
              onClick={loadSampleData}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-300 to-gold-500 text-ink-900 font-semibold hover:shadow-lg hover:shadow-gold-500/30 transition-all"
            >
              Load Sample Data
            </button>
            <p className="text-xs text-ink-300 mt-4">Supports Dukascopy / HistData CSV formats with timestamp, OHLC, volume columns</p>
          </div>
        )}
      </main>

      {/* Session legend footer */}
      {state === 'ready' && (
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {SESSIONS.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.glow}` }} />
                  <span className="text-sm text-ink-100 font-medium">{s.name}</span>
                  <span className="text-xs text-ink-300 font-mono">{s.startUTC}:00–{s.endUTC}:00 UTC</span>
                </div>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

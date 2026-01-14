import { useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';

interface SimpleLandingProps {
  onOpenAdvanced: () => void;
}

type Preset = {
  label: string;
  volume: number;
  aht: number;
  targetSLPercent: number;
  thresholdSeconds: number;
  concurrency?: number;
  shrinkagePercent?: number;
  maxOccupancy?: number;
};

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm text-text-primary">
      <span className="text-text-muted text-2xs uppercase tracking-widest">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

const presets: Preset[] = [
  { label: 'Sample voice', volume: 220, aht: 240, targetSLPercent: 80, thresholdSeconds: 20, shrinkagePercent: 30, maxOccupancy: 85 },
  { label: 'Sample chat (2x concurrency)', volume: 140, aht: 360, targetSLPercent: 75, thresholdSeconds: 40, concurrency: 2, shrinkagePercent: 28, maxOccupancy: 80 },
];

function SimpleLanding({ onOpenAdvanced }: SimpleLandingProps) {
  const inputs = useCalculatorStore((state) => state.inputs);
  const results = useCalculatorStore((state) => state.results);
  const setInput = useCalculatorStore((state) => state.setInput);
  const calculate = useCalculatorStore((state) => state.calculate);

  const requiredAgents = results?.requiredAgents ?? 0;
  const occupancy = results?.occupancy ?? null;
  const serviceLevel = results?.serviceLevel ?? null;
  const totalFTE = results?.totalFTE ?? null;

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)));

  const applyPreset = (preset: Preset) => {
    setInput('volume', preset.volume);
    setInput('aht', preset.aht);
    setInput('targetSLPercent', preset.targetSLPercent);
    setInput('thresholdSeconds', preset.thresholdSeconds);
    setInput('concurrency', preset.concurrency ?? 1);
    setInput('shrinkagePercent', preset.shrinkagePercent ?? inputs.shrinkagePercent);
    setInput('maxOccupancy', preset.maxOccupancy ?? inputs.maxOccupancy);
    setInput('model', 'C');
    calculate();
  };

  const headline = useMemo(() => {
    if (!results) return 'Plan your team in three inputs.';
    return results.canAchieveTarget ? 'You can hit this target with:' : 'To hit your target, you need:';
  }, [results]);

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-cyan/10 via-bg-elevated to-bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-lg shadow-cyan/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-2xs uppercase tracking-widest text-text-muted">Simple mode</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
              Plan your staffing with the magic triangle: Volume, AHT, and Service Level.
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl">
              We keep shrinkage, occupancy caps, and Erlang choices on sensible defaults. Your inputs stay synced when you open the Advanced Studio.
            </p>
            <div className="flex flex-wrap gap-3 text-2xs text-text-muted">
              <span className="px-2 py-1 rounded-full border border-border-subtle">Erlang C engine</span>
              <span className="px-2 py-1 rounded-full border border-border-subtle">100% browser-only</span>
              <span className="px-2 py-1 rounded-full border border-border-subtle">No uploads needed</span>
            </div>
          </div>
          <div className="bg-bg-base border border-border-subtle rounded-xl p-4 sm:p-5 w-full md:max-w-xs">
            <p className="text-2xs uppercase tracking-widest text-text-muted">{headline}</p>
            <div className="mt-2 text-4xl sm:text-5xl font-black text-text-primary tracking-tight">
              {formatNumber(requiredAgents)} agents
            </div>
            <p className="text-xs text-text-secondary mt-1">Per {inputs.intervalMinutes}-minute interval</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <MetricChip label="Service level" value={`${Math.round(serviceLevel ?? inputs.targetSLPercent)}% in ${inputs.thresholdSeconds}s`} />
              <MetricChip label="Occupancy" value={occupancy !== null ? `${Math.round(occupancy)}%` : '—'} />
              {totalFTE !== null && <MetricChip label="FTE (approx)" value={formatNumber(totalFTE)} />}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-widest text-text-muted">Step 1</p>
              <h3 className="text-base font-semibold text-text-primary">Calls per interval</h3>
            </div>
            <span className="text-sm text-text-secondary">{inputs.intervalMinutes} min</span>
          </div>
          <input
            type="range"
            min={0}
            max={1200}
            step={10}
            value={inputs.volume}
            onChange={(e) => setInput('volume', Number(e.target.value))}
            className="w-full accent-cyan"
          />
          <div className="flex items-center justify-between text-2xs text-text-secondary">
            <span>Low</span>
            <span className="font-semibold text-text-primary">{formatNumber(inputs.volume)} contacts</span>
            <span>High</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs uppercase tracking-widest text-text-muted">Step 2</p>
              <h3 className="text-base font-semibold text-text-primary">Average handle time</h3>
            </div>
            <span className="text-sm text-text-secondary">Seconds</span>
          </div>
          <input
            type="range"
            min={60}
            max={1200}
            step={15}
            value={inputs.aht}
            onChange={(e) => setInput('aht', Number(e.target.value))}
            className="w-full accent-cyan"
          />
          <div className="flex items-center justify-between text-2xs text-text-secondary">
            <span>1 min</span>
            <span className="font-semibold text-text-primary">{Math.round(inputs.aht)}s</span>
            <span>20 min</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-3 shadow-sm">
          <div>
            <p className="text-2xs uppercase tracking-widest text-text-muted">Step 3</p>
            <h3 className="text-base font-semibold text-text-primary">Service level target</h3>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={inputs.targetSLPercent}
            onChange={(e) => setInput('targetSLPercent', Number(e.target.value))}
            className="w-full accent-cyan"
          />
          <div className="flex items-center justify-between text-2xs text-text-secondary">
            <span>Relaxed</span>
            <span className="font-semibold text-text-primary">{Math.round(inputs.targetSLPercent)}%</span>
            <span>Strict</span>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-2xs uppercase tracking-widest text-text-muted">Answer within</label>
            <select
              value={inputs.thresholdSeconds}
              onChange={(e) => setInput('thresholdSeconds', Number(e.target.value))}
              className="bg-bg-base border border-border-subtle rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-cyan"
            >
              {[20, 30, 40, 60].map((opt) => (
                <option key={opt} value={opt}>{opt} seconds</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="px-4 py-2 bg-bg-base border border-border-subtle rounded-lg text-sm font-semibold text-text-primary hover:border-cyan/40 transition-colors"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={onOpenAdvanced}
            className="px-4 py-2 bg-cyan text-bg-base rounded-lg text-sm font-bold shadow-glow-cyan"
          >
            Open Advanced Studio
          </button>
          <button
            onClick={() => {
              setInput('shrinkagePercent', 30);
              setInput('maxOccupancy', 85);
              setInput('model', 'C');
              calculate();
            }}
            className="px-4 py-2 text-sm font-semibold text-text-secondary underline"
          >
            Reset to sensible defaults
          </button>
        </div>
        <div className="text-2xs text-text-muted space-x-3">
          <span>Defaults: 30% shrinkage · 85% occupancy cap · Erlang C</span>
          <span className="hidden sm:inline">Need more controls? Open Advanced to set concurrency, BPO, and schedules.</span>
        </div>
      </section>
    </div>
  );
}

export default SimpleLanding;

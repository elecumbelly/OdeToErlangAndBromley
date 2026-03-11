import { useEffect } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { NumberInput } from './ui/NumberInput';
import type { CalculationInputs } from '../types';

interface SimpleLandingProps {
  onOpenAdvanced: () => void;
}

type Preset = {
  label: string;
  summary: string;
  volume: number;
  intervalMinutes: number;
  aht: number;
  targetSLPercent: number;
  thresholdSeconds: number;
  shrinkagePercent: number;
  maxOccupancy: number;
};

const presets: Preset[] = [
  {
    label: 'Small team',
    summary: '80 contacts in 30 mins',
    volume: 80,
    intervalMinutes: 30,
    aht: 210,
    targetSLPercent: 80,
    thresholdSeconds: 20,
    shrinkagePercent: 25,
    maxOccupancy: 90,
  },
  {
    label: 'Typical queue',
    summary: '180 contacts in 30 mins',
    volume: 180,
    intervalMinutes: 30,
    aht: 260,
    targetSLPercent: 80,
    thresholdSeconds: 20,
    shrinkagePercent: 30,
    maxOccupancy: 85,
  },
  {
    label: 'Busy hour',
    summary: '320 contacts in 60 mins',
    volume: 320,
    intervalMinutes: 60,
    aht: 320,
    targetSLPercent: 85,
    thresholdSeconds: 30,
    shrinkagePercent: 32,
    maxOccupancy: 82,
  },
];

const intervalOptions = [15, 30, 60];

function NumberField({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  error,
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (nextValue: number) => void;
  error?: string;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <span className="text-2xs uppercase tracking-[0.18em] text-text-muted">{hint}</span>
      </div>
      <NumberInput
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) {
            onChange(parsed);
          }
        }}
        className={`w-full rounded-xl border px-4 py-3 text-base font-semibold text-text-primary ${
          error
            ? 'border-red/50 bg-red/5 focus:border-red focus:ring-red/20'
            : 'border-border-subtle bg-bg-base'
        }`}
        containerClassName="gap-3"
      />
      <div className="min-h-4 text-2xs text-text-muted">{error ?? ' '}</div>
    </label>
  );
}

function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-base p-4">
      <p className="text-2xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{note}</p>
    </div>
  );
}

function Pill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
        active
          ? 'border-cyan bg-cyan text-bg-base shadow-glow-cyan'
          : 'border-border-subtle bg-bg-base text-text-secondary hover:border-cyan/40 hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}

function formatWholeNumber(value: number | null | undefined) {
  return Math.max(0, Math.round(value ?? 0)).toLocaleString();
}

function formatDecimal(value: number | null | undefined) {
  return (value ?? 0).toFixed(2);
}

function formatSeconds(value: number | null | undefined) {
  const safeValue = Math.max(0, Math.round(value ?? 0));
  return `${safeValue}s`;
}

function fieldError(
  errors: Array<{ field: keyof CalculationInputs; message: string }>,
  field: keyof CalculationInputs
) {
  return errors.find((error) => error.field === field)?.message;
}

function SimpleLanding({ onOpenAdvanced }: SimpleLandingProps) {
  const inputs = useCalculatorStore((state) => state.inputs);
  const results = useCalculatorStore((state) => state.results);
  const validation = useCalculatorStore((state) => state.validation);
  const setInput = useCalculatorStore((state) => state.setInput);

  useEffect(() => {
    setInput('model', 'C');
    setInput('solveFor', 'agents');
    setInput('concurrency', 1);
  }, [setInput]);

  const applyPreset = (preset: Preset) => {
    setInput('volume', preset.volume);
    setInput('intervalMinutes', preset.intervalMinutes);
    setInput('aht', preset.aht);
    setInput('targetSLPercent', preset.targetSLPercent);
    setInput('thresholdSeconds', preset.thresholdSeconds);
    setInput('shrinkagePercent', preset.shrinkagePercent);
    setInput('maxOccupancy', preset.maxOccupancy);
    setInput('model', 'C');
    setInput('solveFor', 'agents');
    setInput('concurrency', 1);
  };

  const heroBadges = [
    'Same Erlang engine as Advanced',
    'Browser-only and private by default',
    'No login required',
  ];

  const resultNarrative = results?.canAchieveTarget
    ? 'Target service level is achievable with the calculated staffing.'
    : 'The engine had to trade off target service and occupancy constraints.';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,247,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,136,255,0.1),transparent_35%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-2xs uppercase tracking-[0.26em] text-cyan">Simple Erlang C Calculator</p>
              <h2 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary sm:text-5xl">
                The quick staffing page for people who just want the number.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Enter volume, handle time, and service target. This page uses the same mathematical model
                as the main app, but strips the workflow down to the plain calculator pattern people
                expect from traditional Erlang sites.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {heroBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-border-subtle bg-bg-base/80 px-3 py-1 text-2xs uppercase tracking-[0.18em] text-text-secondary"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-left transition-colors hover:border-cyan/40 hover:bg-bg-hover"
                >
                  <p className="text-sm font-semibold text-text-primary">{preset.label}</p>
                  <p className="mt-1 text-2xs uppercase tracking-[0.16em] text-text-muted">{preset.summary}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <MetricTile
              label="Agents"
              value={formatWholeNumber(results?.requiredAgents)}
              note={`Needed in each ${inputs.intervalMinutes}-minute period`}
            />
            <MetricTile
              label="FTE"
              value={formatWholeNumber(results?.totalFTE)}
              note="Approximate headcount including shrinkage"
            />
            <MetricTile
              label="Workload"
              value={formatDecimal(results?.trafficIntensity)}
              note="Traffic intensity in erlangs"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-border-subtle bg-bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-border-muted pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xs uppercase tracking-[0.2em] text-text-muted">Calculator Inputs</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">Standard Erlang C staffing</h3>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Simple front page, same core model. Advanced mode keeps scenarios, imports, backups,
                scheduling, and the other queueing variants.
              </p>
            </div>
            <button
              onClick={onOpenAdvanced}
              className="rounded-full bg-cyan px-5 py-3 text-sm font-bold text-bg-base shadow-glow-cyan"
            >
              Open advanced planner
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Contact load
                </p>
                <div className="flex flex-wrap gap-2">
                  {intervalOptions.map((minutes) => (
                    <Pill
                      key={minutes}
                      active={inputs.intervalMinutes === minutes}
                      label={`${minutes} min`}
                      onClick={() => setInput('intervalMinutes', minutes)}
                    />
                  ))}
                </div>
              </div>

              <NumberField
                label={`Contacts arriving in ${inputs.intervalMinutes} minutes`}
                hint="Volume"
                min={0}
                max={5000}
                step={1}
                value={inputs.volume}
                onChange={(value) => setInput('volume', value)}
                error={fieldError(validation.errors, 'volume')}
              />

              <NumberField
                label="Average handle time"
                hint="Seconds"
                min={1}
                max={3600}
                step={1}
                value={inputs.aht}
                onChange={(value) => setInput('aht', value)}
                error={fieldError(validation.errors, 'aht')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Service level target"
                hint="Percent"
                min={1}
                max={99}
                step={1}
                value={inputs.targetSLPercent}
                onChange={(value) => setInput('targetSLPercent', value)}
                error={fieldError(validation.errors, 'targetSLPercent')}
              />

              <NumberField
                label="Answer time target"
                hint="Seconds"
                min={1}
                max={600}
                step={1}
                value={inputs.thresholdSeconds}
                onChange={(value) => setInput('thresholdSeconds', value)}
                error={fieldError(validation.errors, 'thresholdSeconds')}
              />
            </div>

            <details className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-base">
              <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                Staffing assumptions
              </summary>
              <div className="grid gap-4 border-t border-border-muted px-4 py-4 sm:grid-cols-2">
                <NumberField
                  label="Shrinkage"
                  hint="Percent"
                  min={0}
                  max={95}
                  step={1}
                  value={inputs.shrinkagePercent}
                  onChange={(value) => setInput('shrinkagePercent', value)}
                  error={fieldError(validation.errors, 'shrinkagePercent')}
                />

                <NumberField
                  label="Maximum occupancy"
                  hint="Percent"
                  min={50}
                  max={99}
                  step={1}
                  value={inputs.maxOccupancy}
                  onChange={(value) => setInput('maxOccupancy', value)}
                  error={fieldError(validation.errors, 'maxOccupancy')}
                />
              </div>
            </details>

            {!validation.valid && (
              <div className="rounded-2xl border border-red/30 bg-red/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red">Check inputs</p>
                <p className="mt-1 text-sm text-text-secondary">{validation.errors[0]?.message}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[28px] border border-border-subtle bg-bg-surface p-5 sm:p-6">
          <div className="rounded-[24px] border border-cyan/20 bg-[linear-gradient(180deg,rgba(0,255,247,0.08),transparent)] p-5">
            <p className="text-2xs uppercase tracking-[0.2em] text-cyan">Calculated result</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-6xl font-black leading-none tracking-tight text-text-primary">
                {formatWholeNumber(results?.requiredAgents)}
              </span>
              <span className="pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
                agents
              </span>
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Estimated staffing required for {inputs.volume.toLocaleString()} contacts in {inputs.intervalMinutes}
              {' '}minutes at {inputs.aht.toLocaleString()} seconds AHT.
            </p>
            <p className="mt-4 rounded-2xl border border-border-subtle bg-bg-base/80 px-4 py-3 text-sm text-text-secondary">
              {resultNarrative}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricTile
              label="Service Level"
              value={`${formatWholeNumber(results?.serviceLevel)}%`}
              note={`Target: ${inputs.targetSLPercent}% in ${inputs.thresholdSeconds}s`}
            />
            <MetricTile
              label="Occupancy"
              value={`${formatWholeNumber(results?.occupancy)}%`}
              note={`Cap set to ${inputs.maxOccupancy}%`}
            />
            <MetricTile
              label="ASA"
              value={formatSeconds(results?.asa)}
              note="Average speed of answer"
            />
            <MetricTile
              label="Shrinkage"
              value={`${inputs.shrinkagePercent}%`}
              note="Applied to convert queue agents to FTE"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-border-subtle bg-bg-base p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Why keep it simple</p>
            <ul className="mt-3 space-y-3 text-sm text-text-secondary">
              <li>Uses the app&apos;s existing Erlang math, not a separate approximation.</li>
              <li>Lets people land, test a scenario, and get a staffing answer immediately.</li>
              <li>Advanced mode is still there when they need scenarios, imports, and exports.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default SimpleLanding;

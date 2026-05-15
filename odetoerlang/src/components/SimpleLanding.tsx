import { useEffect, useId, useRef, useState } from 'react';
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

// Matches store DEFAULT_INPUTS exactly. If the persisted state still matches
// these defaults, the user has never touched the form and we apply the
// beginner-friendly "Start here" preset automatically.
const STORE_DEFAULT_FINGERPRINT = {
  volume: 100,
  aht: 240,
  intervalMinutes: 30,
  targetSLPercent: 80,
  thresholdSeconds: 20,
  shrinkagePercent: 25,
  maxOccupancy: 90,
} as const;

function isPristineDefault(inputs: CalculationInputs): boolean {
  return (
    inputs.volume === STORE_DEFAULT_FINGERPRINT.volume &&
    inputs.aht === STORE_DEFAULT_FINGERPRINT.aht &&
    inputs.intervalMinutes === STORE_DEFAULT_FINGERPRINT.intervalMinutes &&
    inputs.targetSLPercent === STORE_DEFAULT_FINGERPRINT.targetSLPercent &&
    inputs.thresholdSeconds === STORE_DEFAULT_FINGERPRINT.thresholdSeconds &&
    inputs.shrinkagePercent === STORE_DEFAULT_FINGERPRINT.shrinkagePercent &&
    inputs.maxOccupancy === STORE_DEFAULT_FINGERPRINT.maxOccupancy
  );
}

function InfoTip({ label, body }: { label: string; body: string }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setOpen((v) => !v)}
        onBlur={(event) => {
          if (!wrapperRef.current?.contains(event.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border-subtle bg-bg-base text-2xs font-bold leading-none text-text-secondary transition-colors hover:border-cyan/60 hover:text-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
      >
        i
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-1/2 top-6 z-20 w-64 -translate-x-1/2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-xs leading-relaxed text-text-secondary shadow-lg"
        >
          {body}
        </span>
      )}
    </span>
  );
}

function NumberField({
  label,
  hint,
  tip,
  min,
  max,
  step,
  value,
  onChange,
  error,
}: {
  label: string;
  hint: string;
  tip?: string;
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
        <span className="flex items-baseline text-sm font-semibold text-text-primary">
          {label}
          {tip && <InfoTip label={label} body={tip} />}
        </span>
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

function StepBadge({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan text-xs font-black text-bg-base shadow-glow-cyan">
        {n}
      </span>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-text-primary">{title}</p>
    </div>
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

const tooltips = {
  volume:
    'How many contacts (calls, chats, etc.) arrive in this interval. Use a forecast for a single 15/30/60-minute period — not the daily total.',
  aht: 'Average Handle Time: how long an agent typically spends per contact, including talk time and after-call work. Counted in seconds.',
  serviceLevel:
    'The percentage of contacts you want answered within the answer-time target. Industry default is 80% answered in 20s.',
  thresholdSeconds:
    'The "by when" half of your service-level promise. Pairs with the % above (e.g. 80% answered within 20 seconds).',
  shrinkage:
    'Paid time agents are NOT taking contacts — breaks, training, meetings, sick days. Most centres run 25-35%. This is what turns "agents on the phones" into "people on payroll".',
  maxOccupancy:
    'A safety cap. If utilisation goes above this, the model adds more agents to prevent burnout. 85-90% is typical.',
} as const;

function SimpleLanding({ onOpenAdvanced }: SimpleLandingProps) {
  const inputs = useCalculatorStore((state) => state.inputs);
  const results = useCalculatorStore((state) => state.results);
  const validation = useCalculatorStore((state) => state.validation);
  const setInput = useCalculatorStore((state) => state.setInput);

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

  const mountedRef = useRef(false);
  useEffect(() => {
    // Guard against React 18 StrictMode dev double-invoke: the captured
    // `inputs` reflects pre-write state, so a naive re-run would re-detect
    // the defaults and re-apply the preset after the first run already
    // changed them. Read fresh state to make the decision.
    if (mountedRef.current) return;
    mountedRef.current = true;

    const state = useCalculatorStore.getState();
    state.setInput('model', 'C');
    state.setInput('solveFor', 'agents');
    state.setInput('concurrency', 1);
    if (isPristineDefault(state.inputs)) {
      applyPreset(presets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heroBadges = [
    'Same Erlang engine as Advanced',
    'Browser-only and private by default',
    'No login required',
  ];

  const resultNarrative = results?.canAchieveTarget
    ? 'Target service level is achievable with the calculated staffing.'
    : 'The engine had to trade off target service and occupancy constraints.';

  const agentsValue = Math.max(0, Math.round(results?.requiredAgents ?? 0));
  const fteValue = Math.max(0, Math.round(results?.totalFTE ?? 0));

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
              {presets.map((preset, index) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="relative rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-left transition-colors hover:border-cyan/40 hover:bg-bg-hover"
                >
                  {index === 0 && (
                    <span className="absolute -top-2 left-3 rounded-full bg-cyan px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.16em] text-bg-base shadow-glow-cyan">
                      Start here
                    </span>
                  )}
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

          <div className="mt-6 space-y-7">
            <div className="space-y-4">
              <StepBadge n={1} title="How many contacts?" />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-base/50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Interval length
                </span>
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
                tip={tooltips.volume}
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
                tip={tooltips.aht}
                min={1}
                max={3600}
                step={1}
                value={inputs.aht}
                onChange={(value) => setInput('aht', value)}
                error={fieldError(validation.errors, 'aht')}
              />
            </div>

            <div className="space-y-4">
              <StepBadge n={2} title="How fast do you need to answer?" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Service level target"
                  hint="Percent"
                  tip={tooltips.serviceLevel}
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
                  tip={tooltips.thresholdSeconds}
                  min={1}
                  max={600}
                  step={1}
                  value={inputs.thresholdSeconds}
                  onChange={(value) => setInput('thresholdSeconds', value)}
                  error={fieldError(validation.errors, 'thresholdSeconds')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <StepBadge n={3} title="Who's actually available?" />
              <details open className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-base">
                <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Staffing assumptions
                </summary>
                <div className="grid gap-4 border-t border-border-muted px-4 py-4 sm:grid-cols-2">
                  <NumberField
                    label="Shrinkage"
                    hint="Percent"
                    tip={tooltips.shrinkage}
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
                    tip={tooltips.maxOccupancy}
                    min={50}
                    max={99}
                    step={1}
                    value={inputs.maxOccupancy}
                    onChange={(value) => setInput('maxOccupancy', value)}
                    error={fieldError(validation.errors, 'maxOccupancy')}
                  />
                </div>
              </details>
            </div>

            {!validation.valid && (
              <div className="rounded-2xl border border-red/30 bg-red/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red">Check inputs</p>
                <p className="mt-1 text-sm text-text-secondary">{validation.errors[0]?.message}</p>
              </div>
            )}

            <details className="rounded-2xl border border-border-subtle bg-bg-base">
              <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                What do these terms mean?
              </summary>
              <dl className="space-y-3 border-t border-border-muted px-4 py-4 text-sm text-text-secondary">
                <div>
                  <dt className="font-semibold text-text-primary">Erlang C</dt>
                  <dd>The classic queueing formula for call centres: assumes callers wait in a queue rather than hang up. The math behind the agent number.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-primary">AHT (Average Handle Time)</dt>
                  <dd>Talk time plus after-call work, per contact. The single biggest lever on staffing — a 30-second AHT bump can add several agents.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-primary">Service Level</dt>
                  <dd>"% of contacts answered within N seconds." Always quoted as a pair: 80/20 means 80% answered within 20s.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-primary">Occupancy</dt>
                  <dd>What share of logged-in time an agent is actually handling contacts. Above ~90% sustained, burnout and errors climb sharply.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-primary">Shrinkage</dt>
                  <dd>Paid time agents aren't on contacts: breaks, training, sick days, meetings. Typical 25-35%. Drives the gap between "agents needed" and "people to hire".</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-primary">FTE (Full-Time Equivalent)</dt>
                  <dd>Headcount you actually pay for, after adding shrinkage and converting part-timers to full-time units. Always &gt; agents-on-the-floor.</dd>
                </div>
              </dl>
            </details>
          </div>
        </div>

        <aside className="rounded-[28px] border border-border-subtle bg-bg-surface p-5 sm:p-6">
          <div className="rounded-[24px] border border-cyan/20 bg-[linear-gradient(180deg,rgba(0,255,247,0.08),transparent)] p-5">
            <p className="text-2xs uppercase tracking-[0.2em] text-cyan">Calculated result</p>
            <p className="mt-3 text-base leading-7 text-text-secondary">
              You need{' '}
              <span className="text-2xl font-black tracking-tight text-text-primary">
                {agentsValue.toLocaleString()} agent{agentsValue === 1 ? '' : 's'}
              </span>{' '}
              on the floor — about{' '}
              <span className="text-2xl font-black tracking-tight text-text-primary">
                {fteValue.toLocaleString()}{' '}
                {fteValue === 1 ? 'person' : 'people'} on payroll
              </span>{' '}
              to cover breaks and shrinkage.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Based on {inputs.volume.toLocaleString()} contacts in {inputs.intervalMinutes} minutes at{' '}
              {inputs.aht.toLocaleString()}s AHT, with {inputs.shrinkagePercent}% shrinkage.
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

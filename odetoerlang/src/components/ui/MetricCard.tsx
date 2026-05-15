import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { cn } from '../../utils/cn';

export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricStatus = 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  decimals?: number;
  trend?: MetricTrend;
  status?: MetricStatus;
  description?: string;
  className?: string;
  animate?: boolean;
  glow?: boolean;
  /**
   * Optional target value. When provided, a delta badge is shown next to
   * the trend arrow: e.g. `+3.2` (above target, success) or `-1.1` (below).
   * Caller decides which direction is "good" via `targetGoodDirection`.
   */
  target?: number;
  targetGoodDirection?: 'higher' | 'lower';
  /**
   * Optional historical series for a sparkline. ~5-20 points produces a
   * useful trend. Series-end is interpreted as the most recent value.
   */
  history?: number[];
}

const statusStyles: Record<MetricStatus, string> = {
  success: 'text-green',
  warning: 'text-amber',
  error: 'text-red',
  neutral: 'text-text-primary',
  info: 'text-cyan',
};

const statusBorderStyles: Record<MetricStatus, string> = {
  success: 'border-green/20 hover:border-green/40',
  warning: 'border-amber/20 hover:border-amber/40',
  error: 'border-red/20 hover:border-red/40',
  neutral: 'border-border-subtle hover:border-border-active',
  info: 'border-cyan/20 hover:border-cyan/40',
};

const glowStyles: Record<MetricStatus, string> = {
  success: 'hover:shadow-glow-green',
  warning: 'hover:shadow-glow-amber',
  error: 'hover:shadow-glow-red',
  neutral: '',
  info: 'hover:shadow-glow-cyan',
};

const trendIcons: Record<MetricTrend, string> = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
};

const trendStyles: Record<MetricTrend, string> = {
  up: 'text-green',
  down: 'text-red',
  neutral: 'text-text-muted',
};

function computeDeltaBadge(
  value: number | string,
  target: number | undefined,
  decimals: number,
  targetGoodDirection: 'higher' | 'lower'
): { text: string; good: boolean } | null {
  if (typeof target !== 'number' || typeof value !== 'number') return null;
  const delta = value - target;
  const sign = delta > 0 ? '+' : '';
  const good = targetGoodDirection === 'higher' ? delta >= 0 : delta <= 0;
  return { text: `${sign}${delta.toFixed(decimals)} vs target`, good };
}

function Sparkline({ data, status }: { data: number[]; status: MetricStatus }) {
  if (data.length < 2) return null;
  const w = 60;
  const h = 16;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend over time">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} className={statusStyles[status]} />
    </svg>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  decimals = 2,
  trend,
  status = 'neutral',
  description,
  className,
  animate = true,
  glow = false,
  target,
  targetGoodDirection = 'higher',
  history,
}: MetricCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const displayValue = useAnimatedValue(numericValue, animate ? 400 : 0);

  const formattedValue =
    typeof value === 'string'
      ? value
      : displayValue.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });

  const deltaBadge = computeDeltaBadge(value, target, decimals, targetGoodDirection);

  return (
    <div
      className={cn(
        'rounded-lg bg-bg-surface border p-4 transition-all duration-fast',
        statusBorderStyles[status],
        glow && glowStyles[status],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xs font-semibold text-text-secondary uppercase tracking-widest">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {history && history.length > 1 && <Sparkline data={history} status={status} />}
          {trend && (
            <span className={cn('text-sm font-medium', trendStyles[trend])}>
              {trendIcons[trend]}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold tabular-nums', statusStyles[status])}>
          {formattedValue}
        </span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
      </div>

      {deltaBadge && (
        <p className={cn('mt-1 text-2xs font-mono tabular-nums', deltaBadge.good ? 'text-green' : 'text-amber')}>
          {deltaBadge.text}
        </p>
      )}

      {description && (
        <p className="mt-2 text-2xs text-text-muted">{description}</p>
      )}
    </div>
  );
}

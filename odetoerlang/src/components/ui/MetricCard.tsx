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
        {trend && (
          <span className={cn('text-sm font-medium', trendStyles[trend])}>
            {trendIcons[trend]}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold tabular-nums', statusStyles[status])}>
          {formattedValue}
        </span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
      </div>

      {description && (
        <p className="mt-2 text-2xs text-text-muted">{description}</p>
      )}
    </div>
  );
}

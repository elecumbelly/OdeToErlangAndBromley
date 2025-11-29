import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { cn } from '../../utils/cn';

export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricStatus = 'success' | 'warning' | 'error' | 'neutral';

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
}

const statusStyles: Record<MetricStatus, string> = {
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  neutral: 'text-neutral-900',
};

const trendIcons: Record<MetricTrend, string> = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
};

const trendStyles: Record<MetricTrend, string> = {
  up: 'text-success-500',
  down: 'text-error-500',
  neutral: 'text-neutral-400',
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
        'rounded-apple bg-white p-4 shadow-apple transition-all duration-normal hover:-translate-y-0.5 hover:shadow-apple-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        {trend && (
          <span className={cn('text-sm font-medium', trendStyles[trend])}>
            {trendIcons[trend]}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-2xl font-semibold tabular-nums', statusStyles[status])}>
          {formattedValue}
        </span>
        {unit && <span className="text-sm text-neutral-400">{unit}</span>}
      </div>

      {description && <p className="mt-2 text-xs text-neutral-500">{description}</p>}
    </div>
  );
}

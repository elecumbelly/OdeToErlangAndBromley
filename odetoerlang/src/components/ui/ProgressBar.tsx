import { cn } from '../../utils/cn';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'cyan';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-cyan', // Default to cyan
  success: 'bg-green',
  warning: 'bg-amber',
  error: 'bg-red',
  cyan: 'bg-cyan',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

function getVariantFromValue(value: number, max: number): ProgressVariant {
  const percent = (value / max) * 100;
  if (percent >= 95) return 'error'; // Error if near full
  if (percent >= 85) return 'warning'; // Warning if getting high
  if (percent >= 70) return 'success'; // Success if over 70
  return 'default'; // Default for lower progress
}

export function ProgressBar({
  value,
  max = 100,
  variant,
  showLabel = false,
  label,
  size = 'md',
  className,
  animate = true,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const resolvedVariant = variant ?? getVariantFromValue(value, max);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-neutral-600">{label}</span>
          {showLabel && (
            <span className="tabular-nums text-neutral-500">{percent.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-neutral-100', sizeStyles[size])}>
        <div
          className={cn(
            'h-full rounded-full',
            variantStyles[resolvedVariant],
            animate && 'transition-all duration-slow ease-spring'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

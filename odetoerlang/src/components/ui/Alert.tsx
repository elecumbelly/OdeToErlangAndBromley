import { cn } from '../../utils/cn';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  success: {
    container: 'bg-success-50 border-success-200 text-success-800',
    icon: 'text-success-500',
  },
  warning: {
    container: 'bg-warning-50 border-warning-200 text-warning-800',
    icon: 'text-warning-500',
  },
  error: {
    container: 'bg-error-50 border-error-200 text-error-800',
    icon: 'text-error-500',
  },
  info: {
    container: 'bg-primary-50 border-primary-200 text-primary-800',
    icon: 'text-primary-500',
  },
};

const icons: Record<AlertVariant, string> = {
  success: '\u2713',
  warning: '\u26A0',
  error: '\u2717',
  info: '\u2139',
};

export function Alert({ variant = 'info', title, children, className, onDismiss }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex gap-3 rounded-apple border p-4 animate-fade-in',
        styles.container,
        className
      )}
      role="alert"
    >
      <span className={cn('flex-shrink-0 text-lg', styles.icon)}>{icons[variant]}</span>

      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold">{title}</h4>}
        <div className={cn('text-sm', title && 'mt-1')}>{children}</div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          \u2715
        </button>
      )}
    </div>
  );
}

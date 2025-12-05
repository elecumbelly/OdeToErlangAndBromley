import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-cyan/10 text-cyan border border-cyan/30',
    'hover:bg-cyan/20 hover:border-cyan/50 hover:shadow-glow-cyan',
    'active:bg-cyan/30',
    'focus-visible:ring-cyan/50',
  ].join(' '),
  secondary: [
    'bg-bg-elevated text-text-primary border border-border-subtle',
    'hover:bg-bg-hover hover:border-border-active',
    'active:bg-bg-surface',
    'focus-visible:ring-border-active',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary border border-transparent',
    'hover:bg-bg-hover hover:text-text-primary',
    'active:bg-bg-elevated',
    'focus-visible:ring-border-subtle',
  ].join(' '),
  danger: [
    'bg-red/10 text-red border border-red/30',
    'hover:bg-red/20 hover:border-red/50 hover:shadow-glow-red',
    'active:bg-red/30',
    'focus-visible:ring-red/50',
  ].join(' '),
  success: [
    'bg-green/10 text-green border border-green/30',
    'hover:bg-green/20 hover:border-green/50 hover:shadow-glow-green',
    'active:bg-green/30',
    'focus-visible:ring-green/50',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md',
          'transition-all duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
          'active:scale-[0.98]',
          'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none',
          'uppercase tracking-wide',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

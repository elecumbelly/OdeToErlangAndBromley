import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, icon, size = 'md', className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={inputId}
          className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest"
        >
          {label}
        </label>

        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-md border bg-bg-surface text-text-primary transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan',
              'placeholder:text-text-muted',
              error
                ? 'border-red focus:ring-red/30 focus:border-red'
                : 'border-border-subtle hover:border-border-active',
              Boolean(icon) && 'pl-10',
              sizeStyles[size]
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red animate-fade-in">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-2xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

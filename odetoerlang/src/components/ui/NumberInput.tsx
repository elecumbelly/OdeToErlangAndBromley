import { forwardRef, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  containerClassName?: string;
  buttonClassName?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, containerClassName, buttonClassName, disabled, readOnly, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    };

    const adjustValue = (direction: -1 | 1) => {
      const input = inputRef.current;
      if (!input || disabled || readOnly) {
        return;
      }

      if (direction > 0) {
        input.stepUp();
      } else {
        input.stepDown();
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus({ preventScroll: true });
    };

    const sharedButtonClassName =
      'flex min-w-10 items-center justify-center rounded-md border border-border-subtle bg-bg-elevated px-3 text-lg font-semibold leading-none text-text-primary transition-colors hover:border-cyan hover:text-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:cursor-not-allowed disabled:opacity-50';

    return (
      <div className={cn('flex w-full items-stretch gap-2', containerClassName)}>
        <button
          type="button"
          onClick={() => adjustValue(-1)}
          className={cn(sharedButtonClassName, buttonClassName)}
          aria-label="Decrease value"
          disabled={disabled || readOnly}
        >
          -
        </button>
        <input
          {...props}
          ref={setRefs}
          type="number"
          disabled={disabled}
          readOnly={readOnly}
          className={cn('min-w-0 flex-1', className)}
        />
        <button
          type="button"
          onClick={() => adjustValue(1)}
          className={cn(sharedButtonClassName, buttonClassName)}
          aria-label="Increase value"
          disabled={disabled || readOnly}
        >
          +
        </button>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

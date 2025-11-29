import { useState, useEffect, useRef } from 'react';

/**
 * Animates a numeric value change with smooth easing.
 * Creates the "counting up" effect seen in Apple interfaces.
 */
export function useAnimatedValue(targetValue: number, duration = 400): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValue = useRef(targetValue);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip animation if duration is 0 or value hasn't changed
    if (duration === 0 || previousValue.current === targetValue) {
      const frame = requestAnimationFrame(() => {
        setDisplayValue(targetValue);
        previousValue.current = targetValue;
      });
      animationRef.current = frame;
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    const startValue = previousValue.current;
    const startTime = performance.now();
    const diff = targetValue - startValue;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * eased;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

/**
 * Status color utilities for consistent visual feedback.
 */

export type StatusLevel = 'success' | 'warning' | 'error' | 'neutral';

interface ThresholdConfig {
  success: number;
  warning: number;
}

/**
 * Determine status level based on value vs target.
 * Higher values are better (e.g., service level).
 */
export function getStatusForTarget(
  value: number,
  target: number,
  thresholds: ThresholdConfig = { success: 1.0, warning: 0.9 }
): StatusLevel {
  const ratio = value / target;
  if (ratio >= thresholds.success) return 'success';
  if (ratio >= thresholds.warning) return 'warning';
  return 'error';
}

/**
 * Determine status level where lower is better (e.g., ASA, abandonment).
 * @param value - Current value
 * @param target - Target value (e.g., max acceptable ASA)
 */
export function getStatusForLimit(
  value: number,
  target: number,
  thresholds: ThresholdConfig = { success: 0.8, warning: 1.0 }
): StatusLevel {
  if (!isFinite(value)) return 'error';
  const ratio = value / target;
  if (ratio <= thresholds.success) return 'success';
  if (ratio <= thresholds.warning) return 'warning';
  return 'error';
}

/**
 * Get status for occupancy (target range, not just higher/lower).
 * Ideal occupancy is typically 80-90%.
 */
export function getOccupancyStatus(occupancy: number): StatusLevel {
  if (occupancy < 0.7) return 'warning'; // Underutilized
  if (occupancy <= 0.9) return 'success'; // Optimal
  if (occupancy <= 0.95) return 'warning'; // Getting high
  return 'error'; // Burnout risk
}

/**
 * Get Tailwind class for text color based on status.
 */
export function getStatusTextClass(status: StatusLevel): string {
  const classes: Record<StatusLevel, string> = {
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    neutral: 'text-neutral-600',
  };
  return classes[status];
}

/**
 * Get Tailwind class for background color based on status.
 */
export function getStatusBgClass(status: StatusLevel): string {
  const classes: Record<StatusLevel, string> = {
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    error: 'bg-error-50',
    neutral: 'bg-neutral-50',
  };
  return classes[status];
}

/**
 * Convenience function: get status + Tailwind classes for a service level value.
 */
export function getServiceLevelStatus(
  achieved: number,
  target: number
): { status: StatusLevel; textClass: string; bgClass: string } {
  const status = getStatusForTarget(achieved, target);
  return {
    status,
    textClass: getStatusTextClass(status),
    bgClass: getStatusBgClass(status),
  };
}

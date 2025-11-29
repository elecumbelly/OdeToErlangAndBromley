/**
 * Formatting utilities for consistent number/text display.
 * All functions are pure and side-effect free.
 */

/**
 * Format a number with locale-aware thousand separators.
 */
export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) return '\u221E'; // Infinity symbol
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a decimal as a percentage.
 * @param value - Value between 0 and 1 (or 0-100 if isPercent=true)
 * @param decimals - Decimal places to show
 * @param isPercent - If true, value is already in percent form (0-100)
 */
export function formatPercent(value: number, decimals = 1, isPercent = false): string {
  if (!isFinite(value)) return '\u2014'; // Em dash for undefined
  const pct = isPercent ? value : value * 100;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Format seconds into a human-readable duration.
 * @param seconds - Duration in seconds
 * @param compact - If true, use abbreviations (30s, 2m, 1h)
 */
export function formatDuration(seconds: number, compact = false): string {
  if (!isFinite(seconds) || seconds < 0) return '\u2014';

  if (seconds < 60) {
    return compact ? `${Math.round(seconds)}s` : `${Math.round(seconds)} seconds`;
  }

  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (compact) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} minutes`;
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (compact) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hours`;
}

/**
 * Format a number as currency.
 */
export function formatCurrency(value: number, currency = 'USD', decimals = 0): string {
  if (!isFinite(value)) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a large number with K/M/B suffixes.
 */
export function formatCompact(value: number): string {
  if (!isFinite(value)) return '\u2014';
  if (Math.abs(value) < 1000) return formatNumber(value);

  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  return formatter.format(value);
}

/**
 * Format Erlangs (traffic intensity) with appropriate precision.
 */
export function formatErlangs(value: number): string {
  if (!isFinite(value)) return '\u2014';
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);
  return value.toFixed(1);
}

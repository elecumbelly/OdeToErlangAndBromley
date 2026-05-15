const INFINITY_GLYPH = '∞';

export const STICKY_HIDDEN_KEY = 'ode_sticky_kpi_hidden';

export function formatNumber(num: number, decimals: number = 2): string {
  if (num === Infinity) return INFINITY_GLYPH;
  if (isNaN(num)) return '-';
  return num.toFixed(decimals);
}

export function formatTime(seconds: number): string {
  if (seconds === Infinity) return INFINITY_GLYPH;
  if (isNaN(seconds)) return '-';
  if (seconds < 60) return `${formatNumber(seconds, 0)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}

export function getStatusColor(value: number, target: number): string {
  if (value >= target) return 'text-green';
  if (value >= target * 0.9) return 'text-amber';
  return 'text-red';
}

export function getOccupancyColor(occupancy: number, maxOccupancy: number): string {
  if (occupancy > maxOccupancy) return 'text-red';
  if (occupancy > maxOccupancy * 0.95) return 'text-amber';
  return 'text-green';
}

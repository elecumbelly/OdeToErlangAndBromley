import { useEffect, useState, useCallback } from 'react';

export interface ChartTheme {
  primary: string;
  secondary: string;
  success: string;
  warn: string;
  danger: string;
  info: string;
  muted: string;
  grid: string;
  axis: string;
  text: string;
  textMuted: string;
  surface: string;
  border: string;
  target: string;
  primaryFill: string;
  successFill: string;
  warnFill: string;
  dangerFill: string;
  infoFill: string;
}

const FILL_ALPHA = 0.18;

function readVarWithFallback(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readTheme(): ChartTheme {
  const cyan = readVarWithFallback('--color-cyan', '#FFEF00');
  const magenta = readVarWithFallback('--color-magenta', '#ff00ff');
  const green = readVarWithFallback('--color-green', '#00ff00');
  const amber = readVarWithFallback('--color-amber', '#ffaa00');
  const red = readVarWithFallback('--color-red', '#ff3333');
  const blue = readVarWithFallback('--color-blue', '#0088ff');
  const text = readVarWithFallback('--color-text-primary', '#ffffff');
  const textSecondary = readVarWithFallback('--color-text-secondary', '#888888');
  const surface = readVarWithFallback('--color-bg-surface', '#0a0a0a');
  const border = readVarWithFallback('--color-border-subtle', '#333333');

  return {
    primary: cyan,
    secondary: magenta,
    success: green,
    warn: amber,
    danger: red,
    info: blue,
    muted: textSecondary,
    grid: border,
    axis: textSecondary,
    text,
    textMuted: textSecondary,
    surface,
    border,
    target: amber,
    primaryFill: withAlpha(cyan, FILL_ALPHA),
    successFill: withAlpha(green, FILL_ALPHA),
    warnFill: withAlpha(amber, FILL_ALPHA),
    dangerFill: withAlpha(red, FILL_ALPHA),
    infoFill: withAlpha(blue, FILL_ALPHA),
  };
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(() => readTheme());

  const refresh = useCallback(() => setTheme(readTheme()), []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, [refresh]);

  return theme;
}

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChartTheme } from './useChartTheme';

describe('useChartTheme', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--color-cyan', '#00fff7');
    document.documentElement.style.setProperty('--color-magenta', '#ff00ff');
    document.documentElement.style.setProperty('--color-green', '#00ff00');
    document.documentElement.style.setProperty('--color-amber', '#ffaa00');
    document.documentElement.style.setProperty('--color-red', '#ff3333');
    document.documentElement.style.setProperty('--color-blue', '#0088ff');
    document.documentElement.style.setProperty('--color-text-primary', '#ffffff');
    document.documentElement.style.setProperty('--color-text-secondary', '#888888');
    document.documentElement.style.setProperty('--color-bg-surface', '#0a0a0a');
    document.documentElement.style.setProperty('--color-border-subtle', '#333333');
  });

  it('returns non-empty strings for every palette slot', () => {
    const { result } = renderHook(() => useChartTheme());
    const t = result.current;
    expect(t.primary).toBeTruthy();
    expect(t.success).toBeTruthy();
    expect(t.warn).toBeTruthy();
    expect(t.danger).toBeTruthy();
    expect(t.info).toBeTruthy();
    expect(t.muted).toBeTruthy();
    expect(t.grid).toBeTruthy();
    expect(t.text).toBeTruthy();
    expect(t.surface).toBeTruthy();
  });

  it('falls back to default hex when a CSS var is missing', () => {
    document.documentElement.style.removeProperty('--color-cyan');
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.primary).toBe('#00fff7');
  });

  it('derives translucent fill colors from base palette', () => {
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.primaryFill).toMatch(/^rgba\(/);
    expect(result.current.successFill).toMatch(/^rgba\(/);
  });
});

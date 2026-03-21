import { describe, expect, it } from 'vitest';
import { toLocalDateString, parseDateDow, parseDateMonth, enumerateLocalDates } from './dateUtils';

describe('toLocalDateString', () => {
  it('formats a known date correctly', () => {
    const d = new Date(2024, 0, 5); // Jan 5, 2024 local
    expect(toLocalDateString(d)).toBe('2024-01-05');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2024, 2, 3); // Mar 3
    expect(toLocalDateString(d)).toBe('2024-03-03');
  });

  it('handles December 31st', () => {
    const d = new Date(2024, 11, 31);
    expect(toLocalDateString(d)).toBe('2024-12-31');
  });

  it('returns today when called with no args', () => {
    const result = toLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    expect(result).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    );
  });
});

describe('parseDateDow', () => {
  it('returns correct day of week for a known Monday', () => {
    // 2024-01-01 is a Monday
    expect(parseDateDow('2024-01-01')).toBe(1);
  });

  it('returns Sunday as 0', () => {
    // 2024-01-07 is a Sunday
    expect(parseDateDow('2024-01-07')).toBe(0);
  });

  it('returns correct day for Saturday', () => {
    // 2024-01-06 is a Saturday
    expect(parseDateDow('2024-01-06')).toBe(6);
  });
});

describe('parseDateMonth', () => {
  it('returns 1 for January', () => {
    expect(parseDateMonth('2024-01-15')).toBe(1);
  });

  it('returns 12 for December', () => {
    expect(parseDateMonth('2024-12-25')).toBe(12);
  });
});

describe('enumerateLocalDates', () => {
  it('enumerates a single day range', () => {
    expect(enumerateLocalDates('2024-03-15', '2024-03-15')).toEqual(['2024-03-15']);
  });

  it('enumerates a multi-day range', () => {
    const result = enumerateLocalDates('2024-01-01', '2024-01-03');
    expect(result).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
  });

  it('returns empty for invalid dates', () => {
    expect(enumerateLocalDates('not-a-date', '2024-01-03')).toEqual([]);
  });

  it('returns empty when start > end', () => {
    expect(enumerateLocalDates('2024-01-05', '2024-01-03')).toEqual([]);
  });

  it('handles month boundaries correctly', () => {
    const result = enumerateLocalDates('2024-01-30', '2024-02-02');
    expect(result).toEqual(['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
  });
});

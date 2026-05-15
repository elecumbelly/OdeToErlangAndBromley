import { describe, it, expect } from 'vitest';
import { getProductivityForDateFromEvents } from './productivity';
import type { CalendarEvent } from '../database/dataAccess';

function evt(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 1,
    event_type: 'Training',
    event_name: 'Test',
    start_datetime: '2026-03-10T09:00:00',
    end_datetime: '2026-03-10T17:00:00',
    all_day: false,
    productivity_modifier: 1.0,
    applies_to_filter: null,
    campaign_id: null,
    created_at: '2026-03-01T00:00:00',
    ...partial,
  };
}

describe('getProductivityForDateFromEvents', () => {
  it('returns 1.0 when no events provided', () => {
    expect(getProductivityForDateFromEvents('2026-03-10', [])).toBe(1.0);
  });

  it('returns 1.0 when no event overlaps the date', () => {
    const events = [evt({ start_datetime: '2026-03-05T00:00:00', end_datetime: '2026-03-05T23:59:59' })];
    expect(getProductivityForDateFromEvents('2026-03-10', events)).toBe(1.0);
  });

  it('returns the modifier of a single overlapping event', () => {
    const events = [evt({ productivity_modifier: 0.5 })];
    expect(getProductivityForDateFromEvents('2026-03-10', events)).toBe(0.5);
  });

  it('takes the minimum across multiple overlapping events', () => {
    const events = [
      evt({ id: 1, productivity_modifier: 0.5 }),
      evt({ id: 2, productivity_modifier: 0.0 }),
      evt({ id: 3, productivity_modifier: 0.8 }),
    ];
    expect(getProductivityForDateFromEvents('2026-03-10', events)).toBe(0.0);
  });

  it('matches an event that spans multiple days', () => {
    const events = [
      evt({
        start_datetime: '2026-03-09T08:00:00',
        end_datetime: '2026-03-11T18:00:00',
        productivity_modifier: 0.7,
      }),
    ];
    expect(getProductivityForDateFromEvents('2026-03-10', events)).toBe(0.7);
  });

  it('ignores events outside the date even if the array is non-empty', () => {
    const events = [
      evt({ start_datetime: '2026-02-01T00:00:00', end_datetime: '2026-02-01T23:59:59', productivity_modifier: 0.1 }),
    ];
    expect(getProductivityForDateFromEvents('2026-03-10', events)).toBe(1.0);
  });
});

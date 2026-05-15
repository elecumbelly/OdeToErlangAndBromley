import type { CalendarEvent } from '../database/dataAccess';

/**
 * Compute the productivity modifier for a given local date from a list of
 * calendar events. Multiple events on the same date combine pessimistically
 * (lowest modifier wins — e.g. a Holiday at 0% overrides a Training at 50%).
 *
 * Pure function: deterministic, no I/O. Same inputs always yield same output.
 */
export function getProductivityForDateFromEvents(
  date: string,
  events: readonly CalendarEvent[]
): number {
  if (!events || events.length === 0) return 1.0;

  const targetDateStart = new Date(date + 'T00:00:00');
  const targetDateEnd = new Date(date + 'T23:59:59');

  let modifier = 1.0;
  let matched = false;

  for (const event of events) {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime);
    if (eventStart <= targetDateEnd && eventEnd >= targetDateStart) {
      matched = true;
      if (event.productivity_modifier < modifier) {
        modifier = event.productivity_modifier;
      }
    }
  }

  return matched ? modifier : 1.0;
}

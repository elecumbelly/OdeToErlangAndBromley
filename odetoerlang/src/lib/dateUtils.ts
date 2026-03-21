/** Format a Date as YYYY-MM-DD in the local timezone (avoids UTC shift from toISOString). */
export function toLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string and return local-time day-of-week (0=Sun). */
export function parseDateDow(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

/** Parse a YYYY-MM-DD string and return local-time month (1-12). */
export function parseDateMonth(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getMonth() + 1;
}

/** Enumerate calendar dates (inclusive) as YYYY-MM-DD strings in local time. */
export function enumerateLocalDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return dates;

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(toLocalDateString(current));
  }

  return dates;
}

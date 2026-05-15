/** Calendar events: training, meetings, holidays — modify productivity. Soft-deleted. */
import type { SqlValue } from 'sql.js';
import {
  buildUpdateClause,
  getDatabase,
  getLastInsertId,
  saveDatabase,
  stmtToArray,
} from './_shared';

export interface CalendarEvent {
  id: number;
  /** 'Training', 'Meeting', 'Holiday', etc. */
  event_type: string;
  event_name: string;
  /** ISO string */
  start_datetime: string;
  /** ISO string */
  end_datetime: string;
  all_day: boolean;
  /** 0.0 - 1.0 */
  productivity_modifier: number;
  /** JSON */
  applies_to_filter: string | null;
  campaign_id: number | null;
  created_at: string;
}

export function getCalendarEvents(
  start: string,
  end: string,
  campaignId: number | null = null
): CalendarEvent[] {
  const db = getDatabase();
  let sql = `
    SELECT * FROM CalendarEvents
    WHERE deleted_at IS NULL
      AND start_datetime <= ? AND end_datetime >= ?
  `;
  const params: SqlValue[] = [end, start];

  if (campaignId) {
    sql += ' AND (campaign_id = ? OR campaign_id IS NULL)';
    params.push(campaignId);
  } else {
    sql += ' AND campaign_id IS NULL';
  }

  sql += ' ORDER BY start_datetime';

  const stmt = db.prepare(sql);
  stmt.bind(params);
  return stmtToArray<CalendarEvent>(stmt);
}

export function createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO CalendarEvents (
      event_type, event_name, start_datetime, end_datetime, all_day,
      productivity_modifier, applies_to_filter, campaign_id, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.event_type,
      event.event_name,
      event.start_datetime,
      event.end_datetime,
      event.all_day ? 1 : 0,
      event.productivity_modifier,
      event.applies_to_filter,
      event.campaign_id,
      'system',
    ]
  );

  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateCalendarEvent(id: number, updates: Partial<CalendarEvent>): void {
  const clause = buildUpdateClause(updates, { boolFields: ['all_day'] });
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE CalendarEvents SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

/**
 * Soft-delete. Sets deleted_at; getCalendarEvents filters on it. EventAssignments
 * referencing the event are unaffected (no CASCADE on soft delete).
 */
export function deleteCalendarEvent(id: number): void {
  const db = getDatabase();
  db.run(
    'UPDATE CalendarEvents SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  saveDatabase();
}

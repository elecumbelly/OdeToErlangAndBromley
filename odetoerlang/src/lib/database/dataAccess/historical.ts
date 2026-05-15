/** Historical data: per-campaign, per-interval actuals (volume, AHT, SLA achieved). */
import type { SqlValue } from 'sql.js';
import {
  getDatabase,
  saveDatabase,
  stmtToArray,
  stmtToObject,
} from './_shared';

export interface HistoricalData {
  id?: number;
  import_batch_id?: number;
  campaign_id: number;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM:SS */
  interval_start?: string;
  /** HH:MM:SS */
  interval_end?: string;
  volume: number;
  aht?: number;
  abandons?: number;
  /** 0.0-1.0 */
  sla_achieved?: number;
  /** seconds */
  asa?: number;
  actual_fte?: number;
  actual_agents?: number;
  created_at?: string;
}

/** Batch insert inside a transaction; rolls back on any failure. */
export function saveHistoricalDataBatch(data: HistoricalData[]): void {
  const db = getDatabase();
  if (data.length === 0) return;

  db.exec('BEGIN TRANSACTION;');
  try {
    const stmt = db.prepare(`
      INSERT INTO HistoricalData (
        import_batch_id, campaign_id, date, interval_start, interval_end,
        volume, aht, abandons, sla_achieved, asa, actual_fte, actual_agents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.forEach((row) => {
      stmt.run([
        row.import_batch_id ?? null,
        row.campaign_id,
        row.date,
        row.interval_start ?? null,
        row.interval_end ?? null,
        row.volume,
        row.aht ?? null,
        row.abandons ?? null,
        row.sla_achieved ?? null,
        row.asa ?? null,
        row.actual_fte ?? null,
        row.actual_agents ?? null,
      ]);
    });

    stmt.free();
    db.exec('COMMIT;');
    saveDatabase();
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Failed to save historical data batch:', error);
    throw error;
  }
}

export function getHistoricalData(
  campaignId: number | null,
  startDate: string,
  endDate: string
): HistoricalData[] {
  const db = getDatabase();
  const campaignClause = campaignId !== null ? ' AND campaign_id = ?' : '';
  const params: SqlValue[] =
    campaignId !== null ? [startDate, endDate, campaignId] : [startDate, endDate];

  const stmt = db.prepare(
    `SELECT * FROM HistoricalData
     WHERE date >= ? AND date <= ?${campaignClause}
     ORDER BY date ASC, interval_start ASC`
  );
  stmt.bind(params);
  return stmtToArray<HistoricalData>(stmt);
}

export function getHistoricalDateRange(
  campaignId: number | null
): { minDate: string | null; maxDate: string | null; recordCount: number } {
  const db = getDatabase();
  const whereClause = campaignId !== null ? ' WHERE campaign_id = ?' : '';
  const params: SqlValue[] = campaignId !== null ? [campaignId] : [];

  const stmt = db.prepare(
    `SELECT MIN(date) as min_date, MAX(date) as max_date, COUNT(*) as record_count
     FROM HistoricalData${whereClause}`
  );
  stmt.bind(params);

  const row = stmtToObject<{
    min_date: string | null;
    max_date: string | null;
    record_count: number;
  }>(stmt);

  return {
    minDate: row?.min_date ?? null,
    maxDate: row?.max_date ?? null,
    recordCount: row?.record_count ?? 0,
  };
}

export function getHistoricalVolumeSummary(
  campaignId: number | null,
  startDate: string,
  endDate: string
): Array<{ date: string; totalVolume: number; avgAht: number; avgSla: number }> {
  const db = getDatabase();
  const campaignClause = campaignId !== null ? ' AND campaign_id = ?' : '';
  const params: SqlValue[] =
    campaignId !== null ? [startDate, endDate, campaignId] : [startDate, endDate];

  const stmt = db.prepare(
    `SELECT
       date,
       SUM(volume) as total_volume,
       AVG(aht) as avg_aht,
       AVG(sla_achieved) as avg_sla
     FROM HistoricalData
     WHERE date >= ? AND date <= ?${campaignClause}
     GROUP BY date ORDER BY date ASC`
  );
  stmt.bind(params);

  const rows = stmtToArray<{
    date: string;
    total_volume: number;
    avg_aht: number | null;
    avg_sla: number | null;
  }>(stmt);

  return rows.map((row) => ({
    date: row.date,
    totalVolume: row.total_volume,
    avgAht: row.avg_aht ?? 0,
    avgSla: row.avg_sla ?? 0,
  }));
}

export function deleteHistoricalDataBatch(importBatchId: number): number {
  const db = getDatabase();
  db.run('DELETE FROM HistoricalData WHERE import_batch_id = ?', [importBatchId]);
  saveDatabase();

  // SQLite doesn't return the row count from db.run; existing callers don't
  // use this return value. Kept the signature for API stability.
  return 0;
}

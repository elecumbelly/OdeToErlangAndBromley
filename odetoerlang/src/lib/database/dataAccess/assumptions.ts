/** Assumptions: tunable inputs (shrinkage, occupancy targets, etc.) — global or per-campaign. */
import {
  execToArray,
  getDatabase,
  getLastInsertId,
  saveDatabase,
  stmtToArray,
  stmtToObject,
} from './_shared';
import { toLocalDateString } from '../../dateUtils';

export interface Assumption {
  id: number;
  assumption_type: string;
  value: number;
  unit: string | null;
  valid_from: string;
  valid_to: string | null;
  campaign_id: number | null;
  created_at: string;
  created_by: string | null;
}

export function getAssumptions(campaignId: number | null = null): Assumption[] {
  const db = getDatabase();

  if (campaignId) {
    const stmt = db.prepare(
      'SELECT * FROM Assumptions WHERE campaign_id = ? OR campaign_id IS NULL ORDER BY assumption_type'
    );
    stmt.bind([campaignId]);
    return stmtToArray<Assumption>(stmt);
  }

  return execToArray<Assumption>(
    db.exec('SELECT * FROM Assumptions WHERE campaign_id IS NULL ORDER BY assumption_type')
  );
}

export function getAllAssumptions(): Assumption[] {
  const db = getDatabase();
  return execToArray<Assumption>(db.exec('SELECT * FROM Assumptions ORDER BY campaign_id, assumption_type'));
}

export function getCurrentAssumptions(
  campaignId: number | null = null,
  asOfDate: string = toLocalDateString()
): Assumption[] {
  const db = getDatabase();
  const sql = `
    SELECT * FROM Assumptions
    WHERE (campaign_id = ? OR campaign_id IS NULL)
      AND valid_from <= ?
      AND (valid_to IS NULL OR valid_to >= ?)
    ORDER BY campaign_id DESC, assumption_type
  `;

  const stmt = db.prepare(sql);
  stmt.bind([campaignId, asOfDate, asOfDate]);
  return stmtToArray<Assumption>(stmt);
}

export function upsertAssumption(
  type: string,
  value: number,
  unit: string,
  validFrom: string,
  campaignId: number | null = null,
  validTo: string | null = null
): number {
  const db = getDatabase();

  const stmt = db.prepare(
    `SELECT id FROM Assumptions
     WHERE assumption_type = ?
       AND (campaign_id = ? OR (campaign_id IS NULL AND ?))
       AND valid_from = ?`
  );
  stmt.bind([type, campaignId, campaignId === null ? 1 : 0, validFrom]);
  const existingRow = stmtToObject<{ id: number }>(stmt);

  if (existingRow) {
    const id = existingRow.id;
    db.run(
      `UPDATE Assumptions SET value = ?, unit = ?, valid_to = ? WHERE id = ?`,
      [value, unit, validTo, id]
    );
    saveDatabase();
    return id;
  }

  db.run(
    `INSERT INTO Assumptions (assumption_type, value, unit, valid_from, valid_to, campaign_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [type, value, unit, validFrom, validTo, campaignId, 'system']
  );

  const id = getLastInsertId();
  saveDatabase();
  return id;
}

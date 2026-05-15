/** Scenarios: named forecast variants (baseline + alternatives). Soft-deleted. */
import {
  buildUpdateClause,
  execToArray,
  getDatabase,
  getLastInsertId,
  saveDatabase,
  stmtToObject,
} from './_shared';

export interface Scenario {
  id: number;
  scenario_name: string;
  description: string | null;
  is_baseline: boolean;
  erlang_model: 'B' | 'C' | 'A';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function getScenarios(includeDeleted: boolean = false): Scenario[] {
  const db = getDatabase();
  const where = includeDeleted ? '' : ' WHERE deleted_at IS NULL';
  return execToArray<Scenario>(db.exec(`SELECT * FROM Scenarios${where} ORDER BY created_at DESC`));
}

export function getScenarioById(id: number, includeDeleted: boolean = false): Scenario | null {
  const db = getDatabase();
  const query = includeDeleted
    ? 'SELECT * FROM Scenarios WHERE id = ?'
    : 'SELECT * FROM Scenarios WHERE id = ? AND deleted_at IS NULL';
  const stmt = db.prepare(query);
  stmt.bind([id]);
  return stmtToObject<Scenario>(stmt);
}

export function getBaselineScenario(): Scenario | null {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM Scenarios WHERE is_baseline = 1 AND deleted_at IS NULL LIMIT 1'
  );
  return stmtToObject<Scenario>(stmt);
}

export function createScenario(
  name: string,
  description?: string,
  isBaseline: boolean = false,
  erlangModel: 'B' | 'C' | 'A' = 'C'
): number {
  const db = getDatabase();

  if (isBaseline) {
    db.run('UPDATE Scenarios SET is_baseline = 0 WHERE is_baseline = 1');
  }

  db.run(
    `INSERT INTO Scenarios (scenario_name, description, is_baseline, erlang_model, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [name, description ?? null, isBaseline ? 1 : 0, erlangModel, 'system']
  );

  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateScenario(id: number, updates: Partial<Scenario>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(
    `UPDATE Scenarios SET ${clause.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...clause.values, id]
  );
  saveDatabase();
}

/**
 * Soft-delete. Forecasts referencing this scenario remain via their FK
 * (no CASCADE on soft delete).
 */
export function deleteScenario(id: number): void {
  const db = getDatabase();
  db.run('UPDATE Scenarios SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id]);
  saveDatabase();
}

export function setBaselineScenario(id: number): void {
  const db = getDatabase();
  db.run('UPDATE Scenarios SET is_baseline = 0 WHERE is_baseline = 1');
  db.run('UPDATE Scenarios SET is_baseline = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  saveDatabase();
}

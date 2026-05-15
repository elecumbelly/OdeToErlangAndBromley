/** Recruitment: pipeline stages + hiring requests (paginated). */
import type { SqlValue } from 'sql.js';
import {
  buildUpdateClause,
  execToArray,
  getDatabase,
  getLastInsertId,
  getScalar,
  saveDatabase,
  stmtToArray,
} from './_shared';
import type { PaginatedResult } from './_shared';

export interface RecruitmentStage {
  id: number;
  stage_name: string;
  stage_order: number;
  /** 0.0-1.0 */
  pass_rate: number;
  avg_duration_days: number | null;
  created_at: string;
}

export interface RecruitmentRequest {
  id: number;
  role_id: number;
  campaign_id: number | null;
  quantity_requested: number;
  requested_date: string;
  target_start_date: string | null;
  status: 'Open' | 'InProgress' | 'Filled' | 'Cancelled';
  notes: string | null;
  created_at: string;
}

// --- STAGES ---

export function getRecruitmentStages(): RecruitmentStage[] {
  const db = getDatabase();
  return execToArray<RecruitmentStage>(
    db.exec('SELECT * FROM RecruitmentPipeline ORDER BY stage_order')
  );
}

export function createRecruitmentStage(stage: Omit<RecruitmentStage, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO RecruitmentPipeline (stage_name, stage_order, pass_rate, avg_duration_days)
     VALUES (?, ?, ?, ?)`,
    [stage.stage_name, stage.stage_order, stage.pass_rate, stage.avg_duration_days]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateRecruitmentStage(id: number, updates: Partial<RecruitmentStage>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE RecruitmentPipeline SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

export function deleteRecruitmentStage(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM RecruitmentPipeline WHERE id = ?', [id]);
  saveDatabase();
}

// --- REQUESTS ---

export function getRecruitmentRequests(
  status?: 'Open' | 'InProgress' | 'Filled' | 'Cancelled',
  limit: number = 50,
  offset: number = 0
): PaginatedResult<RecruitmentRequest> {
  const db = getDatabase();
  const whereClause = status ? ' WHERE status = ?' : '';
  const whereParams: SqlValue[] = status ? [status] : [];

  const total = getScalar<number>(
    `SELECT COUNT(*) FROM RecruitmentRequests${whereClause}`,
    whereParams,
    0
  );

  const stmt = db.prepare(
    `SELECT * FROM RecruitmentRequests${whereClause} ORDER BY requested_date DESC LIMIT ? OFFSET ?`
  );
  stmt.bind([...whereParams, limit, offset]);
  const data = stmtToArray<RecruitmentRequest>(stmt);

  return { data, total };
}

export function createRecruitmentRequest(
  request: Omit<RecruitmentRequest, 'id' | 'created_at'>
): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO RecruitmentRequests (
      role_id, campaign_id, quantity_requested, requested_date, target_start_date, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      request.role_id,
      request.campaign_id,
      request.quantity_requested,
      request.requested_date,
      request.target_start_date,
      request.status,
      request.notes,
    ]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateRecruitmentRequest(id: number, updates: Partial<RecruitmentRequest>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE RecruitmentRequests SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

export function deleteRecruitmentRequest(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM RecruitmentRequests WHERE id = ?', [id]);
  saveDatabase();
}

/** Scheduling: plans, coverage requirements, runs, shifts, metrics, violations. */
import {
  buildUpdateClause,
  execToArray,
  getDatabase,
  getLastInsertId,
  saveDatabase,
  stmtToArray,
  stmtToObject,
} from './_shared';

export interface SchedulePlan {
  id: number;
  plan_name: string;
  campaign_id: number;
  scenario_id: number | null;
  start_date: string;
  end_date: string;
  interval_minutes: number;
  max_weekly_hours: number;
  min_rest_hours: number;
  allow_skill_switch: boolean;
  break_window_start_min: number;
  break_window_end_min: number;
  lunch_window_start_min: number;
  lunch_window_end_min: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CoverageRequirement {
  id: number;
  schedule_plan_id: number;
  requirement_date: string;
  interval_start: string;
  interval_end: string;
  skill_id: number;
  required_agents: number;
  source_forecast_id: number | null;
  created_at: string;
}

export interface ShiftTemplate {
  id: number;
  template_name: string;
  paid_minutes: number;
  unpaid_minutes: number;
  break_count: number;
  break_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface OptimizationMethod {
  id: number;
  method_key: string;
  method_name: string;
  version: string | null;
  description: string | null;
  created_at: string;
}

export interface ScheduleRun {
  id: number;
  schedule_plan_id: number;
  method_id: number;
  run_group_id: string | null;
  label: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Shift {
  id: number;
  schedule_run_id: number;
  staff_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  template_id: number | null;
  created_at: string;
}

export interface ShiftSegment {
  id: number;
  shift_id: number;
  segment_start: string;
  segment_end: string;
  segment_type: string;
  skill_id: number | null;
  is_paid: boolean;
  created_at: string;
}

export interface ScheduleMetric {
  schedule_run_id: number;
  coverage_percent: number;
  gap_minutes: number;
  overstaff_minutes: number;
  overtime_minutes: number;
  violations_count: number;
  cost_estimate: number;
  created_at: string;
}

export interface ScheduleViolation {
  id: number;
  schedule_run_id: number;
  staff_id: number | null;
  violation_date: string;
  violation_type: string;
  details: string | null;
  created_at: string;
}

// --- PLANS ---

export function getSchedulePlanById(id: number): SchedulePlan | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM SchedulePlans WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<SchedulePlan>(stmt);
}

export function getSchedulePlans(campaignId: number | null = null): SchedulePlan[] {
  const db = getDatabase();
  if (campaignId) {
    const stmt = db.prepare(
      `SELECT * FROM SchedulePlans
       WHERE campaign_id = ? AND status != 'Archived'
       ORDER BY start_date DESC`
    );
    stmt.bind([campaignId]);
    return stmtToArray<SchedulePlan>(stmt);
  }
  return execToArray<SchedulePlan>(
    db.exec(`SELECT * FROM SchedulePlans WHERE status != 'Archived' ORDER BY start_date DESC`)
  );
}

export function createSchedulePlan(
  plan: Omit<SchedulePlan, 'id' | 'created_at' | 'updated_at'>
): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO SchedulePlans (
      plan_name, campaign_id, scenario_id, start_date, end_date, interval_minutes,
      max_weekly_hours, min_rest_hours, allow_skill_switch,
      break_window_start_min, break_window_end_min,
      lunch_window_start_min, lunch_window_end_min,
      status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      plan.plan_name,
      plan.campaign_id,
      plan.scenario_id,
      plan.start_date,
      plan.end_date,
      plan.interval_minutes,
      plan.max_weekly_hours,
      plan.min_rest_hours,
      plan.allow_skill_switch ? 1 : 0,
      plan.break_window_start_min,
      plan.break_window_end_min,
      plan.lunch_window_start_min,
      plan.lunch_window_end_min,
      plan.status,
      plan.created_by ?? 'system',
    ]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateSchedulePlan(id: number, updates: Partial<SchedulePlan>): void {
  const clause = buildUpdateClause(updates, { boolFields: ['allow_skill_switch'] });
  if (!clause) return;

  const db = getDatabase();
  db.run(
    `UPDATE SchedulePlans SET ${clause.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...clause.values, id]
  );
  saveDatabase();
}

/**
 * Soft-delete by setting status to 'Archived'. Hard deletes were destroying
 * linked CoverageRequirements / Shifts via CASCADE.
 */
export function deleteSchedulePlan(id: number): void {
  const db = getDatabase();
  db.run(
    `UPDATE SchedulePlans SET status = 'Archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
  saveDatabase();
}

// --- COVERAGE ---

export function getCoverageRequirements(schedulePlanId: number): CoverageRequirement[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM CoverageRequirements WHERE schedule_plan_id = ? ORDER BY requirement_date, interval_start'
  );
  stmt.bind([schedulePlanId]);
  return stmtToArray<CoverageRequirement>(stmt);
}

export function replaceCoverageRequirements(
  schedulePlanId: number,
  requirements: Array<Omit<CoverageRequirement, 'id' | 'created_at'>>
): void {
  const db = getDatabase();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.run('DELETE FROM CoverageRequirements WHERE schedule_plan_id = ?', [schedulePlanId]);

    if (requirements.length > 0) {
      const stmt = db.prepare(
        `INSERT INTO CoverageRequirements (
          schedule_plan_id, requirement_date, interval_start, interval_end,
          skill_id, required_agents, source_forecast_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      requirements.forEach((row) => {
        stmt.run([
          row.schedule_plan_id,
          row.requirement_date,
          row.interval_start,
          row.interval_end,
          row.skill_id,
          row.required_agents,
          row.source_forecast_id,
        ]);
      });
      stmt.free();
    }

    db.exec('COMMIT;');
    saveDatabase();
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Failed to replace coverage requirements:', error);
    throw error;
  }
}

// --- RUNS ---

export function getScheduleRuns(schedulePlanId: number): ScheduleRun[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM ScheduleRuns WHERE schedule_plan_id = ? ORDER BY created_at DESC, id DESC'
  );
  stmt.bind([schedulePlanId]);
  return stmtToArray<ScheduleRun>(stmt);
}

export function getScheduleRunById(id: number): ScheduleRun | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM ScheduleRuns WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<ScheduleRun>(stmt);
}

export function createScheduleRun(run: Omit<ScheduleRun, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO ScheduleRuns (
      schedule_plan_id, method_id, run_group_id, label, status,
      started_at, completed_at, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      run.schedule_plan_id,
      run.method_id,
      run.run_group_id,
      run.label,
      run.status,
      run.started_at,
      run.completed_at,
      run.notes,
      run.created_by ?? 'system',
    ]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateScheduleRunStatus(
  id: number,
  status: string,
  startedAt?: string | null,
  completedAt?: string | null
): void {
  const db = getDatabase();
  db.run(
    `UPDATE ScheduleRuns
     SET status = ?, started_at = COALESCE(?, started_at), completed_at = COALESCE(?, completed_at)
     WHERE id = ?`,
    [status, startedAt ?? null, completedAt ?? null, id]
  );
  saveDatabase();
}

export function clearScheduleRunData(scheduleRunId: number): void {
  const db = getDatabase();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.run(
      'DELETE FROM ShiftSegments WHERE shift_id IN (SELECT id FROM Shifts WHERE schedule_run_id = ?)',
      [scheduleRunId]
    );
    db.run('DELETE FROM Shifts WHERE schedule_run_id = ?', [scheduleRunId]);
    db.run('DELETE FROM ScheduleMetrics WHERE schedule_run_id = ?', [scheduleRunId]);
    db.run('DELETE FROM ScheduleViolations WHERE schedule_run_id = ?', [scheduleRunId]);
    db.exec('COMMIT;');
    saveDatabase();
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Failed to clear schedule run data:', error);
    throw error;
  }
}

// --- LOOKUP TABLES ---

export function getShiftTemplates(): ShiftTemplate[] {
  const db = getDatabase();
  return execToArray<ShiftTemplate>(
    db.exec('SELECT * FROM ShiftTemplates ORDER BY created_at DESC')
  );
}

export function getOptimizationMethods(): OptimizationMethod[] {
  const db = getDatabase();
  return execToArray<OptimizationMethod>(
    db.exec('SELECT * FROM OptimizationMethods ORDER BY created_at DESC')
  );
}

// --- SHIFTS & SEGMENTS ---

export function createShift(shift: Omit<Shift, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Shifts (schedule_run_id, staff_id, shift_date, start_time, end_time, template_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      shift.schedule_run_id,
      shift.staff_id,
      shift.shift_date,
      shift.start_time,
      shift.end_time,
      shift.template_id,
    ]
  );
  return getLastInsertId();
}

export function createShiftSegments(segments: Array<Omit<ShiftSegment, 'id' | 'created_at'>>): void {
  const db = getDatabase();
  if (segments.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO ShiftSegments (shift_id, segment_start, segment_end, segment_type, skill_id, is_paid)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  segments.forEach((segment) => {
    stmt.run([
      segment.shift_id,
      segment.segment_start,
      segment.segment_end,
      segment.segment_type,
      segment.skill_id,
      segment.is_paid ? 1 : 0,
    ]);
  });
  stmt.free();
}

// --- METRICS & VIOLATIONS ---

export function saveScheduleMetrics(metrics: ScheduleMetric): void {
  const db = getDatabase();
  db.run(
    `INSERT OR REPLACE INTO ScheduleMetrics (
      schedule_run_id, coverage_percent, gap_minutes, overstaff_minutes,
      overtime_minutes, violations_count, cost_estimate
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      metrics.schedule_run_id,
      metrics.coverage_percent,
      metrics.gap_minutes,
      metrics.overstaff_minutes,
      metrics.overtime_minutes,
      metrics.violations_count,
      metrics.cost_estimate,
    ]
  );
  saveDatabase();
}

export function saveScheduleViolations(
  violations: Array<Omit<ScheduleViolation, 'id' | 'created_at'>>
): void {
  const db = getDatabase();
  if (violations.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO ScheduleViolations (schedule_run_id, staff_id, violation_date, violation_type, details)
     VALUES (?, ?, ?, ?, ?)`
  );
  violations.forEach((violation) => {
    stmt.run([
      violation.schedule_run_id,
      violation.staff_id,
      violation.violation_date,
      violation.violation_type,
      violation.details,
    ]);
  });
  stmt.free();
  saveDatabase();
}

export function getScheduleMetricsByRunIds(runIds: number[]): ScheduleMetric[] {
  if (runIds.length === 0) return [];
  const db = getDatabase();
  const placeholders = runIds.map(() => '?').join(', ');
  const stmt = db.prepare(
    `SELECT * FROM ScheduleMetrics WHERE schedule_run_id IN (${placeholders})`
  );
  stmt.bind(runIds);
  return stmtToArray<ScheduleMetric>(stmt);
}

export function getStaffSkills(): Array<{
  staff_id: number;
  skill_id: number;
  proficiency_level: number | null;
}> {
  const db = getDatabase();
  return execToArray<{
    staff_id: number;
    skill_id: number;
    proficiency_level: number | null;
  }>(db.exec('SELECT staff_id, skill_id, proficiency_level FROM StaffSkills'));
}

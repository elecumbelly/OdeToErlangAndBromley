/**
 * Database Query Helpers
 *
 * Provides type-safe query functions for common database operations.
 * These helpers abstract SQL queries and provide a clean API for UI components.
 */

import type { SqlValue } from 'sql.js';
import { getDatabase, saveDatabase } from './initDatabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Campaign {
  id: number;
  campaign_name: string;
  client_id: number;
  channel_type: string;
  start_date: string;
  end_date: string | null;
  sla_target_percent: number;
  sla_threshold_seconds: number;
  concurrency_allowed: number;
  active: boolean;
  created_at: string;
}

export interface Scenario {
  id: number;
  scenario_name: string;
  description: string | null;
  is_baseline: boolean;
  erlang_model: 'B' | 'C' | 'A';  // Which Erlang model to use for this scenario
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

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

export interface Client {
  id: number;
  client_name: string;
  industry: string | null;
  active: boolean;
  created_at: string;
}

export interface Forecast {
  id: number;
  forecast_name: string;
  scenario_id: number;
  model_type: string;
  campaign_id: number;
  forecast_date: string;
  forecasted_volume: number;
  forecasted_aht: number | null;
  required_agents: number | null;
  required_fte: number | null;
  expected_sla: number | null;
  expected_occupancy: number | null;
  expected_asa: number | null;
  created_at: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert exec result to typed array
 */
function execToArray<T>(results: ReturnType<ReturnType<typeof getDatabase>['exec']>): T[] {
  if (!results.length) return [];

  const columns = results[0].columns;
  return results[0].values.map((row) => {
    const obj: Record<string, SqlValue> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as T;
  });
}

/**
 * Convert statement result to typed object
 */
function stmtToObject<T>(
  stmt: ReturnType<ReturnType<typeof getDatabase>['prepare']>
): T | null {
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row as unknown as T;
  }
  stmt.free();
  return null;
}

/**
 * Collect all rows from statement
 */
function stmtToArray<T>(
  stmt: ReturnType<ReturnType<typeof getDatabase>['prepare']>
): T[] {
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

/**
 * Get all active campaigns
 */
export function getCampaigns(activeOnly: boolean = true): Campaign[] {
  const db = getDatabase();
  const sql = activeOnly
    ? 'SELECT * FROM Campaigns WHERE active = 1 ORDER BY campaign_name'
    : 'SELECT * FROM Campaigns ORDER BY campaign_name';
  return execToArray<Campaign>(db.exec(sql));
}

/**
 * Get a single campaign by ID
 */
export function getCampaignById(id: number): Campaign | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Campaigns WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Campaign>(stmt);
}

/**
 * Create a new campaign
 */
export function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Campaigns (campaign_name, client_id, channel_type, start_date, end_date,
     sla_target_percent, sla_threshold_seconds, concurrency_allowed, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      campaign.campaign_name,
      campaign.client_id,
      campaign.channel_type,
      campaign.start_date,
      campaign.end_date,
      campaign.sla_target_percent,
      campaign.sla_threshold_seconds,
      campaign.concurrency_allowed,
      campaign.active ? 1 : 0,
    ]
  );

  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

/**
 * Update an existing campaign
 */
export function updateCampaign(id: number, updates: Partial<Campaign>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  db.run(`UPDATE Campaigns SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

// ============================================================================
// SCENARIOS
// ============================================================================

/**
 * Get all scenarios
 */
export function getScenarios(): Scenario[] {
  const db = getDatabase();
  return execToArray<Scenario>(db.exec('SELECT * FROM Scenarios ORDER BY created_at DESC'));
}

/**
 * Get a single scenario by ID
 */
export function getScenarioById(id: number): Scenario | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Scenarios WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Scenario>(stmt);
}

/**
 * Get the baseline scenario (or null if none set)
 */
export function getBaselineScenario(): Scenario | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Scenarios WHERE is_baseline = 1 LIMIT 1');
  return stmtToObject<Scenario>(stmt);
}

/**
 * Create a new scenario
 */
export function createScenario(
  name: string,
  description?: string,
  isBaseline: boolean = false,
  erlangModel: 'B' | 'C' | 'A' = 'C'
): number {
  const db = getDatabase();

  // If this is baseline, clear any existing baseline
  if (isBaseline) {
    db.run('UPDATE Scenarios SET is_baseline = 0 WHERE is_baseline = 1');
  }

  db.run(
    `INSERT INTO Scenarios (scenario_name, description, is_baseline, erlang_model, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [name, description ?? null, isBaseline ? 1 : 0, erlangModel, 'system']
  );

  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

/**
 * Update a scenario
 */
export function updateScenario(id: number, updates: Partial<Scenario>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  db.run(`UPDATE Scenarios SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

/**
 * Delete a scenario and its forecasts
 */
export function deleteScenario(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Scenarios WHERE id = ?', [id]);
  saveDatabase();
}

/**
 * Set a scenario as baseline (clears existing baseline)
 */
export function setBaselineScenario(id: number): void {
  const db = getDatabase();
  db.run('UPDATE Scenarios SET is_baseline = 0 WHERE is_baseline = 1');
  db.run('UPDATE Scenarios SET is_baseline = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  saveDatabase();
}

// ============================================================================
// ASSUMPTIONS
// ============================================================================

/**
 * Get assumptions for a campaign (or global if campaignId is null)
 */
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

/**
 * Get ALL assumptions (Global + Campaign specific)
 */
export function getAllAssumptions(): Assumption[] {
  const db = getDatabase();
  return execToArray<Assumption>(db.exec('SELECT * FROM Assumptions ORDER BY campaign_id, assumption_type'));
}

/**
 * Get current valid assumptions (filters by date)
 */
export function getCurrentAssumptions(
  campaignId: number | null = null,
  asOfDate: string = new Date().toISOString().split('T')[0]
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

/**
 * Create or update an assumption
 */
export function upsertAssumption(
  type: string,
  value: number,
  unit: string,
  validFrom: string,
  campaignId: number | null = null,
  validTo: string | null = null
): number {
  const db = getDatabase();

  // Check if exists - using parameterized query to prevent SQL injection
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

  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

// --- CLIENTS ---

/**
 * Get all clients
 */
export function getClients(activeOnly: boolean = true, limit: number = 50, offset: number = 0): PaginatedResult<Client> {
  const db = getDatabase();

  const countSql = activeOnly
    ? 'SELECT COUNT(*) as count FROM Clients WHERE active = 1'
    : 'SELECT COUNT(*) as count FROM Clients';
  const countResult = db.exec(countSql);
  const total = countResult[0]?.values[0]?.[0] as number ?? 0;

  const sql = activeOnly
    ? `SELECT * FROM Clients WHERE active = 1 ORDER BY client_name LIMIT ${limit} OFFSET ${offset}`
    : `SELECT * FROM Clients ORDER BY client_name LIMIT ${limit} OFFSET ${offset}`;

  const result = db.exec(sql);
  const data = execToArray<Client>(result);

  return { data, total };
}

/**
 * Create a new client
 */
export function createClient(name: string, industry?: string): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Clients (client_name, industry, active) VALUES (?, ?, 1)`,
    [name, industry ?? null]
  );

  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

// ============================================================================
// FORECASTS
// ============================================================================

/**
 * Get forecasts for a scenario
 */
export function getForecasts(scenarioId: number, campaignId?: number): Forecast[] {
  const db = getDatabase();
  let sql = 'SELECT * FROM Forecasts WHERE scenario_id = ?';
  const params: SqlValue[] = [scenarioId];

  if (campaignId !== undefined) {
    sql += ' AND campaign_id = ?';
    params.push(campaignId);
  }

  sql += ' ORDER BY forecast_date';

  const stmt = db.prepare(sql);
  stmt.bind(params);
  return stmtToArray<Forecast>(stmt);
}

/**
 * Get forecasts for a scenario and campaign within a date range
 */
export function getForecastsByScenarioAndDateRange(
  scenarioId: number,
  campaignId: number,
  startDate: string,
  endDate: string
): Forecast[] {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT * FROM Forecasts
     WHERE scenario_id = ? AND campaign_id = ? AND forecast_date >= ? AND forecast_date <= ?
     ORDER BY forecast_date`
  );
  stmt.bind([scenarioId, campaignId, startDate, endDate]);
  return stmtToArray<Forecast>(stmt);
}

/**
 * Save a forecast result
 */
export function saveForecast(forecast: Omit<Forecast, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date,
     forecasted_volume, forecasted_aht, required_agents, required_fte, expected_sla,
     expected_occupancy, expected_asa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      forecast.forecast_name,
      forecast.scenario_id,
      forecast.model_type,
      forecast.campaign_id,
      forecast.forecast_date,
      forecast.forecasted_volume,
      forecast.forecasted_aht,
      forecast.required_agents,
      forecast.required_fte,
      forecast.expected_sla,
      forecast.expected_occupancy,
      forecast.expected_asa,
    ]
  );

  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

// ============================================================================
// HISTORICAL DATA
// ============================================================================

export interface HistoricalData {
  id?: number; // Optional, as it's AUTOINCREMENT
  import_batch_id?: number; // Optional, can be null
  campaign_id: number;
  date: string; // YYYY-MM-DD
  interval_start?: string; // HH:MM:SS (optional)
  interval_end?: string; // HH:MM:SS (optional)
  volume: number;
  aht?: number;
  abandons?: number;
  sla_achieved?: number; // 0.0-1.0
  asa?: number; // seconds
  actual_fte?: number;
  actual_agents?: number;
  created_at?: string; // Optional, defaults to CURRENT_TIMESTAMP
}

/**
 * Saves a batch of historical data records into the HistoricalData table.
 * @param data An array of HistoricalData objects to insert.
 */
export function saveHistoricalDataBatch(data: HistoricalData[]): void {
  const db = getDatabase();

  if (data.length === 0) {
    return;
  }

  // Use a transaction for performance with batch inserts
  db.exec('BEGIN TRANSACTION;');
  try {
    const stmt = db.prepare(`
      INSERT INTO HistoricalData (
        import_batch_id, campaign_id, date, interval_start, interval_end,
        volume, aht, abandons, sla_achieved, asa, actual_fte, actual_agents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.forEach(row => {
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

/**
 * Get historical data for a campaign within a date range
 */
export function getHistoricalData(
  campaignId: number | null,
  startDate: string,
  endDate: string
): HistoricalData[] {
  const db = getDatabase();
  let sql = `
    SELECT * FROM HistoricalData
    WHERE date >= ? AND date <= ?
  `;
  const params: SqlValue[] = [startDate, endDate];

  if (campaignId !== null) {
    sql += ' AND campaign_id = ?';
    params.push(campaignId);
  }

  sql += ' ORDER BY date ASC, interval_start ASC';

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: HistoricalData[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id as number,
      import_batch_id: row.import_batch_id as number | undefined,
      campaign_id: row.campaign_id as number,
      date: row.date as string,
      interval_start: row.interval_start as string | undefined,
      interval_end: row.interval_end as string | undefined,
      volume: row.volume as number,
      aht: row.aht as number | undefined,
      abandons: row.abandons as number | undefined,
      sla_achieved: row.sla_achieved as number | undefined,
      asa: row.asa as number | undefined,
      actual_fte: row.actual_fte as number | undefined,
      actual_agents: row.actual_agents as number | undefined,
      created_at: row.created_at as string | undefined,
    });
  }
  stmt.free();

  return results;
}

/**
 * Get distinct dates with historical data for a campaign
 */
export function getHistoricalDateRange(
  campaignId: number | null
): { minDate: string | null; maxDate: string | null; recordCount: number } {
  const db = getDatabase();
  let sql = `
    SELECT MIN(date) as min_date, MAX(date) as max_date, COUNT(*) as record_count
    FROM HistoricalData
  `;
  const params: SqlValue[] = [];

  if (campaignId !== null) {
    sql += ' WHERE campaign_id = ?';
    params.push(campaignId);
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);

  let result = { minDate: null as string | null, maxDate: null as string | null, recordCount: 0 };
  if (stmt.step()) {
    const row = stmt.getAsObject();
    result = {
      minDate: row.min_date as string | null,
      maxDate: row.max_date as string | null,
      recordCount: row.record_count as number
    };
  }
  stmt.free();

  return result;
}

/**
 * Get daily volume summary for historical data
 */
export function getHistoricalVolumeSummary(
  campaignId: number | null,
  startDate: string,
  endDate: string
): Array<{ date: string; totalVolume: number; avgAht: number; avgSla: number }> {
  const db = getDatabase();
  let sql = `
    SELECT
      date,
      SUM(volume) as total_volume,
      AVG(aht) as avg_aht,
      AVG(sla_achieved) as avg_sla
    FROM HistoricalData
    WHERE date >= ? AND date <= ?
  `;
  const params: SqlValue[] = [startDate, endDate];

  if (campaignId !== null) {
    sql += ' AND campaign_id = ?';
    params.push(campaignId);
  }

  sql += ' GROUP BY date ORDER BY date ASC';

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: Array<{ date: string; totalVolume: number; avgAht: number; avgSla: number }> = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      date: row.date as string,
      totalVolume: row.total_volume as number,
      avgAht: row.avg_aht as number || 0,
      avgSla: row.avg_sla as number || 0
    });
  }
  stmt.free();

  return results;
}

/**
 * Delete historical data by import batch
 */
export function deleteHistoricalDataBatch(importBatchId: number): number {
  const db = getDatabase();
  db.run('DELETE FROM HistoricalData WHERE import_batch_id = ?', [importBatchId]);
  saveDatabase();

  // Return count of deleted rows (SQLite doesn't directly return this, so we estimate)
  return 0; // Simplified - real implementation would track count
}

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

export interface CalendarEvent {
  id: number;
  event_type: string; // 'Training', 'Meeting', 'Holiday', etc.
  event_name: string;
  start_datetime: string; // ISO string
  end_datetime: string;   // ISO string
  all_day: boolean;
  productivity_modifier: number; // 0.0 - 1.0
  applies_to_filter: string | null; // JSON
  campaign_id: number | null;
  created_at: string;
}

/**
 * Get calendar events within a date range
 */
export function getCalendarEvents(
  start: string,
  end: string,
  campaignId: number | null = null
): CalendarEvent[] {
  const db = getDatabase();
  let sql = `
    SELECT * FROM CalendarEvents
    WHERE start_datetime <= ? AND end_datetime >= ?
  `;
  const params: SqlValue[] = [end, start];

  if (campaignId) {
    sql += ' AND (campaign_id = ? OR campaign_id IS NULL)';
    params.push(campaignId);
  } else {
    // If no campaign selected, show global events (or all? usually global)
    // For admin view, maybe all? Let's show global + all for now to be safe, or just global.
    // Let's assume global only if no campaign, or modify logic if needed.
    // For now: global only if no campaignId provided.
    sql += ' AND campaign_id IS NULL';
  }

  sql += ' ORDER BY start_datetime';

  const stmt = db.prepare(sql);
  stmt.bind(params);
  return stmtToArray<CalendarEvent>(stmt);
}

/**
 * Create a new calendar event
 */
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
      'system'
    ]
  );

  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

/**
 * Update a calendar event
 */
export function updateCalendarEvent(id: number, updates: Partial<CalendarEvent>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      // Handle boolean conversion for all_day
      if (key === 'all_day') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value as SqlValue);
      }
    }
  });

  if (fields.length === 0) return;

  values.push(id);
  db.run(`UPDATE CalendarEvents SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

/**
 * Delete a calendar event
 */
export function deleteCalendarEvent(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM CalendarEvents WHERE id = ?', [id]);
  saveDatabase();
}

// ============================================================================
// SCHEDULING & OPTIMIZATION
// ============================================================================

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
      'SELECT * FROM SchedulePlans WHERE campaign_id = ? ORDER BY start_date DESC'
    );
    stmt.bind([campaignId]);
    return stmtToArray<SchedulePlan>(stmt);
  }
  return execToArray<SchedulePlan>(db.exec('SELECT * FROM SchedulePlans ORDER BY start_date DESC'));
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
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateSchedulePlan(id: number, updates: Partial<SchedulePlan>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      if (key === 'allow_skill_switch') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value as SqlValue);
      }
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  db.run(`UPDATE SchedulePlans SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteSchedulePlan(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM SchedulePlans WHERE id = ?', [id]);
  saveDatabase();
}

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

export function createScheduleRun(
  run: Omit<ScheduleRun, 'id' | 'created_at'>
): number {
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
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
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

export function getShiftTemplates(): ShiftTemplate[] {
  const db = getDatabase();
  return execToArray<ShiftTemplate>(db.exec('SELECT * FROM ShiftTemplates ORDER BY created_at DESC'));
}

export function getOptimizationMethods(): OptimizationMethod[] {
  const db = getDatabase();
  return execToArray<OptimizationMethod>(db.exec('SELECT * FROM OptimizationMethods ORDER BY created_at DESC'));
}

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
  const result = db.exec('SELECT last_insert_rowid()');
  return result[0].values[0][0] as number;
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

export function saveScheduleViolations(violations: Array<Omit<ScheduleViolation, 'id' | 'created_at'>>): void {
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

export function getStaffSkills(): Array<{ staff_id: number; skill_id: number; proficiency_level: number | null }> {
  const db = getDatabase();
  return execToArray<{ staff_id: number; skill_id: number; proficiency_level: number | null }>(
    db.exec('SELECT staff_id, skill_id, proficiency_level FROM StaffSkills')
  );
}

// ============================================================================
// WORKFORCE (Staff, Roles, Skills)
// ============================================================================

export interface Role {
  id: number;
  role_name: string;
  role_type: string; // 'Agent', 'TeamLeader', 'QA', etc.
  reports_to_role_id: number | null;
  created_at: string;
}

export interface Skill {
  id: number;
  skill_name: string;
  skill_type: string | null;
  description: string | null;
  created_at: string;
}

export interface Staff {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  primary_role_id: number;
  employment_type: string;
  manager_id: number | null;
  start_date: string;
  end_date: string | null;
  site_id: number | null;
  attrition_probability: number;
  created_at: string;
  updated_at: string;
}

// --- ROLES ---

export function getRoles(): Role[] {
  const db = getDatabase();
  return execToArray<Role>(db.exec('SELECT * FROM Roles ORDER BY role_name'));
}

export function createRole(role: Omit<Role, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Roles (role_name, role_type, reports_to_role_id) VALUES (?, ?, ?)`,
    [role.role_name, role.role_type, role.reports_to_role_id]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateRole(id: number, updates: Partial<Role>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });

  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE Roles SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteRole(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Roles WHERE id = ?', [id]);
  saveDatabase();
}

// --- SKILLS ---

export function getSkills(): Skill[] {
  const db = getDatabase();
  return execToArray<Skill>(db.exec('SELECT * FROM Skills ORDER BY skill_name'));
}

export function createSkill(skill: Omit<Skill, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Skills (skill_name, skill_type, description) VALUES (?, ?, ?)`,
    [skill.skill_name, skill.skill_type, skill.description]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function deleteSkill(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Skills WHERE id = ?', [id]);
  saveDatabase();
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// --- STAFF ---

export function getStaff(activeOnly: boolean = true, limit: number = 50, offset: number = 0): PaginatedResult<Staff> {
  const db = getDatabase();
  
  // Get total count first
  const countSql = activeOnly
    ? 'SELECT COUNT(*) as count FROM Staff WHERE end_date IS NULL'
    : 'SELECT COUNT(*) as count FROM Staff';
  const countResult = db.exec(countSql);
  const total = countResult[0]?.values[0]?.[0] as number ?? 0;

  // Get paginated data
  const sql = activeOnly
    ? `SELECT * FROM Staff WHERE end_date IS NULL ORDER BY last_name, first_name LIMIT ? OFFSET ?`
    : `SELECT * FROM Staff ORDER BY last_name, first_name LIMIT ? OFFSET ?`;
    
  const stmt = db.prepare(sql);
  stmt.bind([limit, offset]);
  const data = stmtToArray<Staff>(stmt);

  return { data, total };
}

export function getAllStaff(activeOnly: boolean = true): Staff[] {
  const db = getDatabase();
  const sql = activeOnly
    ? 'SELECT * FROM Staff WHERE end_date IS NULL ORDER BY last_name, first_name'
    : 'SELECT * FROM Staff ORDER BY last_name, first_name';
  return execToArray<Staff>(db.exec(sql));
}

export function getStaffById(id: number): Staff | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Staff WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Staff>(stmt);
}

export function createStaff(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Staff (
      employee_id, first_name, last_name, primary_role_id, employment_type,
      manager_id, start_date, end_date, site_id, attrition_probability
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      staff.employee_id,
      staff.first_name,
      staff.last_name,
      staff.primary_role_id,
      staff.employment_type,
      staff.manager_id,
      staff.start_date,
      staff.end_date,
      staff.site_id,
      staff.attrition_probability
    ]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateStaff(id: number, updates: Partial<Staff>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  db.run(`UPDATE Staff SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteStaff(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Staff WHERE id = ?', [id]);
  saveDatabase();
}

// ============================================================================
// BPO MANAGEMENT (Sites, Contracts, BillingRules)
// ============================================================================

export interface Site {
  id: number;
  site_name: string;
  location: string | null;
  building_capacity: number | null;
  desk_count: number | null;
  timezone: string | null;
  created_at: string;
}

export interface Contract {
  id: number;
  client_id: number;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  currency: string;
  auto_renew: boolean;
  notice_period_days: number;
  created_at: string;
}

export interface BillingRule {
  id: number;
  contract_id: number;
  campaign_id: number | null;
  billing_model: string; // 'PerSeat', 'PerFTE', 'PerHour', etc.
  rate: number;
  penalty_per_sla_point: number;
  reward_per_sla_point: number;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
}

// --- SITES ---

export function getSites(): Site[] {
  const db = getDatabase();
  return execToArray<Site>(db.exec('SELECT * FROM Sites ORDER BY site_name'));
}

export function createSite(site: Omit<Site, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Sites (site_name, location, building_capacity, desk_count, timezone)
     VALUES (?, ?, ?, ?, ?)`,
    [site.site_name, site.location, site.building_capacity, site.desk_count, site.timezone]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateSite(id: number, updates: Partial<Site>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });
  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE Sites SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteSite(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Sites WHERE id = ?', [id]);
  saveDatabase();
}

// --- CONTRACTS ---

export function getContracts(clientId: number | null = null, limit: number = 50, offset: number = 0): PaginatedResult<Contract> {
  const db = getDatabase();
  let total = 0;
  let data: Contract[] = [];

  if (clientId) {
    // Count
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM Contracts WHERE client_id = ?');
    countStmt.bind([clientId]);
    if (countStmt.step()) {
      total = countStmt.getAsObject().count as number;
    }
    countStmt.free();

    // Data
    const stmt = db.prepare('SELECT * FROM Contracts WHERE client_id = ? ORDER BY start_date DESC LIMIT ? OFFSET ?');
    stmt.bind([clientId, limit, offset]);
    data = stmtToArray<Contract>(stmt);
  } else {
    // Count
    const countResult = db.exec('SELECT COUNT(*) as count FROM Contracts');
    total = countResult[0]?.values[0]?.[0] as number ?? 0;

    // Data
    const stmt = db.prepare('SELECT * FROM Contracts ORDER BY start_date DESC LIMIT ? OFFSET ?');
    stmt.bind([limit, offset]);
    data = stmtToArray<Contract>(stmt);
  }

  return { data, total };
}

export function getContractById(id: number): Contract | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Contracts WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Contract>(stmt);
}

export function createContract(contract: Omit<Contract, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Contracts (
      client_id, contract_number, start_date, end_date, currency, auto_renew, notice_period_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      contract.client_id,
      contract.contract_number,
      contract.start_date,
      contract.end_date,
      contract.currency,
      contract.auto_renew ? 1 : 0,
      contract.notice_period_days,
    ]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateContract(id: number, updates: Partial<Contract>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      if (key === 'auto_renew') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value as SqlValue);
      }
    }
  });
  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE Contracts SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteContract(id: number): void {
  const db = getDatabase();
  // Also delete associated billing rules
  db.run('DELETE FROM BillingRules WHERE contract_id = ?', [id]);
  db.run('DELETE FROM Contracts WHERE id = ?', [id]);
  saveDatabase();
}

// --- BILLING RULES ---

export function getBillingRules(contractId: number, campaignId: number | null = null): BillingRule[] {
  const db = getDatabase();
  let sql = 'SELECT * FROM BillingRules WHERE contract_id = ?';
  const params: SqlValue[] = [contractId];

  if (campaignId !== null) {
    sql += ' AND (campaign_id = ? OR campaign_id IS NULL)';
    params.push(campaignId);
  } else {
    sql += ' ORDER BY valid_from DESC';
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);
  return stmtToArray<BillingRule>(stmt);
}

export function getBillingRuleById(id: number): BillingRule | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM BillingRules WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<BillingRule>(stmt);
}

export function createBillingRule(rule: Omit<BillingRule, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO BillingRules (
      contract_id, campaign_id, billing_model, rate, penalty_per_sla_point,
      reward_per_sla_point, valid_from, valid_to
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rule.contract_id,
      rule.campaign_id,
      rule.billing_model,
      rule.rate,
      rule.penalty_per_sla_point,
      rule.reward_per_sla_point,
      rule.valid_from,
      rule.valid_to,
    ]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateBillingRule(id: number, updates: Partial<BillingRule>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });
  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE BillingRules SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteBillingRule(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM BillingRules WHERE id = ?', [id]);
  saveDatabase();
}

// ============================================================================
// RECRUITMENT PIPELINE
// ============================================================================

export interface RecruitmentStage {
  id: number;
  stage_name: string;
  stage_order: number;
  pass_rate: number;  // 0.0-1.0
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

// --- RECRUITMENT STAGES (Pipeline) ---

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
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateRecruitmentStage(id: number, updates: Partial<RecruitmentStage>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });

  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE RecruitmentPipeline SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteRecruitmentStage(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM RecruitmentPipeline WHERE id = ?', [id]);
  saveDatabase();
}

// --- RECRUITMENT REQUESTS ---

export function getRecruitmentRequests(
  status?: 'Open' | 'InProgress' | 'Filled' | 'Cancelled',
  limit: number = 50,
  offset: number = 0
): PaginatedResult<RecruitmentRequest> {
  const db = getDatabase();

  // Count
  const countSql = status
    ? `SELECT COUNT(*) as count FROM RecruitmentRequests WHERE status = '${status}'`
    : 'SELECT COUNT(*) as count FROM RecruitmentRequests';
  const countResult = db.exec(countSql);
  const total = countResult[0]?.values[0]?.[0] as number ?? 0;

  // Data
  let sql = 'SELECT * FROM RecruitmentRequests';
  const params: SqlValue[] = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY requested_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const data = stmtToArray<RecruitmentRequest>(stmt);

  return { data, total };
}

export function createRecruitmentRequest(request: Omit<RecruitmentRequest, 'id' | 'created_at'>): number {
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
      request.notes
    ]
  );
  const result = db.exec('SELECT last_insert_rowid()');
  saveDatabase();
  return result[0].values[0][0] as number;
}

export function updateRecruitmentRequest(id: number, updates: Partial<RecruitmentRequest>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: SqlValue[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value as SqlValue);
    }
  });

  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE RecruitmentRequests SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteRecruitmentRequest(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM RecruitmentRequests WHERE id = ?', [id]);
  saveDatabase();
}

// ============================================================================

/**
 * Get table row counts for diagnostics
 */
// Allowlist of valid table names - prevents SQL injection if this function is ever refactored
const ALLOWED_TABLES = [
  'Staff', 'Roles', 'Skills', 'StaffSkills', 'StaffSecondaryRoles', 'Sites',
  'Clients', 'Campaigns', 'Contracts', 'BillingRules',
  'Assumptions', 'CalendarEvents', 'ProductivityCurves', 'EventAssignments',
  'Scenarios', 'Forecasts', 'HistoricalData',
  'SupportingResources', 'AttritionCurves', 'RecruitmentPipeline', 'RecruitmentRequests'
] as const;

export function getTableCounts(): Record<string, number> {
  const db = getDatabase();

  const counts: Record<string, number> = {};
  ALLOWED_TABLES.forEach((table) => {
    try {
      // Table name is from allowlist, safe to interpolate
      const result = db.exec(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = result[0]?.values[0]?.[0] as number ?? 0;
    } catch {
      counts[table] = 0;
    }
  });

  return counts;
}

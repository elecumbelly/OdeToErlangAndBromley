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
  isBaseline: boolean = false
): number {
  const db = getDatabase();

  // If this is baseline, clear any existing baseline
  if (isBaseline) {
    db.run('UPDATE Scenarios SET is_baseline = 0 WHERE is_baseline = 1');
  }

  db.run(
    `INSERT INTO Scenarios (scenario_name, description, is_baseline, created_by)
     VALUES (?, ?, ?, ?)`,
    [name, description ?? null, isBaseline ? 1 : 0, 'system']
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

// ============================================================================
// CLIENTS
// ============================================================================

/**
 * Get all clients
 */
export function getClients(activeOnly: boolean = true): Client[] {
  const db = getDatabase();
  const sql = activeOnly
    ? 'SELECT * FROM Clients WHERE active = 1 ORDER BY client_name'
    : 'SELECT * FROM Clients ORDER BY client_name';
  return execToArray<Client>(db.exec(sql));
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
// UTILITY
// ============================================================================

/**
 * Get table row counts for diagnostics
 */
export function getTableCounts(): Record<string, number> {
  const db = getDatabase();
  const tables = [
    'Staff', 'Roles', 'Skills', 'StaffSkills', 'StaffSecondaryRoles', 'Sites',
    'Clients', 'Campaigns', 'Contracts', 'BillingRules',
    'Assumptions', 'CalendarEvents', 'ProductivityCurves', 'EventAssignments',
    'Scenarios', 'Forecasts', 'HistoricalData',
    'SupportingResources', 'AttritionCurves', 'RecruitmentPipeline', 'RecruitmentRequests'
  ];

  const counts: Record<string, number> = {};
  tables.forEach((table) => {
    try {
      const result = db.exec(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = result[0]?.values[0]?.[0] as number ?? 0;
    } catch {
      counts[table] = 0;
    }
  });

  return counts;
}

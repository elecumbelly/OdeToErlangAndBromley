/** Forecasts: stored per-scenario per-campaign per-date staffing predictions. */
import type { SqlValue } from 'sql.js';
import {
  getDatabase,
  getLastInsertId,
  saveDatabase,
  stmtToArray,
} from './_shared';

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
  /** percentage 0-100 (note: HistoricalData.sla_achieved uses 0-1) */
  expected_sla: number | null;
  /** percentage 0-100 */
  expected_occupancy: number | null;
  expected_asa: number | null;
  created_at: string;
}

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

  const id = getLastInsertId();
  saveDatabase();
  return id;
}

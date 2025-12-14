/**
 * ForecastEngine - Orchestration layer for Erlang calculations
 *
 * This module ties together:
 * - assumptionResolver: Resolves time-bound assumptions from DB
 * - inputMerger: Merges assumptions with dynamic inputs
 * - erlangEngine: Performs actual calculations
 *
 * Use this for running forecasts that respect database assumptions.
 */

import { resolveAssumptionsForDate } from './assumptionResolver';
import { mergeCalculationInputs } from './inputMerger';
import {
  calculateStaffing,
  type ErlangEngineInput,
  type ErlangEngineOutput
} from '../calculations/erlangEngine';
import {
  getCampaignById,
  saveForecast,
  type Campaign,
  type Forecast
} from '../database/dataAccess';
import type { CalculationInputs, ErlangVariant } from '../../types';

export interface ForecastRequest {
  campaignId: number;
  scenarioId: number;
  forecastDate: string;       // YYYY-MM-DD
  volume: number;             // Call/contact volume for the interval
  model: ErlangVariant;       // Which Erlang model to use
  intervalMinutes?: number;   // Override interval (default from assumptions)
  forecastName?: string;      // Optional name for the forecast
}

export interface ForecastResult {
  inputs: CalculationInputs;
  output: ErlangEngineOutput;
  forecast: Omit<Forecast, 'id' | 'created_at'>;
}

/**
 * Run a single forecast calculation using database assumptions
 */
export function runForecast(request: ForecastRequest): ForecastResult | null {
  // 1. Get campaign for defaults
  const campaign = getCampaignById(request.campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${request.campaignId} not found`);
  }

  // 2. Resolve assumptions for the forecast date
  const assumptionInputs = resolveAssumptionsForDate(
    request.campaignId,
    request.forecastDate,
    campaign
  );

  // 3. Merge with dynamic inputs
  const inputs = mergeCalculationInputs(assumptionInputs, {
    volume: request.volume,
    model: request.model,
    intervalMinutes: request.intervalMinutes
  });

  // 4. Build ErlangEngineInput
  const engineInput: ErlangEngineInput = {
    model: inputs.model,
    workload: {
      volume: inputs.volume,
      aht: inputs.aht,
      intervalMinutes: inputs.intervalMinutes
    },
    constraints: {
      targetSLPercent: inputs.targetSLPercent,
      thresholdSeconds: inputs.thresholdSeconds,
      maxOccupancy: inputs.maxOccupancy
    },
    behavior: {
      shrinkagePercent: inputs.shrinkagePercent,
      averagePatience: inputs.averagePatience,
      concurrency: inputs.concurrency
    }
  };

  // 5. Calculate using unified engine
  const output = calculateStaffing(engineInput);
  if (!output) {
    return null;
  }

  // 6. Build forecast record
  const forecast: Omit<Forecast, 'id' | 'created_at'> = {
    forecast_name: request.forecastName || `Forecast ${request.forecastDate}`,
    scenario_id: request.scenarioId,
    model_type: `Erlang${request.model}`,
    campaign_id: request.campaignId,
    forecast_date: request.forecastDate,
    forecasted_volume: request.volume,
    forecasted_aht: inputs.aht,
    required_agents: output.requiredAgents,
    required_fte: output.totalFTE,
    expected_sla: output.serviceLevel,
    expected_occupancy: output.occupancy,
    expected_asa: output.asa
  };

  return { inputs, output, forecast };
}

/**
 * Run and save a forecast to the database
 */
export function runAndSaveForecast(request: ForecastRequest): {
  forecastId: number;
  result: ForecastResult
} | null {
  const result = runForecast(request);
  if (!result) return null;

  const forecastId = saveForecast(result.forecast);
  return { forecastId, result };
}

/**
 * Run forecasts for multiple dates (batch)
 */
export function runBatchForecast(
  requests: ForecastRequest[]
): (ForecastResult | null)[] {
  return requests.map(request => runForecast(request));
}

/**
 * Generate forecasts for a date range
 */
export function generateDateRangeForecasts(
  campaignId: number,
  scenarioId: number,
  startDate: string,
  endDate: string,
  dailyVolume: number,
  model: ErlangVariant = 'C'
): ForecastResult[] {
  const results: ForecastResult[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const result = runForecast({
      campaignId,
      scenarioId,
      forecastDate: dateStr,
      volume: dailyVolume,
      model
    });
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get default campaign for forecasting (first active campaign)
 */
export function getDefaultCampaign(): Campaign | null {
  // This would typically come from the database store
  // For now, return null and let caller handle
  return null;
}

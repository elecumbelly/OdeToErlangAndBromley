/**
 * Type definitions for OdeToErlangAndBromley
 */

export type ErlangVariant = 'A' | 'B' | 'C';

export interface CalculationInputs {
  volume: number;
  aht: number;
  intervalMinutes: number;
  targetSLPercent: number;
  thresholdSeconds: number;
  shrinkagePercent: number;
  maxOccupancy: number;
  model: ErlangVariant | string;
  averagePatience: number;
  concurrency: number;
  solveFor?: 'agents' | 'sl';
  currentHeadcount?: number;
}

export interface CalculationResults {
  trafficIntensity: number;
  requiredAgents: number;
  totalFTE: number;
  serviceLevel: number; // As percentage
  asa: number; // Average Speed of Answer in seconds
  occupancy: number; // As percentage
  canAchieveTarget: boolean;
  /**
   * True when the underlying queueing formula assumes steady-state arrivals
   * over the interval (Erlang B / Erlang C). False for Erlang A (still
   * approximate but accounts for abandonment). UI uses this to badge
   * forecasts where bursty intraday volume would violate the assumption.
   */
  assumesStationary?: boolean;
}

export interface TooltipContent {
  field: string;
  shortHelp: string;
  example?: string;
  typical?: string;
  formula?: string;
}

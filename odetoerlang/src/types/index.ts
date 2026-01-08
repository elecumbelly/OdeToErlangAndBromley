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
}

export interface TooltipContent {
  field: string;
  shortHelp: string;
  example?: string;
  typical?: string;
  formula?: string;
}

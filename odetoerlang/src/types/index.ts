/**
 * Type definitions for OdeToErlang
 */

export interface CalculationInputs {
  volume: number;
  aht: number; // Average Handle Time in seconds
  intervalMinutes: number; // 15, 30, or 60
  targetSLPercent: number; // Target service level % (e.g., 80 for 80/20)
  thresholdSeconds: number; // Target threshold in seconds (e.g., 20 for 80/20)
  shrinkagePercent: number; // Shrinkage % (e.g., 25 for 25%)
  maxOccupancy: number; // Maximum occupancy % (e.g., 90 for 90%)
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

/**
 * Input Validation System
 *
 * Validates calculation inputs before processing.
 * Returns structured errors for UI display.
 */

import { VALIDATION } from '../../utils/constants';
import type { CalculationInputs } from '../../types';

export interface ValidationError {
  field: keyof CalculationInputs;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate all calculation inputs.
 * Returns validation result with field-specific errors.
 */
export function validateCalculationInputs(inputs: CalculationInputs): ValidationResult {
  const errors: ValidationError[] = [];

  // Volume validation
  if (inputs.volume < VALIDATION.volume.min) {
    errors.push({ field: 'volume', message: 'Volume cannot be negative' });
  }
  if (inputs.volume > VALIDATION.volume.max) {
    errors.push({ field: 'volume', message: `Volume cannot exceed ${VALIDATION.volume.max.toLocaleString()}` });
  }

  // AHT validation
  if (inputs.aht < VALIDATION.aht.min) {
    errors.push({ field: 'aht', message: 'AHT must be at least 1 second' });
  }
  if (inputs.aht > VALIDATION.aht.max) {
    errors.push({ field: 'aht', message: 'AHT cannot exceed 2 hours (7200 seconds)' });
  }

  // Service level validation
  if (inputs.targetSLPercent < VALIDATION.serviceLevelPercent.min) {
    errors.push({ field: 'targetSLPercent', message: 'Service level cannot be negative' });
  }
  if (inputs.targetSLPercent > VALIDATION.serviceLevelPercent.max) {
    errors.push({ field: 'targetSLPercent', message: 'Service level cannot exceed 100%' });
  }

  // Threshold validation
  if (inputs.thresholdSeconds < VALIDATION.thresholdSeconds.min) {
    errors.push({ field: 'thresholdSeconds', message: 'Threshold must be at least 1 second' });
  }
  if (inputs.thresholdSeconds > VALIDATION.thresholdSeconds.max) {
    errors.push({ field: 'thresholdSeconds', message: 'Threshold cannot exceed 10 minutes (600 seconds)' });
  }

  // Shrinkage validation
  if (inputs.shrinkagePercent < VALIDATION.shrinkagePercent.min) {
    errors.push({ field: 'shrinkagePercent', message: 'Shrinkage cannot be negative' });
  }
  if (inputs.shrinkagePercent >= 100) {
    errors.push({ field: 'shrinkagePercent', message: 'Shrinkage cannot be 100% (infinite FTE required)' });
  }

  // Max occupancy validation
  if (inputs.maxOccupancy < VALIDATION.maxOccupancyPercent.min) {
    errors.push({ field: 'maxOccupancy', message: 'Max occupancy must be at least 50%' });
  }
  if (inputs.maxOccupancy > VALIDATION.maxOccupancyPercent.max) {
    errors.push({ field: 'maxOccupancy', message: 'Max occupancy cannot exceed 100%' });
  }

  // Patience validation (for Erlang A/X models)
  if (inputs.model !== 'C' && inputs.averagePatience !== undefined) {
    if (inputs.averagePatience < VALIDATION.averagePatienceSeconds.min) {
      errors.push({ field: 'averagePatience', message: 'Average patience must be at least 10 seconds' });
    }
    if (inputs.averagePatience > VALIDATION.averagePatienceSeconds.max) {
      errors.push({ field: 'averagePatience', message: 'Average patience cannot exceed 30 minutes' });
    }
  }

  // Interval validation
  if (inputs.intervalMinutes <= 0) {
    errors.push({ field: 'intervalMinutes', message: 'Interval must be positive' });
  }
  if (inputs.intervalMinutes > 60) {
    errors.push({ field: 'intervalMinutes', message: 'Interval cannot exceed 60 minutes' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Quick check if inputs are valid without detailed errors.
 */
export function isValidInput(inputs: CalculationInputs): boolean {
  return validateCalculationInputs(inputs).valid;
}

/**
 * Get error message for a specific field.
 */
export function getFieldError(
  result: ValidationResult,
  field: keyof CalculationInputs
): string | undefined {
  return result.errors.find((e) => e.field === field)?.message;
}

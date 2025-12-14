import type { CalculationInputs } from '../../types';

/**
 * Creates a default set of valid calculation inputs for testing.
 * Useful for ensuring tests always start with a valid state.
 *
 * @param overrides - Partial inputs to override defaults
 * @returns Full CalculationInputs object
 */
export const createDefaultInputs = (overrides: Partial<CalculationInputs> = {}): CalculationInputs => ({
  volume: 100,
  aht: 240, // 4 minutes - matches DEFAULT_INPUTS in calculatorStore
  intervalMinutes: 30,
  targetSLPercent: 80,
  thresholdSeconds: 20,
  shrinkagePercent: 25,
  maxOccupancy: 90,
  model: 'C',
  averagePatience: 120,
  concurrency: 1,
  ...overrides,
});

/**
 * Standard test case scenarios for validation across models
 */
export const STANDARD_TEST_CASES = {
  voice: {
    volume: 1000,
    aht: 240,
    intervalMinutes: 30,
    targetSLPercent: 80,
    thresholdSeconds: 20,
    shrinkagePercent: 25,
    maxOccupancy: 90,
    model: 'C' as const,
    averagePatience: 120,
    concurrency: 1,
  },
  chat: {
    volume: 500,
    aht: 600,
    intervalMinutes: 30,
    targetSLPercent: 90,
    thresholdSeconds: 60,
    shrinkagePercent: 20,
    maxOccupancy: 85,
    model: 'A' as const,
    averagePatience: 180,
    concurrency: 3,
  }
};

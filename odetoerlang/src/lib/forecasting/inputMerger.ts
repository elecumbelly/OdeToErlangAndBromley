// src/lib/forecasting/inputMerger.ts
import type { CalculationInputs } from '../../types';
import type { ErlangMathInputs } from './assumptionResolver';

/**
 * Merges assumption-derived inputs with dynamically set inputs (like volume and model)
 * to form a complete CalculationInputs object for the Erlang engine.
 *
 * @param assumptionInputs Inputs resolved from time-bound assumptions.
 * @param dynamicInputs Dynamic inputs like volume, interval (if not from assumptions), and chosen model.
 * @returns A complete CalculationInputs object.
 */
export function mergeCalculationInputs(
  assumptionInputs: ErlangMathInputs,
  dynamicInputs: Partial<CalculationInputs>
): CalculationInputs {
  return {
    volume: dynamicInputs.volume ?? 0, // Volume typically comes from a forecast or manual input, not assumption
    intervalMinutes: dynamicInputs.intervalMinutes ?? assumptionInputs.intervalMinutes, // Interval can be assumption or manual
    model: dynamicInputs.model ?? 'C', // Model is chosen by user

    aht: assumptionInputs.aht,
    targetSLPercent: assumptionInputs.targetSLPercent,
    thresholdSeconds: assumptionInputs.thresholdSeconds,
    shrinkagePercent: assumptionInputs.shrinkagePercent,
    maxOccupancy: assumptionInputs.maxOccupancy,
    averagePatience: assumptionInputs.averagePatience,
    concurrency: assumptionInputs.concurrency ?? 1, // Concurrency from assumption or default
  };
}

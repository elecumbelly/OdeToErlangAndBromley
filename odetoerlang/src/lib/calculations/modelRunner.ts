import type { CalculationInputs } from '../../types';
import {
  calculateStaffingMetrics,
  calculateTrafficIntensity,
  calculateFTE,
  calculateOccupancy,
} from './erlangC';
import { calculateErlangAMetrics } from './erlangA';
import { calculateErlangXMetrics } from './erlangX';

export type ModelId = 'erlangC' | 'erlangA' | 'erlangX';

export interface ModelRunResult {
  modelName: string;
  requiredAgents: number;
  totalFTE: number;
  serviceLevel: number; // percent
  asa: number; // seconds
  occupancy: number; // percent
  abandonmentRate?: number;
  expectedAbandonments?: number;
  retrialProbability?: number;
  virtualTraffic?: number;
}

/**
 * Run any Erlang model (C, A, or X) with a unified interface.
 * This is the main dispatcher for all staffing calculations.
 *
 * Dispatches to the appropriate calculation function based on modelId,
 * normalizes the output format, and returns a consistent result structure.
 *
 * Model Comparison:
 * - **Erlang C**: Simplest, assumes infinite patience. Best for quick estimates.
 * - **Erlang A**: Accounts for abandonment. Better for centers with significant abandonment.
 * - **Erlang X**: Most accurate, models retrials and virtual traffic. Professional-grade.
 *
 * @param inputs - Standard calculation inputs from the calculator store
 * @param overrideModel - Optional model to use instead of inputs.model
 * @returns ModelRunResult with normalized metrics, or null if target unachievable
 *
 * @example
 * // Run with inputs' default model
 * const result = runModel(inputs);
 *
 * // Override model for comparison
 * const erlangCResult = runModel(inputs, 'erlangC');
 * const erlangAResult = runModel(inputs, 'erlangA');
 * const erlangXResult = runModel(inputs, 'erlangX');
 */
export function runModel(inputs: CalculationInputs, overrideModel?: ModelId): ModelRunResult | null {
  const model = overrideModel || inputs.model;
  const intervalSeconds = inputs.intervalMinutes * 60;

  if (model === 'erlangC') {
    const metrics = calculateStaffingMetrics({
      volume: inputs.volume,
      aht: inputs.aht,
      intervalSeconds,
      targetSL: inputs.targetSLPercent / 100,
      thresholdSeconds: inputs.thresholdSeconds,
      shrinkagePercent: inputs.shrinkagePercent / 100,
      maxOccupancy: inputs.maxOccupancy / 100,
    });

    return {
      modelName: 'Erlang C',
      requiredAgents: metrics.requiredAgents,
      totalFTE: metrics.totalFTE,
      serviceLevel: metrics.serviceLevel * 100,
      asa: metrics.asa,
      occupancy: metrics.occupancy * 100,
    };
  }

  if (model === 'erlangA') {
    const metricsA = calculateErlangAMetrics({
      volume: inputs.volume,
      aht: inputs.aht,
      intervalMinutes: inputs.intervalMinutes,
      targetSLPercent: inputs.targetSLPercent,
      thresholdSeconds: inputs.thresholdSeconds,
      shrinkagePercent: inputs.shrinkagePercent,
      maxOccupancy: inputs.maxOccupancy,
      averagePatience: inputs.averagePatience,
    });
    if (!metricsA) return null;

    const traffic = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);
    const totalFTE = calculateFTE(metricsA.requiredAgents, inputs.shrinkagePercent / 100);
    const occupancy = calculateOccupancy(traffic, metricsA.requiredAgents);

    return {
      modelName: 'Erlang A',
      requiredAgents: metricsA.requiredAgents,
      totalFTE,
      serviceLevel: metricsA.serviceLevel * 100,
      asa: metricsA.asa,
      occupancy: occupancy * 100,
      abandonmentRate: metricsA.abandonmentProbability,
      expectedAbandonments: metricsA.expectedAbandonments,
    };
  }

  if (model === 'erlangX') {
    const metricsX = calculateErlangXMetrics({
      volume: inputs.volume,
      aht: inputs.aht,
      intervalMinutes: inputs.intervalMinutes,
      targetSLPercent: inputs.targetSLPercent,
      thresholdSeconds: inputs.thresholdSeconds,
      shrinkagePercent: inputs.shrinkagePercent,
      maxOccupancy: inputs.maxOccupancy,
      averagePatience: inputs.averagePatience,
    });
    if (!metricsX) return null;

    const traffic = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);
    const totalFTE = calculateFTE(metricsX.requiredAgents, inputs.shrinkagePercent / 100);
    const occupancy = calculateOccupancy(traffic, metricsX.requiredAgents);

    return {
      modelName: 'Erlang X',
      requiredAgents: metricsX.requiredAgents,
      totalFTE,
      serviceLevel: metricsX.serviceLevel * 100,
      asa: metricsX.asa,
      occupancy: occupancy * 100,
      abandonmentRate: metricsX.abandonmentRate,
      expectedAbandonments: metricsX.expectedAbandonments,
      retrialProbability: metricsX.retrialProbability,
      virtualTraffic: metricsX.virtualTraffic,
    };
  }

  return null;
}

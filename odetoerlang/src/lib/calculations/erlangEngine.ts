import type { ErlangVariant } from '../../types';
import {
  calculateStaffingMetrics,
  calculateTrafficIntensity,
  calculateFTE,
  calculateOccupancy,
  calculateServiceLevel,
  calculateASA,
} from './erlangC';
import {
  calculateErlangAMetrics,
  calculateServiceLevelWithAbandonment,
  calculateASAWithAbandonment,
  calculateAbandonmentProbability,
  calculateExpectedAbandonments,
} from './erlangA';
import {
  calculateErlangB,
  calculateRequiredLinesB,
} from './erlangB';

// Helper to normalize legacy model names to ErlangVariant
export function normalizeModel(model: string): ErlangVariant {
  const m = model.toLowerCase();
  if (m.includes('erlangb') || m === 'b') return 'B';
  if (m.includes('erlanga') || m === 'a') return 'A';
  if (m.includes('erlangx') || m === 'x') return 'A'; // Map X to A (Advanced A)
  return 'C'; // Default to C
}

// R1. Math API Unification: Define ErlangEngineInput and ErlangEngineOutput
export interface ErlangEngineInput {
  model: ErlangVariant | string; // Accept both for compatibility, normalized internally
  workload: { volume: number; aht: number; intervalMinutes: number };
  constraints: { targetSLPercent: number; thresholdSeconds: number; maxOccupancy: number };
  behavior: {
    shrinkagePercent: number;
    averagePatience?: number;
    concurrency?: number;
    /**
     * Per-extra-session overhead when concurrency > 1. Default 0.15 (15%).
     * Linear scaling assumes zero context-switch cost (a chat agent handling
     * 4 sessions does 4× the work in the same wall-clock time); in practice
     * each extra session adds bookkeeping overhead. `effectiveAHT` becomes:
     *   (aht / concurrency) × (1 + (concurrency - 1) × concurrencyOverhead)
     * Set to 0 to recover the old linear behaviour.
     */
    concurrencyOverhead?: number;
  };
}

/** Default per-extra-session overhead applied when concurrencyOverhead is unset. */
export const DEFAULT_CONCURRENCY_OVERHEAD = 0.15;

/**
 * Compute the effective handle time for a concurrent-handling channel.
 * concurrency=1 (or overhead=0) recovers the raw AHT divided by concurrency.
 */
export function effectiveAHTForConcurrency(aht: number, concurrency: number, overhead: number = DEFAULT_CONCURRENCY_OVERHEAD): number {
  const c = Math.min(10, Math.max(1, concurrency));
  const o = Math.max(0, overhead);
  return (aht / c) * (1 + (c - 1) * o);
}

/**
 * Apply the occupancy-cap penalty to a service-level / ASA pair.
 * SL drops in proportion to severity; ASA grows. Severity=0 is a no-op.
 */
function applyOccupancyPenalty(serviceLevel: number, asa: number, severity: number): { serviceLevel: number; asa: number } {
  if (severity <= 0) return { serviceLevel, asa };
  return {
    serviceLevel: Math.max(0, Math.min(serviceLevel * (1 - severity), 1)),
    asa: isFinite(asa) ? asa * (1 + 2 * severity) : asa,
  };
}

/** Resolve the concurrency-adjusted AHT from the behavior block. */
function resolveEffectiveAHT(aht: number, behavior: ErlangEngineInput['behavior']): number {
  const concurrency = Math.min(10, Math.max(1, behavior.concurrency ?? 1));
  const overhead = behavior.concurrencyOverhead ?? DEFAULT_CONCURRENCY_OVERHEAD;
  return effectiveAHTForConcurrency(aht, concurrency, overhead);
}

export interface ErlangEngineOutput {
  model: ErlangVariant;
  requiredAgents: number;
  effectiveAgents?: number | undefined;
  actualAgents?: number | undefined;
  totalFTE: number;
  serviceLevel: number; // percentage (0-100)
  asa: number; // Average Speed of Answer in seconds
  occupancy: number; // percentage (0-100)
  actualOccupancy?: number | undefined; // percentage (0-100) using the uncapped agent count
  canAchieveTarget: boolean; // Indicates if target SL was met
  occupancyCapApplied?: boolean | undefined;
  requiredAgentsForMaxOccupancy?: number | undefined;
  /**
   * @deprecated Use `occupancyViolationSeverity` instead. The legacy
   * `occupancyPenalty` semantics were inverted (approached 1.0 as cap was
   * violated harder). Kept here for one release for backwards compatibility
   * with persisted output. New code should consume `occupancyViolationSeverity`.
   */
  occupancyPenalty?: number | undefined;
  /**
   * 0 when no cap violation, →1 as `actualAgents` falls below
   * `requiredAgentsForMaxOccupancy`. Service level is scaled by `(1 - s)`
   * and ASA by `(1 + 2·s)` under cap violation.
   */
  occupancyViolationSeverity?: number | undefined;

  // Additional metrics
  abandonmentRate?: number | undefined;
  expectedAbandonments?: number | undefined;
  answeredContacts?: number | undefined;
  retrialProbability?: number | undefined;
  virtualTraffic?: number | undefined;
  blockingProbability?: number | undefined; // For Erlang B

  diagnostics: {
    trafficIntensity: number; // Erlangs
    utilizationPercent: number; // Raw utilization without shrinkage (0-100)
    /**
     * True when the underlying formula assumes steady-state (stationary)
     * arrivals over the interval. M/M/c (Erlang C) is stationary; Erlang A
     * partially accounts for abandonment but is still an approximation.
     * Surfaced so UI can flag intervals with bursty intraday volume.
     */
    assumesStationary: boolean;
  };
}

/**
 * ErlangMathEngine: A unified API for all Erlang calculation types (C, A, X -> A, B).
 * This function acts as the single canonical entry point for staffing calculations.
 *
 * @param input - Structured input object containing all parameters for calculation.
 * @returns A standardized output object with calculated staffing and metrics, or null if unachievable.
 */
export function calculateStaffing(input: ErlangEngineInput): ErlangEngineOutput | null {
  const { workload, constraints, behavior } = input;
  const model = normalizeModel(input.model);
  const intervalSeconds = workload.intervalMinutes * 60;
  const targetSL = constraints.targetSLPercent / 100;
  const maxOccupancy = constraints.maxOccupancy / 100;
  const shrinkage = behavior.shrinkagePercent / 100;

  // Apply concurrency factor with overhead curve (chat/email agents).
  const effectiveAHT = resolveEffectiveAHT(workload.aht, behavior);

  if (workload.aht <= 0 || workload.volume < 0 || intervalSeconds <= 0) return null;
  if (targetSL <= 0 || targetSL > 1 || constraints.thresholdSeconds <= 0 || maxOccupancy <= 0 || maxOccupancy > 1) return null;
  if (shrinkage < 0 || shrinkage >= 1) return null;

  // Erlang A (and former X) requires a patience parameter.
  if (model === 'A' && (behavior.averagePatience === undefined || behavior.averagePatience <= 0)) {
    return null;
  }

  const trafficIntensity = calculateTrafficIntensity(workload.volume, effectiveAHT, intervalSeconds);

  let result: ErlangEngineOutput | null = null;

  if (model === 'C') {
    const metrics = calculateStaffingMetrics({
      volume: workload.volume,
      aht: effectiveAHT,
      intervalSeconds,
      targetSL,
      thresholdSeconds: constraints.thresholdSeconds,
      shrinkagePercent: shrinkage,
      maxOccupancy,
    });

    if (metrics) {
      result = {
        model: 'C',
        requiredAgents: metrics.requiredAgents,
        totalFTE: metrics.totalFTE,
        serviceLevel: metrics.serviceLevel * 100,
        asa: metrics.asa,
        occupancy: metrics.occupancy * 100,
        canAchieveTarget: metrics.canAchieveTarget,
        diagnostics: {
          trafficIntensity,
          utilizationPercent: calculateOccupancy(trafficIntensity, metrics.requiredAgents) * 100,
          assumesStationary: true,
        },
      };
    }
  } else if (model === 'A') {
    const metricsA = calculateErlangAMetrics({
      volume: workload.volume,
      aht: effectiveAHT,
      intervalMinutes: workload.intervalMinutes,
      targetSLPercent: constraints.targetSLPercent,
      thresholdSeconds: constraints.thresholdSeconds,
      shrinkagePercent: behavior.shrinkagePercent,
      maxOccupancy: constraints.maxOccupancy,
      averagePatience: behavior.averagePatience!,
    });

    if (metricsA) {
      const requiredAgents = metricsA.requiredAgents;
      const totalFTE = calculateFTE(requiredAgents, shrinkage);
      const occupancy = calculateOccupancy(trafficIntensity, requiredAgents);

      result = {
        model: 'A',
        requiredAgents,
        totalFTE,
        serviceLevel: metricsA.serviceLevel * 100,
        asa: metricsA.asa,
        occupancy: occupancy * 100,
        canAchieveTarget: metricsA.serviceLevel * 100 >= constraints.targetSLPercent,
        abandonmentRate: metricsA.abandonmentProbability,
        expectedAbandonments: metricsA.expectedAbandonments,
        diagnostics: {
          trafficIntensity,
          utilizationPercent: occupancy * 100,
          assumesStationary: false,
        },
      };
    }
  } else if (model === 'B') {
    // Erlang B: Calculates lines required for a target blocking probability.
    // We treat (1 - targetSL) as the target blocking probability.
    const targetBlocking = 1 - targetSL;
    const requiredLines = calculateRequiredLinesB(trafficIntensity, targetBlocking);
    const actualBlocking = calculateErlangB(trafficIntensity, requiredLines);

    // In Erlang B (pure loss), occupancy is carried traffic / lines
    const carriedTraffic = trafficIntensity * (1 - actualBlocking);
    const occupancy = requiredLines > 0 ? carriedTraffic / requiredLines : 0;
    const totalFTE = calculateFTE(requiredLines, shrinkage);
    const adjustedServiceLevel = (1 - actualBlocking);
    const adjustedAsa = 0;

    result = {
      model: 'B',
      requiredAgents: requiredLines,
      totalFTE,
      serviceLevel: adjustedServiceLevel * 100, // Success Rate
      asa: adjustedAsa, // No queueing
      occupancy: occupancy * 100,
      canAchieveTarget: actualBlocking <= targetBlocking,
      blockingProbability: actualBlocking,
      diagnostics: {
        trafficIntensity,
        utilizationPercent: occupancy * 100,
        assumesStationary: true,
      }
    };
  }

  return result;
}

export interface ErlangAchievableInput extends Omit<ErlangEngineInput, 'constraints'> {
  fixedAgents: number;
  actualAgents?: number;
  constraints: Omit<ErlangEngineInput['constraints'], 'targetSLPercent'>;
}

export function calculateAchievableMetrics(input: ErlangAchievableInput): ErlangEngineOutput | null {
  const { workload, constraints, behavior, fixedAgents, actualAgents: providedActualAgents } = input;
  const model = normalizeModel(input.model);
  const intervalSeconds = workload.intervalMinutes * 60;
  const maxOccupancy = constraints.maxOccupancy / 100;
  const shrinkage = behavior.shrinkagePercent / 100;
  const actualAgents = providedActualAgents ?? fixedAgents;

  const effectiveAHT = resolveEffectiveAHT(workload.aht, behavior);

  if (workload.aht <= 0 || workload.volume < 0 || intervalSeconds <= 0) return null;
  if (fixedAgents <= 0 || maxOccupancy <= 0 || maxOccupancy > 1) return null;
  if (shrinkage < 0 || shrinkage >= 1) return null;
  if (model === 'A' && (behavior.averagePatience === undefined || behavior.averagePatience <= 0)) return null;

  const trafficIntensity = calculateTrafficIntensity(workload.volume, effectiveAHT, intervalSeconds);
  const totalFTE = calculateFTE(fixedAgents, shrinkage);
  const occupancy = calculateOccupancy(trafficIntensity, fixedAgents);
  const actualOccupancy = calculateOccupancy(trafficIntensity, actualAgents);
  const canAchieveTarget = true;
  const requiredAgentsForMaxOccupancy = Math.ceil(trafficIntensity / maxOccupancy);
  const occupancyCapViolated = actualAgents < requiredAgentsForMaxOccupancy;
  // Severity: 0 when not violated, →1 as actualAgents → 0. Quadratic to make
  // mild violations cheap and severe under-staffing expensive.
  const occupancyViolationSeverity = occupancyCapViolated && requiredAgentsForMaxOccupancy > 0
    ? Math.max(0, Math.min(1, 1 - actualAgents / requiredAgentsForMaxOccupancy))
    : 0;
  // Deprecated alias for one release: callers reading this still get a usable
  // number, but new code should consume occupancyViolationSeverity directly.
  const occupancyPenalty = 1 - occupancyViolationSeverity;
  const occupancyCapApplied = occupancyCapViolated;

  let serviceLevel = 0;
  let asa = 0;
  let abandonmentRate: number | undefined;
  let expectedAbandonments: number | undefined;
  let answeredContacts: number | undefined;
  let retrialProbability: number | undefined;
  let virtualTraffic: number | undefined;
  let blockingProbability: number | undefined;

  if (model === 'C') {
    serviceLevel = calculateServiceLevel(fixedAgents, trafficIntensity, effectiveAHT, constraints.thresholdSeconds);
    asa = calculateASA(fixedAgents, trafficIntensity, effectiveAHT);
  } else if (model === 'A') {
    const patienceRatio = behavior.averagePatience! / effectiveAHT;
    serviceLevel = calculateServiceLevelWithAbandonment(fixedAgents, trafficIntensity, effectiveAHT, constraints.thresholdSeconds, behavior.averagePatience!);
    asa = calculateASAWithAbandonment(fixedAgents, trafficIntensity, effectiveAHT, behavior.averagePatience!);
    abandonmentRate = calculateAbandonmentProbability(fixedAgents, trafficIntensity, patienceRatio);
    expectedAbandonments = calculateExpectedAbandonments(workload.volume, fixedAgents, trafficIntensity, patienceRatio);
    answeredContacts = workload.volume - expectedAbandonments;
  } else if (model === 'B') {
    blockingProbability = calculateErlangB(trafficIntensity, fixedAgents);
    serviceLevel = 1 - blockingProbability; // Success rate
    asa = 0;
    // Erlang B occupancy = carried traffic / lines.
    const carriedTraffic = trafficIntensity * (1 - blockingProbability);
    const bOccupancy = fixedAgents > 0 ? carriedTraffic / fixedAgents : 0;

    const penalised = applyOccupancyPenalty(serviceLevel, asa, occupancyViolationSeverity);

    return {
      model: 'B',
      requiredAgents: fixedAgents,
      effectiveAgents: fixedAgents,
      actualAgents,
      totalFTE,
      serviceLevel: penalised.serviceLevel * 100,
      asa: penalised.asa,
      occupancy: bOccupancy * 100,
      actualOccupancy: actualOccupancy * 100,
      canAchieveTarget,
      occupancyCapApplied,
      requiredAgentsForMaxOccupancy,
      occupancyPenalty,
      occupancyViolationSeverity,
      blockingProbability,
      diagnostics: {
        trafficIntensity,
        utilizationPercent: bOccupancy * 100,
        assumesStationary: true,
      }
    };
  } else {
    return null;
  }

  // Severity is 0 when not violated → no change. Otherwise SL drops and ASA
  // climbs in proportion (item Tier-1 #1 fix from ultrathink audit).
  const penalised = applyOccupancyPenalty(serviceLevel, asa, occupancyViolationSeverity);
  serviceLevel = penalised.serviceLevel;
  asa = penalised.asa;

  return {
    model,
    requiredAgents: fixedAgents,
    effectiveAgents: fixedAgents,
    actualAgents,
    totalFTE,
    serviceLevel: serviceLevel * 100,
    asa: isFinite(asa) ? asa : 99999,
    occupancy: occupancy * 100,
    actualOccupancy: actualOccupancy * 100,
    canAchieveTarget,
    occupancyCapApplied,
    requiredAgentsForMaxOccupancy,
    occupancyPenalty,
    occupancyViolationSeverity,
    abandonmentRate,
    expectedAbandonments,
    answeredContacts,
    retrialProbability,
    virtualTraffic,
    diagnostics: {
      trafficIntensity,
      utilizationPercent: occupancy * 100,
      assumesStationary: model === 'C',
    },
  };
}

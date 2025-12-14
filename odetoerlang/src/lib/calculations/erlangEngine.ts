// odetoerlang/src/lib/calculations/erlangEngine.ts
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
  behavior: { shrinkagePercent: number; averagePatience?: number; concurrency?: number };
}

export interface ErlangEngineOutput {
  model: ErlangVariant;
  requiredAgents: number;
  effectiveAgents?: number;
  actualAgents?: number;
  totalFTE: number;
  serviceLevel: number; // percentage (0-100)
  asa: number; // Average Speed of Answer in seconds
  occupancy: number; // percentage (0-100)
  actualOccupancy?: number; // percentage (0-100) using the uncapped agent count
  canAchieveTarget: boolean; // Indicates if target SL was met
  occupancyCapApplied?: boolean;
  requiredAgentsForMaxOccupancy?: number;
  occupancyPenalty?: number;

  // Additional metrics
  abandonmentRate?: number;
  expectedAbandonments?: number;
  answeredContacts?: number;
  retrialProbability?: number;
  virtualTraffic?: number;
  blockingProbability?: number; // For Erlang B

  diagnostics: {
    trafficIntensity: number; // Erlangs
    utilizationPercent: number; // Raw utilization without shrinkage (0-100)
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
  const model = normalizeModel(input.model); // Normalize model
  const intervalSeconds = workload.intervalMinutes * 60;
  const targetSL = constraints.targetSLPercent / 100;
  const maxOccupancy = constraints.maxOccupancy / 100;
  const shrinkage = behavior.shrinkagePercent / 100;

  // Validation
  if (workload.aht <= 0 || workload.volume < 0 || intervalSeconds <= 0) return null;
  if (targetSL <= 0 || targetSL > 1 || constraints.thresholdSeconds <= 0 || maxOccupancy <= 0 || maxOccupancy > 1) return null;
  if (shrinkage < 0 || shrinkage >= 1) return null;
  
  // Erlang A (and former X) requires patience
  if (model === 'A' && (behavior.averagePatience === undefined || behavior.averagePatience <= 0)) {
    return null; 
  }

  // Calculate base traffic intensity
  const trafficIntensity = calculateTrafficIntensity(workload.volume, workload.aht, intervalSeconds);

  let result: ErlangEngineOutput | null = null;

  if (model === 'C') {
    const metrics = calculateStaffingMetrics({
      volume: workload.volume,
      aht: workload.aht,
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
        },
      };
    }
  } else if (model === 'A') {
    const metricsA = calculateErlangAMetrics({
      volume: workload.volume,
      aht: workload.aht,
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

  if (workload.aht <= 0 || workload.volume < 0 || intervalSeconds <= 0) return null;
  if (fixedAgents <= 0 || maxOccupancy <= 0 || maxOccupancy > 1) return null;
  if (shrinkage < 0 || shrinkage >= 1) return null;
  if (model === 'A' && (behavior.averagePatience === undefined || behavior.averagePatience <= 0)) return null;

  const trafficIntensity = calculateTrafficIntensity(workload.volume, workload.aht, intervalSeconds);
  const totalFTE = calculateFTE(fixedAgents, shrinkage);
  const occupancy = calculateOccupancy(trafficIntensity, fixedAgents);
  const actualOccupancy = calculateOccupancy(trafficIntensity, actualAgents);
  const canAchieveTarget = true; 
  const requiredAgentsForMaxOccupancy = Math.ceil(trafficIntensity / maxOccupancy);
  const occupancyCapViolated = actualAgents < requiredAgentsForMaxOccupancy;
  const occupancyPenalty = occupancyCapViolated
    ? Math.max(0, Math.min(1, actualAgents / requiredAgentsForMaxOccupancy))
    : 1;
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
    serviceLevel = calculateServiceLevel(fixedAgents, trafficIntensity, workload.aht, constraints.thresholdSeconds);
    asa = calculateASA(fixedAgents, trafficIntensity, workload.aht);
  } else if (model === 'A') {
    const theta = behavior.averagePatience! / workload.aht;
    serviceLevel = calculateServiceLevelWithAbandonment(fixedAgents, trafficIntensity, workload.aht, constraints.thresholdSeconds, behavior.averagePatience!);
    asa = calculateASAWithAbandonment(fixedAgents, trafficIntensity, workload.aht, behavior.averagePatience!);
    abandonmentRate = calculateAbandonmentProbability(fixedAgents, trafficIntensity, theta);
    expectedAbandonments = calculateExpectedAbandonments(workload.volume, fixedAgents, trafficIntensity, theta);
    answeredContacts = workload.volume - expectedAbandonments;
  } else if (model === 'B') {
    blockingProbability = calculateErlangB(trafficIntensity, fixedAgents);
    serviceLevel = 1 - blockingProbability; // Success rate
    asa = 0;
    // Recalculate occupancy for Erlang B (carried traffic / lines)
    const carriedTraffic = trafficIntensity * (1 - blockingProbability);
    const bOccupancy = fixedAgents > 0 ? carriedTraffic / fixedAgents : 0;

    if (occupancyCapApplied) {
      serviceLevel = Math.max(0, Math.min(serviceLevel * occupancyPenalty, 1));
      const penaltyDenominator = occupancyPenalty > 0 ? occupancyPenalty : 0.001;
      asa = asa / penaltyDenominator;
    }
    
    return {
      model: 'B',
      requiredAgents: fixedAgents,
      effectiveAgents: fixedAgents,
      actualAgents,
      totalFTE,
      serviceLevel: serviceLevel * 100,
      asa,
      occupancy: bOccupancy * 100,
      actualOccupancy: actualOccupancy * 100,
      canAchieveTarget,
      occupancyCapApplied,
      requiredAgentsForMaxOccupancy,
      occupancyPenalty,
      blockingProbability,
      diagnostics: {
        trafficIntensity,
        utilizationPercent: bOccupancy * 100,
      }
    };
  } else {
    return null;
  }

  // Apply occupancy penalty if the supplied staffing would exceed the occupancy cap.
  if (occupancyCapApplied) {
    serviceLevel = Math.max(0, Math.min(serviceLevel * occupancyPenalty, 1));
    if (isFinite(asa)) {
      const penaltyDenominator = occupancyPenalty > 0 ? occupancyPenalty : 0.001;
      asa = asa / penaltyDenominator;
    }
  }

  return {
    model,
    requiredAgents: fixedAgents,
    effectiveAgents: fixedAgents,
    actualAgents,
    totalFTE: calculateFTE(fixedAgents, shrinkage),
    serviceLevel: serviceLevel * 100,
    asa: isFinite(asa) ? asa : 99999,
    occupancy: occupancy * 100,
    actualOccupancy: actualOccupancy * 100,
    canAchieveTarget,
    occupancyCapApplied,
    requiredAgentsForMaxOccupancy,
    occupancyPenalty,
    abandonmentRate,
    expectedAbandonments,
    answeredContacts,
    retrialProbability,
    virtualTraffic,
    diagnostics: {
      trafficIntensity,
      utilizationPercent: occupancy * 100,
    },
  };
}

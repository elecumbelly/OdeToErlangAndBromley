import { create } from 'zustand';
import type { CalculationInputs, CalculationResults } from '../types';
import {
  calculateStaffingMetrics,
  calculateTrafficIntensity,
  calculateFTE,
  calculateOccupancy,
  calculateServiceLevel,
  calculateASA
} from '../lib/calculations/erlangC';
import { calculateErlangAMetrics, calculateServiceLevelWithAbandonment, calculateASAWithAbandonment, calculateAbandonmentProbability, calculateExpectedAbandonments } from '../lib/calculations/erlangA';
import { calculateErlangXMetrics, calculateServiceLevelX, calculateRetrialProbability, calculateVirtualTraffic, solveEquilibriumAbandonment } from '../lib/calculations/erlangX';
import { validateCalculationInputs, type ValidationResult } from '../lib/validation/inputValidation';

// Simple debounce utility - avoids lodash dependency
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Debounce delay in ms - prevents excessive recalculation on rapid input
const DEBOUNCE_DELAY = 300;

// Module-level debounced calculate trigger
// This is created once and shared across all store operations
let debouncedCalculateTrigger: (() => void) | null = null;

function triggerDebouncedCalculate(calculate: () => void) {
  if (!debouncedCalculateTrigger) {
    debouncedCalculateTrigger = debounce(() => {
      calculate();
    }, DEBOUNCE_DELAY);
  }
  debouncedCalculateTrigger();
}

interface ActualStaff {
  totalFTE: number;
  productiveAgents: number;
  useAsConstraint: boolean;
}

interface CalculatorState {
  inputs: CalculationInputs;
  results: CalculationResults | null;
  actualStaff: ActualStaff;
  validation: ValidationResult;
  abandonmentMetrics?: {
    abandonmentRate: number;
    expectedAbandonments: number;
    answeredContacts: number;
    retrialProbability?: number;
    virtualTraffic?: number;
  } | null;
  setInput: <K extends keyof CalculationInputs>(key: K, value: CalculationInputs[K]) => void;
  setActualStaff: <K extends keyof ActualStaff>(key: K, value: ActualStaff[K]) => void;
  calculate: () => void;
  reset: () => void;
}

const DEFAULT_INPUTS: CalculationInputs = {
  volume: 100,
  aht: 240, // 4 minutes
  intervalMinutes: 30,
  targetSLPercent: 80,
  thresholdSeconds: 20,
  shrinkagePercent: 25,
  maxOccupancy: 90,
  model: 'erlangC', // Start with simplest model
  averagePatience: 120 // 2 minutes default patience (for Erlang A/X)
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  inputs: DEFAULT_INPUTS,
  results: null,
  actualStaff: {
    totalFTE: 0,
    productiveAgents: 0,
    useAsConstraint: false
  },
  validation: { valid: true, errors: [] },
  abandonmentMetrics: null,

  setInput: (key, value) => {
    set((state) => ({
      inputs: { ...state.inputs, [key]: value }
    }));
    // Auto-calculate on input change with debouncing to prevent excessive recalculation
    triggerDebouncedCalculate(() => get().calculate());
  },

  setActualStaff: (key, value) => {
    set((state) => ({
      actualStaff: { ...state.actualStaff, [key]: value }
    }));
    // Auto-calculate when staff constraint changes with debouncing
    triggerDebouncedCalculate(() => get().calculate());
  },

  calculate: () => {
    const { inputs, actualStaff } = get();

    // Validate inputs before calculating
    const validationResult = validateCalculationInputs(inputs);
    set({ validation: validationResult });

    // If invalid, clear results and stop
    if (!validationResult.valid) {
      set({ results: null, abandonmentMetrics: null });
      return;
    }

    const intervalSeconds = inputs.intervalMinutes * 60;
    const trafficIntensity = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);

    // If using actual staff as constraint, calculate achievable metrics
    if (actualStaff.useAsConstraint && actualStaff.productiveAgents > 0) {
      const agents = actualStaff.productiveAgents;

      if (inputs.model === 'erlangC') {
        const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
        const asa = calculateASA(agents, trafficIntensity, inputs.aht);
        const occupancy = calculateOccupancy(trafficIntensity, agents);
        const totalFTE = calculateFTE(agents, inputs.shrinkagePercent / 100);

        set({
          results: {
            trafficIntensity,
            requiredAgents: agents,
            totalFTE,
            serviceLevel: sl * 100,
            asa,
            occupancy: occupancy * 100,
            canAchieveTarget: sl >= inputs.targetSLPercent / 100
          },
          abandonmentMetrics: null
        });
        return;
      } else if (inputs.model === 'erlangA') {
        const theta = inputs.averagePatience / inputs.aht;
        const sl = calculateServiceLevelWithAbandonment(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds, inputs.averagePatience);
        const asa = calculateASAWithAbandonment(agents, trafficIntensity, inputs.aht, inputs.averagePatience);
        const abandonProb = calculateAbandonmentProbability(agents, trafficIntensity, theta);
        const expectedAbandons = calculateExpectedAbandonments(inputs.volume, agents, trafficIntensity, theta);
        const occupancy = calculateOccupancy(trafficIntensity, agents);
        const totalFTE = calculateFTE(agents, inputs.shrinkagePercent / 100);

        set({
          results: {
            trafficIntensity,
            requiredAgents: agents,
            totalFTE,
            serviceLevel: sl * 100,
            asa,
            occupancy: occupancy * 100,
            canAchieveTarget: sl >= inputs.targetSLPercent / 100
          },
          abandonmentMetrics: {
            abandonmentRate: abandonProb,
            expectedAbandonments: expectedAbandons,
            answeredContacts: inputs.volume - expectedAbandons
          }
        });
        return;
      } else if (inputs.model === 'erlangX') {
        const abandonRate = solveEquilibriumAbandonment(trafficIntensity, agents, inputs.aht, inputs.averagePatience);
        const sl = calculateServiceLevelX(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds, inputs.averagePatience);
        const avgWait = agents > trafficIntensity ? (inputs.aht / (agents - trafficIntensity)) : Infinity;
        const retrialProb = calculateRetrialProbability(avgWait, inputs.averagePatience);
        const virtualTraffic = calculateVirtualTraffic(trafficIntensity, abandonRate, retrialProb);
        const expectedAbandons = inputs.volume * abandonRate;
        const occupancy = calculateOccupancy(trafficIntensity, agents);
        const totalFTE = calculateFTE(agents, inputs.shrinkagePercent / 100);

        set({
          results: {
            trafficIntensity,
            requiredAgents: agents,
            totalFTE,
            serviceLevel: sl * 100,
            asa: avgWait,
            occupancy: occupancy * 100,
            canAchieveTarget: sl >= inputs.targetSLPercent / 100
          },
          abandonmentMetrics: {
            abandonmentRate: abandonRate,
            expectedAbandonments: expectedAbandons,
            answeredContacts: inputs.volume - expectedAbandons,
            retrialProbability: retrialProb,
            virtualTraffic
          }
        });
        return;
      }
    }

    // Normal mode: solve for optimal staffing
    // Dispatch to appropriate model
    if (inputs.model === 'erlangC') {
      // Erlang C (infinite patience)
      const metrics = calculateStaffingMetrics({
        volume: inputs.volume,
        aht: inputs.aht,
        intervalSeconds,
        targetSL: inputs.targetSLPercent / 100,
        thresholdSeconds: inputs.thresholdSeconds,
        shrinkagePercent: inputs.shrinkagePercent / 100,
        maxOccupancy: inputs.maxOccupancy / 100
      });

      set({
        results: {
          ...metrics,
          serviceLevel: metrics.serviceLevel * 100,
          occupancy: metrics.occupancy * 100
        },
        abandonmentMetrics: null
      });
    } else if (inputs.model === 'erlangA') {
      // Erlang A (with abandonment)
      const metricsA = calculateErlangAMetrics({
        volume: inputs.volume,
        aht: inputs.aht,
        intervalMinutes: inputs.intervalMinutes,
        targetSLPercent: inputs.targetSLPercent,
        thresholdSeconds: inputs.thresholdSeconds,
        shrinkagePercent: inputs.shrinkagePercent,
        maxOccupancy: inputs.maxOccupancy,
        averagePatience: inputs.averagePatience
      });

      if (metricsA) {
        const trafficIntensity = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);
        const totalFTE = calculateFTE(metricsA.requiredAgents, inputs.shrinkagePercent / 100);
        const occupancy = calculateOccupancy(trafficIntensity, metricsA.requiredAgents);

        set({
          results: {
            trafficIntensity,
            requiredAgents: metricsA.requiredAgents,
            totalFTE,
            serviceLevel: metricsA.serviceLevel * 100,
            asa: metricsA.asa,
            occupancy: occupancy * 100,
            canAchieveTarget: true
          },
          abandonmentMetrics: {
            abandonmentRate: metricsA.abandonmentProbability,
            expectedAbandonments: metricsA.expectedAbandonments,
            answeredContacts: metricsA.answeredContacts
          }
        });
      } else {
        set({
          results: {
            trafficIntensity: 0,
            requiredAgents: 0,
            totalFTE: 0,
            serviceLevel: 0,
            asa: Infinity,
            occupancy: 0,
            canAchieveTarget: false
          },
          abandonmentMetrics: null
        });
      }
    } else if (inputs.model === 'erlangX') {
      // Erlang X (most accurate)
      const metricsX = calculateErlangXMetrics({
        volume: inputs.volume,
        aht: inputs.aht,
        intervalMinutes: inputs.intervalMinutes,
        targetSLPercent: inputs.targetSLPercent,
        thresholdSeconds: inputs.thresholdSeconds,
        shrinkagePercent: inputs.shrinkagePercent,
        maxOccupancy: inputs.maxOccupancy,
        averagePatience: inputs.averagePatience
      });

      if (metricsX) {
        const baseTraffic = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);
        const totalFTE = calculateFTE(metricsX.requiredAgents, inputs.shrinkagePercent / 100);
        const occupancy = calculateOccupancy(baseTraffic, metricsX.requiredAgents);

        set({
          results: {
            trafficIntensity: baseTraffic,
            requiredAgents: metricsX.requiredAgents,
            totalFTE,
            serviceLevel: metricsX.serviceLevel * 100,
            asa: metricsX.asa,
            occupancy: occupancy * 100,
            canAchieveTarget: true
          },
          abandonmentMetrics: {
            abandonmentRate: metricsX.abandonmentRate,
            expectedAbandonments: metricsX.expectedAbandonments,
            answeredContacts: metricsX.answeredContacts,
            retrialProbability: metricsX.retrialProbability,
            virtualTraffic: metricsX.virtualTraffic
          }
        });
      } else {
        set({
          results: {
            trafficIntensity: 0,
            requiredAgents: 0,
            totalFTE: 0,
            serviceLevel: 0,
            asa: Infinity,
            occupancy: 0,
            canAchieveTarget: false
          },
          abandonmentMetrics: null
        });
      }
    }
  },

  reset: () => {
    set({ inputs: DEFAULT_INPUTS, results: null, abandonmentMetrics: null, validation: { valid: true, errors: [] } });
    setTimeout(() => get().calculate(), 0);
  }
}));

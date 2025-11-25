import { create } from 'zustand';
import type { CalculationInputs, CalculationResults } from '../types';
import { calculateStaffingMetrics, calculateTrafficIntensity, calculateFTE, calculateOccupancy } from '../lib/calculations/erlangC';
import { calculateErlangAMetrics } from '../lib/calculations/erlangA';
import { calculateErlangXMetrics } from '../lib/calculations/erlangX';

interface ActualStaff {
  totalFTE: number;
  productiveAgents: number;
  useAsConstraint: boolean;
}

interface CalculatorState {
  inputs: CalculationInputs;
  results: CalculationResults | null;
  actualStaff: ActualStaff;
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
  abandonmentMetrics: null,

  setInput: (key, value) => {
    set((state) => ({
      inputs: { ...state.inputs, [key]: value }
    }));
    // Auto-calculate on input change
    setTimeout(() => get().calculate(), 0);
  },

  setActualStaff: (key, value) => {
    set((state) => ({
      actualStaff: { ...state.actualStaff, [key]: value }
    }));
  },

  calculate: () => {
    const { inputs } = get();
    const intervalSeconds = inputs.intervalMinutes * 60;

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
    set({ inputs: DEFAULT_INPUTS, results: null, abandonmentMetrics: null });
    setTimeout(() => get().calculate(), 0);
  }
}));

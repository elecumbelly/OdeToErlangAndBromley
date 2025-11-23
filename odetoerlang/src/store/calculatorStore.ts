import { create } from 'zustand';
import type { CalculationInputs, CalculationResults } from '../types';
import { calculateStaffingMetrics } from '../lib/calculations/erlangC';

interface CalculatorState {
  inputs: CalculationInputs;
  results: CalculationResults | null;
  setInput: <K extends keyof CalculationInputs>(key: K, value: CalculationInputs[K]) => void;
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
  maxOccupancy: 90
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  inputs: DEFAULT_INPUTS,
  results: null,

  setInput: (key, value) => {
    set((state) => ({
      inputs: { ...state.inputs, [key]: value }
    }));
    // Auto-calculate on input change
    setTimeout(() => get().calculate(), 0);
  },

  calculate: () => {
    const { inputs } = get();
    const metrics = calculateStaffingMetrics({
      volume: inputs.volume,
      aht: inputs.aht,
      intervalSeconds: inputs.intervalMinutes * 60,
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
      }
    });
  },

  reset: () => {
    set({ inputs: DEFAULT_INPUTS, results: null });
    setTimeout(() => get().calculate(), 0);
  }
}));

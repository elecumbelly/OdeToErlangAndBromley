import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CalculationInputs, CalculationResults } from '../types';
import { CalculationService } from '../lib/services/CalculationService';
import type { ValidationResult } from '../lib/validation/inputValidation';
import { toLocalDateString } from '../lib/dateUtils';

/**
 * Calculator does not know about the database. A productivity getter is
 * injected once at app boot via setProductivityProvider(); tests can stub it
 * to return any value. Default is 1.0 (no modifier), which is also what the
 * pre-decoupling behaviour returned when no calendar events were present.
 */
type ProductivityProvider = (date: string) => number;
let productivityProvider: ProductivityProvider = () => 1.0;

export function setProductivityProvider(provider: ProductivityProvider): void {
  productivityProvider = provider;
}

/** Lightweight debounce so we don't pull in lodash for a single helper. */
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

const CALCULATE_DEBOUNCE_MS = 300;

interface ShiftType {
  hours: number;
  enabled: boolean;
  proportion: number; // Percentage of staff on this shift type (0-100)
}

interface StaffingModel {
  totalHeadcount: number;        // Total staff on books
  operatingHoursPerDay: number;  // Hours center is open (e.g., 12)
  daysOpenPerWeek: number;       // Days open per week (e.g., 5)
  shiftTypes: ShiftType[];       // Available shift lengths with proportions
  useAsConstraint: boolean;      // Use this staffing as constraint vs optimal calc
}

interface AchievableMetrics {
  serviceLevel: number;
  asa: number;
  occupancy: number;
  actualOccupancy?: number;
  abandonmentRate?: number;
  expectedAbandonments?: number;
  effectiveAgents: number;
  actualAgents: number;
  occupancyCapApplied?: boolean;
  requiredAgentsForMaxOccupancy?: number;
  occupancyPenalty?: number;
}

interface CalculatorState {
  inputs: CalculationInputs;
  date: string; // Add date for calendar integration
  results: CalculationResults | null;
  staffingModel: StaffingModel;
  validation: ValidationResult;
  useAssumptions: boolean;
  activeProductivityModifier?: number;
  achievableMetrics?: AchievableMetrics | null; // What you can achieve with your staff
  abandonmentMetrics?: {
    abandonmentRate: number;
    expectedAbandonments: number;
    answeredContacts: number;
    retrialProbability?: number;
    virtualTraffic?: number;
  } | null;
  setInput: <K extends keyof CalculationInputs>(key: K, value: CalculationInputs[K]) => void;
  setDate: (date: string) => void; // Add setDate action
  setStaffingModel: <K extends keyof StaffingModel>(key: K, value: StaffingModel[K]) => void;
  setShiftType: (hours: number, updates: Partial<ShiftType>) => void;
  setUseAssumptions: (value: boolean) => void;
  calculate: () => void;
  reset: () => void;
}

export type { ShiftType, StaffingModel };

const DEFAULT_INPUTS: CalculationInputs = {
  volume: 100,
  aht: 240, // 4 minutes
  intervalMinutes: 30,
  targetSLPercent: 80,
  thresholdSeconds: 20,
  shrinkagePercent: 25,
  maxOccupancy: 90,
  model: 'C', // Start with simplest model
  averagePatience: 120, // 2 minutes default patience (for Erlang A/X)
  concurrency: 1, // Default concurrency
  solveFor: 'agents',
  currentHeadcount: 0
};

const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  { hours: 8, enabled: true, proportion: 60 },
  { hours: 6, enabled: true, proportion: 30 },
  { hours: 4, enabled: true, proportion: 10 },
];

const DEFAULT_STAFFING_MODEL: StaffingModel = {
  totalHeadcount: 0,
  operatingHoursPerDay: 12,
  daysOpenPerWeek: 5,
  shiftTypes: DEFAULT_SHIFT_TYPES,
  useAsConstraint: false,
};

// A typical employee works 5 days/week, so coverage spreads across more
// people the more days the centre is open (7-day site = each agent on 5/7
// of days on average).
const STANDARD_WORK_WEEK_DAYS = 5;

/**
 * Compute productive agents from the staffing model with multi-shift mix.
 *
 * Semantics: `effectiveAgents = staffPerShift × (1 - shrinkage/100) × productivity`.
 * Productivity (default 1.0) is a multiplicative capacity scaler; values < 1
 * model calendar events like training/holidays that reduce taking-call time.
 */
export function calculateProductiveAgents(
  staffingModel: StaffingModel,
  shrinkagePercent: number,
  productivityModifier: number = 1.0
): { staffPerShift: number; productiveAgents: number; shiftsToFillDay: number; shiftBreakdown: Array<{ hours: number; staff: number; shifts: number }> } {
  const enabledShifts = staffingModel.shiftTypes.filter(s => s.enabled);

  if (staffingModel.totalHeadcount <= 0 || enabledShifts.length === 0) {
    return { staffPerShift: 0, productiveAgents: 0, shiftsToFillDay: 0, shiftBreakdown: [] };
  }

  const totalProportion = enabledShifts.reduce((sum, s) => sum + s.proportion, 0);
  const daysOpenPerWeek = Math.max(1, staffingModel.daysOpenPerWeek);
  const staffAvailablePerDay = staffingModel.totalHeadcount * (STANDARD_WORK_WEEK_DAYS / daysOpenPerWeek);

  const shiftBreakdown = enabledShifts.map(shift => {
    const normalizedProportion = totalProportion > 0
      ? shift.proportion / totalProportion
      : 1 / enabledShifts.length;
    return {
      hours: shift.hours,
      staff: Math.round(staffAvailablePerDay * normalizedProportion),
      shifts: staffingModel.operatingHoursPerDay / shift.hours,
    };
  });

  const totalStaff = shiftBreakdown.reduce((sum, b) => sum + b.staff, 0);
  const weightedShifts = shiftBreakdown.reduce((sum, b) => sum + (b.shifts * b.staff), 0);
  const shiftsToFillDay = totalStaff > 0 ? weightedShifts / totalStaff : 0;

  const staffPerShift = totalStaff > 0
    ? Math.round(shiftBreakdown.reduce((sum, b) => sum + (b.staff / b.shifts), 0))
    : 0;

  const productivity = Math.max(0, productivityModifier);
  const productiveAgents = Math.round(staffPerShift * (1 - shrinkagePercent / 100) * productivity);

  return { staffPerShift, productiveAgents, shiftsToFillDay, shiftBreakdown };
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      date: toLocalDateString(),
      results: null,
      staffingModel: DEFAULT_STAFFING_MODEL,
      validation: { valid: true, errors: [] },
      useAssumptions: true,
      achievableMetrics: null,
      abandonmentMetrics: null,

      setInput: (key, value) => {
        set((state) => ({
          inputs: { ...state.inputs, [key]: value }
        }));
        get().calculate();
      },

      setDate: (date) => {
        set({ date });
        get().calculate();
      },

      setStaffingModel: (key, value) => {
        set((state) => ({
          staffingModel: { ...state.staffingModel, [key]: value }
        }));
        get().calculate();
      },

      setShiftType: (hours, updates) => {
        set((state) => ({
          staffingModel: {
            ...state.staffingModel,
            shiftTypes: state.staffingModel.shiftTypes.map(shift =>
              shift.hours === hours ? { ...shift, ...updates } : shift
            ),
          },
        }));
        get().calculate();
      },

      setUseAssumptions: (value) => {
        set({ useAssumptions: value });
      },

      calculate: debounce(() => {
        const { inputs, staffingModel, date } = get();
        const productivityModifier = productivityProvider(date);
        const serviceResult = CalculationService.calculate(inputs, staffingModel, productivityModifier);

        set({
          results: serviceResult.results,
          achievableMetrics: serviceResult.achievableMetrics,
          abandonmentMetrics: serviceResult.abandonmentMetrics,
          validation: serviceResult.validation,
          activeProductivityModifier: productivityModifier,
        });
      }, CALCULATE_DEBOUNCE_MS),

      reset: () => {
        set({ 
          inputs: DEFAULT_INPUTS, 
          date: toLocalDateString(),
          results: null, 
          abandonmentMetrics: null, 
          activeProductivityModifier: 1.0,
          validation: { valid: true, errors: [] } 
        });
        setTimeout(() => get().calculate(), 0);
      }
    }),
    {
      name: 'odetoerlang_math_model',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        inputs: state.inputs,
        date: state.date,
        useAssumptions: state.useAssumptions,
      }),
    }
  )
);

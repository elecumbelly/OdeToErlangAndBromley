import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CalculationInputs, CalculationResults } from '../types';
import { CalculationService } from '../lib/services/CalculationService';
import type { ValidationResult } from '../lib/validation/inputValidation';
import { useDatabaseStore } from './databaseStore'; // Import database store

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

// Helper to calculate productive agents from staffing model with multiple shift types
export function calculateProductiveAgents(
  staffingModel: StaffingModel,
  shrinkagePercent: number
): { staffPerShift: number; productiveAgents: number; shiftsToFillDay: number; shiftBreakdown: Array<{ hours: number; staff: number; shifts: number }> } {
  const enabledShifts = staffingModel.shiftTypes.filter(s => s.enabled);

  if (staffingModel.totalHeadcount <= 0 || enabledShifts.length === 0) {
    return { staffPerShift: 0, productiveAgents: 0, shiftsToFillDay: 0, shiftBreakdown: [] };
  }

  // Normalize proportions to sum to 100%
  const totalProportion = enabledShifts.reduce((sum, s) => sum + s.proportion, 0);

  // Calculate staff available per day based on days open
  // If open 7 days with 5-day work week, each person works 5/7 of days on average
  const standardWorkWeek = 5; // Typical employee works 5 days/week
  const daysOpenPerWeek = Math.max(1, staffingModel.daysOpenPerWeek);
  const staffAvailablePerDay = staffingModel.totalHeadcount * (standardWorkWeek / daysOpenPerWeek);

  // Calculate breakdown by shift type
  const shiftBreakdown = enabledShifts.map(shift => {
    const normalizedProportion = totalProportion > 0 ? shift.proportion / totalProportion : 1 / enabledShifts.length;
    const staffOnThisShift = Math.round(staffAvailablePerDay * normalizedProportion);
    const shiftsNeeded = staffingModel.operatingHoursPerDay / shift.hours;
    return {
      hours: shift.hours,
      staff: staffOnThisShift,
      shifts: shiftsNeeded,
    };
  });

  // Calculate weighted average shifts to fill day
  const totalStaffWeighted = shiftBreakdown.reduce((sum, b) => sum + b.staff, 0);
  const weightedShifts = shiftBreakdown.reduce((sum, b) => sum + (b.shifts * b.staff), 0);
  const shiftsToFillDay = totalStaffWeighted > 0 ? weightedShifts / totalStaffWeighted : 0;

  // Staff per shift is weighted average
  const staffPerShift = totalStaffWeighted > 0
    ? Math.round(shiftBreakdown.reduce((sum, b) => sum + (b.staff / b.shifts), 0))
    : 0;

  // Apply shrinkage to get productive agents
  const productiveAgents = Math.round(staffPerShift * (1 - shrinkagePercent / 100));

  return { staffPerShift, productiveAgents, shiftsToFillDay, shiftBreakdown };
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      date: new Date().toISOString().split('T')[0], // Default to today
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
        // Auto-calculate on input change
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
        // Auto-calculate when staffing model changes
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
        const { calendarEvents } = useDatabaseStore.getState();

        // Calculate productivity modifier from calendar events for the selected date
        let productivityModifier = 1.0;
        
        if (calendarEvents.length > 0) {
          // Filter events that overlap with the selected date
          // Simple logic: if event starts or ends on this date, or encompasses it.
          // Assuming event times are in ISO format.
          // We'll just check if the event *starts* on this date for simplicity for now, 
          // or ideally, if the date falls within the range.
          
          const targetDateStart = new Date(date + 'T00:00:00');
          const targetDateEnd = new Date(date + 'T23:59:59');

          const dailyEvents = calendarEvents.filter(event => {
            const eventStart = new Date(event.start_datetime);
            const eventEnd = new Date(event.end_datetime);
            return eventStart <= targetDateEnd && eventEnd >= targetDateStart;
          });

          if (dailyEvents.length > 0) {
            // Calculate weighted average or simple min?
            // If there's a 0% productivity event (Holiday), modifier should be 0?
            // Or does it apply to specific staff?
            // "Productivity modifier" in CalendarEvents table usually means "staff available during this event are X% productive".
            // But does the event apply to ALL staff? The `applies_to_filter` field exists but is currently null/JSON.
            // Assumption: Events apply to ALL staff for the Calculator tab (global planner).
            
            // If multiple events, how do they combine?
            // Simple approach: Take the minimum productivity (pessimistic).
            // E.g. Holiday (0%) overrides Training (50%).
            productivityModifier = dailyEvents.reduce((min, event) => {
              return Math.min(min, event.productivity_modifier);
            }, 1.0);
          }
        }

        const serviceResult = CalculationService.calculate(inputs, staffingModel, productivityModifier);

        set({
          results: serviceResult.results,
          achievableMetrics: serviceResult.achievableMetrics,
          abandonmentMetrics: serviceResult.abandonmentMetrics,
          validation: serviceResult.validation,
          activeProductivityModifier: productivityModifier,
        });
      }, DEBOUNCE_DELAY),

      reset: () => {
        set({ 
          inputs: DEFAULT_INPUTS, 
          date: new Date().toISOString().split('T')[0], 
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

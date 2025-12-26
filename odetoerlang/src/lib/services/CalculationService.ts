import {
  calculateStaffing,
  calculateAchievableMetrics,
  type ErlangEngineInput,
  type ErlangAchievableInput,
} from '../calculations/erlangEngine';
import { validateCalculationInputs, type ValidationResult } from '../validation/inputValidation';
import type { CalculationInputs, CalculationResults } from '../../types';

interface ShiftType {
  hours: number;
  enabled: boolean;
  proportion: number;
}

interface StaffingModel {
  totalHeadcount: number;
  operatingHoursPerDay: number;
  daysOpenPerWeek: number;
  shiftTypes: ShiftType[];
  useAsConstraint: boolean;
}

// Helper to calculate productive agents from staffing model with multiple shift types
function calculateProductiveAgentsFromModel(
  staffingModel: StaffingModel,
  shrinkagePercent: number
): number {
  const enabledShifts = staffingModel.shiftTypes.filter(s => s.enabled);

  if (staffingModel.totalHeadcount <= 0 || enabledShifts.length === 0) {
    return 0;
  }

  // Normalize proportions
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
    return { staff: staffOnThisShift, shifts: shiftsNeeded };
  });

  // Staff per shift is weighted average
  const totalStaff = shiftBreakdown.reduce((sum, b) => sum + b.staff, 0);
  const staffPerShift = totalStaff > 0
    ? Math.round(shiftBreakdown.reduce((sum, b) => sum + (b.staff / b.shifts), 0))
    : 0;

  return Math.round(staffPerShift * (1 - shrinkagePercent / 100));
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

interface CalculationServiceResult {
  results: CalculationResults | null;
  achievableMetrics?: AchievableMetrics | null; // What you can achieve with your staff
  abandonmentMetrics?: {
    abandonmentRate: number;
    expectedAbandonments: number;
    answeredContacts: number;
    retrialProbability?: number;
    virtualTraffic?: number;
  } | null;
  validation: ValidationResult;
}

export class CalculationService {
  public static calculate(
    inputs: CalculationInputs,
    staffingModel: StaffingModel,
    productivityModifier: number = 1.0
  ): CalculationServiceResult {
    // Validate inputs before calculating
    const validationResult = validateCalculationInputs(inputs);

    // If invalid, clear results and stop
    if (!validationResult.valid) {
      return {
        results: null,
        achievableMetrics: null,
        abandonmentMetrics: null,
        validation: validationResult,
      };
    }

    // Apply productivity modifier to shrinkage
    const effectiveShrinkagePercent = 100 - ((100 - inputs.shrinkagePercent) * productivityModifier);

    let results: CalculationResults | null = null;
    let abandonmentMetrics: CalculationServiceResult['abandonmentMetrics'] = null;
    let achievableMetrics: AchievableMetrics | null = null;

    // --- Always calculate optimal staffing (what's REQUIRED for the workload) ---
    const erlangEngineInput: ErlangEngineInput = {
      model: inputs.model,
      workload: {
        volume: inputs.volume,
        aht: inputs.aht,
        intervalMinutes: inputs.intervalMinutes,
      },
      constraints: {
        targetSLPercent: inputs.targetSLPercent,
        thresholdSeconds: inputs.thresholdSeconds,
        maxOccupancy: inputs.maxOccupancy,
      },
      behavior: {
        shrinkagePercent: effectiveShrinkagePercent,
        averagePatience: inputs.averagePatience,
        concurrency: inputs.concurrency,
      },
    };

    const engineResult = calculateStaffing(erlangEngineInput);

    if (engineResult) {
      results = {
        trafficIntensity: engineResult.diagnostics.trafficIntensity,
        requiredAgents: engineResult.requiredAgents,
        totalFTE: engineResult.totalFTE,
        serviceLevel: engineResult.serviceLevel,
        asa: engineResult.asa,
        occupancy: engineResult.occupancy,
        canAchieveTarget: engineResult.canAchieveTarget,
      };
      abandonmentMetrics = engineResult.abandonmentRate !== undefined ? {
        abandonmentRate: engineResult.abandonmentRate,
        expectedAbandonments: engineResult.expectedAbandonments || 0,
        answeredContacts: inputs.volume - (engineResult.expectedAbandonments || 0),
        retrialProbability: engineResult.retrialProbability,
        virtualTraffic: engineResult.virtualTraffic,
      } : null;
    }

    // --- If staffing model is set, also calculate what's achievable with your staff ---
    const productiveAgents = calculateProductiveAgentsFromModel(staffingModel, inputs.shrinkagePercent);
    const hasStaffingConstraint = staffingModel.useAsConstraint && productiveAgents > 0 && inputs.volume > 0;

    if (hasStaffingConstraint) {
      const effectiveAgents = productiveAgents;
      const actualAgents = productiveAgents;
      const occupancyCapApplied = false;

      const achievableInput: ErlangAchievableInput = {
        model: inputs.model,
        fixedAgents: effectiveAgents,
        actualAgents,
        workload: {
          volume: inputs.volume,
          aht: inputs.aht,
          intervalMinutes: inputs.intervalMinutes,
        },
        constraints: {
          thresholdSeconds: inputs.thresholdSeconds,
          maxOccupancy: inputs.maxOccupancy,
        },
        behavior: {
          shrinkagePercent: effectiveShrinkagePercent,
          averagePatience: inputs.averagePatience,
          concurrency: inputs.concurrency,
        },
      };

      const achievableResult = calculateAchievableMetrics(achievableInput);

      if (achievableResult) {
        achievableMetrics = {
          serviceLevel: achievableResult.serviceLevel,
          asa: achievableResult.asa,
          occupancy: achievableResult.occupancy,
          actualOccupancy: achievableResult.actualOccupancy,
          abandonmentRate: achievableResult.abandonmentRate,
          expectedAbandonments: achievableResult.expectedAbandonments,
          effectiveAgents: achievableResult.effectiveAgents ?? effectiveAgents,
          actualAgents,
          occupancyCapApplied: achievableResult.occupancyCapApplied ?? occupancyCapApplied,
          requiredAgentsForMaxOccupancy: achievableResult.requiredAgentsForMaxOccupancy,
          occupancyPenalty: achievableResult.occupancyPenalty,
        };
      }
    }

    return { results, achievableMetrics, abandonmentMetrics, validation: validationResult };
  }
}

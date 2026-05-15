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

/**
 * Calculate productive agents from the staffing model and an optional
 * productivity modifier. Mirrors `calculateProductiveAgents` in the calculator
 * store; kept local to avoid an import cycle (store imports this service).
 *
 * Semantics: `effectiveAgents = staffPerShift × (1 - shrinkage) × productivity`.
 * Productivity scales available capacity (e.g. a training day cuts the count
 * of agents that can take calls); shrinkage erodes capacity separately. The
 * two compose multiplicatively.
 */
function calculateProductiveAgentsFromModel(
  staffingModel: StaffingModel,
  shrinkagePercent: number,
  productivityModifier: number = 1.0
): number {
  const enabledShifts = staffingModel.shiftTypes.filter(s => s.enabled);

  if (staffingModel.totalHeadcount <= 0 || enabledShifts.length === 0) {
    return 0;
  }

  const totalProportion = enabledShifts.reduce((sum, s) => sum + s.proportion, 0);

  const STANDARD_WORK_WEEK = 5;
  const daysOpenPerWeek = Math.max(1, staffingModel.daysOpenPerWeek);
  const staffAvailablePerDay = staffingModel.totalHeadcount * (STANDARD_WORK_WEEK / daysOpenPerWeek);

  const shiftBreakdown = enabledShifts.map(shift => {
    const normalizedProportion = totalProportion > 0
      ? shift.proportion / totalProportion
      : 1 / enabledShifts.length;
    const staffOnThisShift = Math.round(staffAvailablePerDay * normalizedProportion);
    const shiftsNeeded = staffingModel.operatingHoursPerDay / shift.hours;
    return { staff: staffOnThisShift, shifts: shiftsNeeded };
  });

  const totalStaff = shiftBreakdown.reduce((sum, b) => sum + b.staff, 0);
  const staffPerShift = totalStaff > 0
    ? Math.round(shiftBreakdown.reduce((sum, b) => sum + (b.staff / b.shifts), 0))
    : 0;

  const productivity = Math.max(0, productivityModifier);
  return Math.round(staffPerShift * (1 - shrinkagePercent / 100) * productivity);
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

    // Productivity scales available capacity, not workload demand.
    // The Erlang engine receives the raw shrinkage; productivity is applied
    // when computing how many productive agents the staffing model yields.
    const productivity = Math.max(0, productivityModifier);

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
        shrinkagePercent: inputs.shrinkagePercent,
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
        assumesStationary: engineResult.diagnostics.assumesStationary,
      };
      abandonmentMetrics = engineResult.abandonmentRate !== undefined ? {
        abandonmentRate: engineResult.abandonmentRate,
        expectedAbandonments: engineResult.expectedAbandonments || 0,
        answeredContacts: inputs.volume - (engineResult.expectedAbandonments || 0),
        retrialProbability: engineResult.retrialProbability,
        virtualTraffic: engineResult.virtualTraffic,
      } : null;
    }

    // --- Achievable-with-your-staff branch ---
    // If solveFor='sl', use the simple currentHeadcount input; otherwise fall
    // back to the detailed staffing model. Productivity multiplies headcount:
    //   effectiveAgents = headcount × (1 - shrinkage) × productivity
    const useSimpleHeadcount = inputs.solveFor === 'sl' && (inputs.currentHeadcount || 0) > 0;
    const productiveAgents = useSimpleHeadcount
      ? Math.round((inputs.currentHeadcount || 0) * (1 - inputs.shrinkagePercent / 100) * productivity)
      : calculateProductiveAgentsFromModel(staffingModel, inputs.shrinkagePercent, productivity);

    const hasStaffingConstraint = productiveAgents > 0
      && inputs.volume > 0
      && (inputs.solveFor === 'sl' || staffingModel.useAsConstraint);

    if (hasStaffingConstraint) {
      const achievableInput: ErlangAchievableInput = {
        model: inputs.model,
        fixedAgents: productiveAgents,
        actualAgents: productiveAgents,
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
          shrinkagePercent: inputs.shrinkagePercent,
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
          effectiveAgents: achievableResult.effectiveAgents ?? productiveAgents,
          actualAgents: productiveAgents,
          occupancyCapApplied: achievableResult.occupancyCapApplied ?? false,
          requiredAgentsForMaxOccupancy: achievableResult.requiredAgentsForMaxOccupancy,
          occupancyPenalty: achievableResult.occupancyPenalty,
        };
      }
    }

    return { results, achievableMetrics, abandonmentMetrics, validation: validationResult };
  }
}

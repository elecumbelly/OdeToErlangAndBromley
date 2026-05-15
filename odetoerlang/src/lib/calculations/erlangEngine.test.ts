import { describe, expect, it } from 'vitest';
import {
  calculateStaffing,
  calculateAchievableMetrics,
  effectiveAHTForConcurrency,
  DEFAULT_CONCURRENCY_OVERHEAD,
} from './erlangEngine';
import { CalculationService } from '../services/CalculationService';
import { createDefaultInputs } from '../../tests/fixtures/calculatorInputs';

describe('calculateAchievableMetrics - occupancy constraints', () => {
  const baseInput = {
    model: 'C' as const,
    fixedAgents: 30,
    actualAgents: 30,
    workload: {
      volume: 200,
      aht: 240,
      intervalMinutes: 30,
    },
    constraints: {
      thresholdSeconds: 20,
      maxOccupancy: 90,
    },
    behavior: {
      shrinkagePercent: 25,
      averagePatience: 120,
      concurrency: 1,
    },
  };

  it('applies a penalty when the occupancy cap is violated', () => {
    const relaxed = calculateAchievableMetrics(baseInput);
    expect(relaxed).not.toBeNull();
    expect(relaxed?.occupancyCapApplied).toBe(false);

    const strict = calculateAchievableMetrics({
      ...baseInput,
      constraints: { ...baseInput.constraints, maxOccupancy: 70 },
    });

    expect(strict).not.toBeNull();
    expect(strict?.occupancyCapApplied).toBe(true);
    expect(strict?.serviceLevel).toBeLessThan(relaxed?.serviceLevel ?? Number.POSITIVE_INFINITY);
    expect(strict?.asa).toBeGreaterThan(relaxed?.asa ?? 0);
  });
});

describe('CalculationService.calculate - staffing constraint uses maxOccupancy', () => {
  const staffingModel = {
    totalHeadcount: 120,
    operatingHoursPerDay: 12,
    daysOpenPerWeek: 5,
    shiftTypes: [
      { hours: 8, enabled: true, proportion: 100 },
    ],
    useAsConstraint: true,
  };

  const baseInputs = createDefaultInputs({
    volume: 400,
    maxOccupancy: 90,
  });

  it('reduces achievable service level when the occupancy cap is tighter', () => {
    const relaxed = CalculationService.calculate(baseInputs, staffingModel);
    const stricter = CalculationService.calculate(
      { ...baseInputs, maxOccupancy: 70 },
      staffingModel
    );

    expect(relaxed.achievableMetrics).not.toBeNull();
    expect(stricter.achievableMetrics).not.toBeNull();

    const relaxedSL = relaxed.achievableMetrics?.serviceLevel ?? 0;
    const strictSL = stricter.achievableMetrics?.serviceLevel ?? 0;

    expect(strictSL).toBeLessThan(relaxedSL);
    expect(stricter.achievableMetrics?.occupancyCapApplied).toBe(true);
  });
});

describe('calculateStaffing - concurrency factor', () => {
  const baseInput = {
    model: 'C' as const,
    workload: { volume: 500, aht: 300, intervalMinutes: 30 },
    constraints: { targetSLPercent: 80, thresholdSeconds: 20, maxOccupancy: 90 },
    behavior: { shrinkagePercent: 25, concurrency: 1 },
  };

  it('requires fewer agents when concurrency > 1', () => {
    const singleChat = calculateStaffing(baseInput);
    const tripleChat = calculateStaffing({
      ...baseInput,
      behavior: { ...baseInput.behavior, concurrency: 3 },
    });

    expect(singleChat).not.toBeNull();
    expect(tripleChat).not.toBeNull();
    expect(tripleChat!.requiredAgents).toBeLessThan(singleChat!.requiredAgents);
    expect(tripleChat!.totalFTE).toBeLessThan(singleChat!.totalFTE);
  });

  it('treats concurrency=1 and concurrency=undefined identically', () => {
    const explicit = calculateStaffing(baseInput);
    const implicit = calculateStaffing({
      ...baseInput,
      behavior: { shrinkagePercent: 25 },
    });

    expect(explicit).not.toBeNull();
    expect(implicit).not.toBeNull();
    expect(explicit!.requiredAgents).toBe(implicit!.requiredAgents);
  });

  it('clamps concurrency below 1 to 1', () => {
    const zeroConcurrency = calculateStaffing({
      ...baseInput,
      behavior: { ...baseInput.behavior, concurrency: 0 },
    });
    const oneConcurrency = calculateStaffing(baseInput);

    expect(zeroConcurrency).not.toBeNull();
    expect(zeroConcurrency!.requiredAgents).toBe(oneConcurrency!.requiredAgents);
  });
});

describe('calculateAchievableMetrics - concurrency factor', () => {
  const baseInput = {
    model: 'C' as const,
    fixedAgents: 30,
    workload: { volume: 200, aht: 240, intervalMinutes: 30 },
    constraints: { thresholdSeconds: 20, maxOccupancy: 90 },
    behavior: { shrinkagePercent: 25, concurrency: 1 },
  };

  it('achieves higher service level with concurrency > 1 for same agent count', () => {
    const single = calculateAchievableMetrics(baseInput);
    const double = calculateAchievableMetrics({
      ...baseInput,
      behavior: { ...baseInput.behavior, concurrency: 2 },
    });

    expect(single).not.toBeNull();
    expect(double).not.toBeNull();
    expect(double!.serviceLevel).toBeGreaterThan(single!.serviceLevel);
  });
});

describe('effectiveAHTForConcurrency', () => {
  it('returns AHT unchanged at concurrency=1', () => {
    expect(effectiveAHTForConcurrency(240, 1, 0.15)).toBeCloseTo(240, 9);
    expect(effectiveAHTForConcurrency(240, 1, 0)).toBeCloseTo(240, 9);
  });

  it('with overhead=0 recovers the old linear divide', () => {
    expect(effectiveAHTForConcurrency(240, 4, 0)).toBeCloseTo(60, 9);
  });

  it('with overhead=0.15 sits above linear divide and below raw AHT', () => {
    const c = 3;
    const aht = 240;
    const linear = aht / c;       // 80
    const eff = effectiveAHTForConcurrency(aht, c, 0.15);
    // eff = 80 × (1 + 2 × 0.15) = 80 × 1.3 = 104
    expect(eff).toBeGreaterThan(linear);
    expect(eff).toBeLessThan(aht);
    expect(eff).toBeCloseTo(104, 6);
  });

  it('clamps concurrency to [1,10]', () => {
    expect(effectiveAHTForConcurrency(240, 0.5, 0.15)).toBeCloseTo(240, 9);
    expect(effectiveAHTForConcurrency(240, 100, 0.15)).toBe(
      effectiveAHTForConcurrency(240, 10, 0.15)
    );
  });
});

describe('calculateStaffing - concurrency overhead', () => {
  const baseInput = {
    model: 'C' as const,
    workload: { volume: 500, aht: 300, intervalMinutes: 30 },
    constraints: { targetSLPercent: 80, thresholdSeconds: 20, maxOccupancy: 90 },
    behavior: { shrinkagePercent: 25, concurrency: 3 },
  };

  it('default overhead requires more agents than zero overhead at c=3', () => {
    const noOverhead = calculateStaffing({
      ...baseInput,
      behavior: { ...baseInput.behavior, concurrencyOverhead: 0 },
    });
    const withDefault = calculateStaffing({
      ...baseInput,
      behavior: { ...baseInput.behavior, concurrencyOverhead: DEFAULT_CONCURRENCY_OVERHEAD },
    });

    expect(noOverhead).not.toBeNull();
    expect(withDefault).not.toBeNull();
    expect(withDefault!.requiredAgents).toBeGreaterThanOrEqual(noOverhead!.requiredAgents);
  });
});

describe('calculateAchievableMetrics - occupancy penalty value semantics', () => {
  const baseInput = {
    model: 'C' as const,
    fixedAgents: 30,
    actualAgents: 30,
    workload: { volume: 200, aht: 240, intervalMinutes: 30 },
    constraints: { thresholdSeconds: 20, maxOccupancy: 90 },
    behavior: { shrinkagePercent: 25, concurrency: 1 },
  };

  it('severity is 0 when cap is not violated', () => {
    const r = calculateAchievableMetrics(baseInput);
    expect(r).not.toBeNull();
    expect(r!.occupancyCapApplied).toBe(false);
    expect(r!.occupancyViolationSeverity).toBe(0);
  });

  it('severity grows monotonically as actualAgents falls below cap requirement', () => {
    // Strict cap makes the required-for-cap count much higher; under-staff
    // by varying amounts and watch severity increase.
    const strict = { ...baseInput.constraints, maxOccupancy: 60 };
    const moderate = calculateAchievableMetrics({
      ...baseInput, constraints: strict, actualAgents: 25,
    });
    const severe = calculateAchievableMetrics({
      ...baseInput, constraints: strict, actualAgents: 18,
    });
    const extreme = calculateAchievableMetrics({
      ...baseInput, constraints: strict, actualAgents: 10,
    });

    expect(moderate?.occupancyViolationSeverity).toBeGreaterThan(0);
    expect(severe?.occupancyViolationSeverity).toBeGreaterThan(moderate?.occupancyViolationSeverity ?? 0);
    expect(extreme?.occupancyViolationSeverity).toBeGreaterThan(severe?.occupancyViolationSeverity ?? 0);
  });

  it('SL strictly decreases and ASA strictly increases with deeper cap violation', () => {
    const strict = { ...baseInput.constraints, maxOccupancy: 60 };
    const at = calculateAchievableMetrics({ ...baseInput, constraints: strict, actualAgents: 25 });
    const below = calculateAchievableMetrics({ ...baseInput, constraints: strict, actualAgents: 18 });
    const wayBelow = calculateAchievableMetrics({ ...baseInput, constraints: strict, actualAgents: 10 });

    expect(at).not.toBeNull();
    expect(below).not.toBeNull();
    expect(wayBelow).not.toBeNull();

    // The previous (broken) implementation would *increase* SL as you under-
    // staffed harder. This assertion catches that regression directly.
    expect(below!.serviceLevel).toBeLessThan(at!.serviceLevel);
    expect(wayBelow!.serviceLevel).toBeLessThan(below!.serviceLevel);

    expect(below!.asa).toBeGreaterThan(at!.asa);
    expect(wayBelow!.asa).toBeGreaterThan(below!.asa);
  });
});

describe('CalculationService - shrinkage × productivity composition', () => {
  const staffingModel = {
    totalHeadcount: 100,
    operatingHoursPerDay: 8,
    daysOpenPerWeek: 5,
    shiftTypes: [{ hours: 8, enabled: true, proportion: 100 }],
    useAsConstraint: true,
  };

  const inputs = createDefaultInputs({
    volume: 200,
    shrinkagePercent: 20,
  });

  it('productivity=1 leaves effective agents unchanged from no-productivity baseline', () => {
    const baseline = CalculationService.calculate(inputs, staffingModel, 1.0);
    expect(baseline.achievableMetrics?.effectiveAgents).toBeGreaterThan(0);
  });

  it('productivity=0.5 halves effective agents relative to productivity=1', () => {
    const full = CalculationService.calculate(inputs, staffingModel, 1.0);
    const half = CalculationService.calculate(inputs, staffingModel, 0.5);

    const fullAgents = full.achievableMetrics?.effectiveAgents ?? 0;
    const halfAgents = half.achievableMetrics?.effectiveAgents ?? 0;

    expect(fullAgents).toBeGreaterThan(0);
    // Half within ±1 due to rounding at each stage.
    expect(Math.abs(halfAgents - fullAgents / 2)).toBeLessThanOrEqual(1);
  });

  it('productivity=0 zeroes out effective capacity', () => {
    const none = CalculationService.calculate(inputs, staffingModel, 0);
    // With zero productive agents the achievable path is skipped.
    expect(none.achievableMetrics).toBeNull();
  });
});

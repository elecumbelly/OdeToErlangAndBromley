import { describe, expect, it } from 'vitest';
import { calculateStaffing, calculateAchievableMetrics } from './erlangEngine';
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

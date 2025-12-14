import { describe, expect, it } from 'vitest';
import { calculateAchievableMetrics } from './erlangEngine';
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
    shiftLengthHours: 8,
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

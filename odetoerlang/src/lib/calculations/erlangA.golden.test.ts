import { describe, expect, it } from 'vitest';
import { CalculationService } from '../services/CalculationService';
import { createDefaultInputs } from '../../tests/fixtures/calculatorInputs';

/**
 * Erlang A golden-ish cases: anchored to reasonable targets with generous tolerance.
 * We treat these as sanity checks, not exact table matches (since Erlang A depends on patience).
 */

const DEFAULT_SHIFT_TYPES = [
  { hours: 8, enabled: true, proportion: 60 },
  { hours: 6, enabled: true, proportion: 30 },
  { hours: 4, enabled: true, proportion: 10 },
];

const DEFAULT_STAFFING_MODEL = {
  totalHeadcount: 0,
  operatingHoursPerDay: 12,
  daysOpenPerWeek: 5,
  shiftTypes: DEFAULT_SHIFT_TYPES,
  useAsConstraint: false,
};

const withinPercent = (value: number, target: number, tolerancePercent: number) => {
  const delta = Math.abs(value - target);
  const tol = (target * tolerancePercent) / 100;
  return delta <= tol;
};

describe('Erlang A golden sanity', () => {
  it('moderate volume, moderate patience: ~14-18 agents', () => {
    const result = CalculationService.calculate(
      createDefaultInputs({
        volume: 100,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        averagePatience: 120,
        model: 'A',
        shrinkagePercent: 0,
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    expect(result).not.toBeNull();
    expect(withinPercent(result?.requiredAgents ?? 0, 16, 20)).toBe(true);
    expect(result?.serviceLevel).toBeGreaterThan(60);
  });

  it('higher volume with abandonment: ~26-34 agents', () => {
    const result = CalculationService.calculate(
      createDefaultInputs({
        volume: 200,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        averagePatience: 120,
        model: 'A',
        shrinkagePercent: 0,
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    expect(result).not.toBeNull();
    expect(withinPercent(result?.requiredAgents ?? 0, 30, 20)).toBe(true);
    expect(result?.serviceLevel).toBeGreaterThan(50);
  });

  it('lower patience raises staffing needs', () => {
    const patient = CalculationService.calculate(
      createDefaultInputs({
        volume: 150,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        averagePatience: 180,
        model: 'A',
        shrinkagePercent: 0,
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    const impatient = CalculationService.calculate(
      createDefaultInputs({
        volume: 150,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        averagePatience: 60,
        model: 'A',
        shrinkagePercent: 0,
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    expect(patient).not.toBeNull();
    expect(impatient).not.toBeNull();
    expect((impatient?.requiredAgents ?? 0)).toBeGreaterThanOrEqual(patient?.requiredAgents ?? 0);
  });
});

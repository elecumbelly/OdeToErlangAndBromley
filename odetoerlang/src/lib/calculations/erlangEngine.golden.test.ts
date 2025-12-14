import { describe, expect, it } from 'vitest';
import { CalculationService } from '../services/CalculationService';
import { createDefaultInputs } from '../../tests/fixtures/calculatorInputs';

/**
 * Golden sanity checks anchored to published Erlang references.
 * Targets are approximate; allow generous tolerance to avoid flakiness.
 */

const DEFAULT_STAFFING_MODEL = {
  totalHeadcount: 0,
  operatingHoursPerDay: 12,
  daysOpenPerWeek: 5,
  shiftLengthHours: 8,
  useAsConstraint: false,
};

const withinPercent = (value: number, target: number, tolerancePercent: number) => {
  const delta = Math.abs(value - target);
  const tol = (target * tolerancePercent) / 100;
  return delta <= tol;
};

describe('Erlang C golden cases', () => {
  it('80/20 baseline (~14-16 agents)', () => {
    // Reference: 100 calls, 240s AHT, 30m, 80/20 -> ~15 agents (classic table)
    const result = CalculationService.calculate(
      createDefaultInputs({
        volume: 100,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        model: 'C',
        shrinkagePercent: 0, // pure requirement
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    expect(result).not.toBeNull();
    expect(withinPercent(result?.requiredAgents ?? 0, 15, 15)).toBe(true);
  });

  it('higher volume scales (~28-32 agents)', () => {
    const result = CalculationService.calculate(
      createDefaultInputs({
        volume: 200,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        model: 'C',
        shrinkagePercent: 0,
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    expect(result).not.toBeNull();
    expect(withinPercent(result?.requiredAgents ?? 0, 30, 15)).toBe(true);
  });
});

describe('Erlang B golden sanity', () => {
  it('10 Erlangs, 80% success (~10-13 lines)', () => {
    // Traffic 10 Erlangs, success 80% (blocking 20%) -> around 11-12 lines in standard tables
    const result = CalculationService.calculate(
      createDefaultInputs({
        volume: 150,
        aht: 240,
        intervalMinutes: 60, // 150*240/3600 = 10 Erlangs
        targetSLPercent: 80, // success rate
        thresholdSeconds: 20,
        model: 'B',
        shrinkagePercent: 0,
      }),
      DEFAULT_STAFFING_MODEL
    ).results;

    expect(result).not.toBeNull();
    expect(withinPercent(result?.requiredAgents ?? 0, 11, 20)).toBe(true);
  });
});

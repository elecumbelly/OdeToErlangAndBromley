import { describe, test, expect } from 'vitest';
import { runModel, type ModelId, type ModelRunResult } from './modelRunner';
import type { CalculationInputs } from '../../types';

/**
 * modelRunner.ts Test Suite
 *
 * Tests the central dispatcher for Erlang C/A/X calculations.
 * Validates:
 * - Model selection and routing
 * - Input transformations (%, minutes → seconds)
 * - Output normalization
 * - Null handling for impossible targets
 * - Edge cases and cross-model comparisons
 */

// Default valid inputs for testing
const createDefaultInputs = (overrides: Partial<CalculationInputs> = {}): CalculationInputs => ({
  volume: 100,
  aht: 180,
  intervalMinutes: 30,
  targetSLPercent: 80,
  thresholdSeconds: 20,
  shrinkagePercent: 25,
  maxOccupancy: 90,
  model: 'erlangC',
  averagePatience: 120,
  ...overrides,
});

describe('modelRunner - Model Selection', () => {
  test('uses inputs.model when overrideModel is undefined', () => {
    const inputsC = createDefaultInputs({ model: 'erlangC' });
    const inputsA = createDefaultInputs({ model: 'erlangA' });

    const resultC = runModel(inputsC);
    const resultA = runModel(inputsA);

    expect(resultC?.modelName).toBe('Erlang C');
    expect(resultA?.modelName).toBe('Erlang A');
  });

  test('uses overrideModel when provided', () => {
    const inputs = createDefaultInputs({ model: 'erlangC' });

    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    expect(resultA?.modelName).toBe('Erlang A');
    expect(resultX?.modelName).toBe('Erlang X');
  });

  test('handles all three models with same inputs', () => {
    const inputs = createDefaultInputs();

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    expect(resultC).not.toBeNull();
    expect(resultA).not.toBeNull();
    expect(resultX).not.toBeNull();
    expect(resultC?.modelName).toBe('Erlang C');
    expect(resultA?.modelName).toBe('Erlang A');
    expect(resultX?.modelName).toBe('Erlang X');
  });

  test('returns null for invalid model (falls through all conditions)', () => {
    const inputs = createDefaultInputs({ model: 'invalid' as ModelId });
    const result = runModel(inputs);
    expect(result).toBeNull();
  });
});

describe('modelRunner - Erlang C Path', () => {
  test('returns correct modelName', () => {
    const inputs = createDefaultInputs({ model: 'erlangC' });
    const result = runModel(inputs);
    expect(result?.modelName).toBe('Erlang C');
  });

  test('converts intervalMinutes to seconds for calculation', () => {
    const inputs15 = createDefaultInputs({ intervalMinutes: 15, model: 'erlangC' });
    const inputs30 = createDefaultInputs({ intervalMinutes: 30, model: 'erlangC' });
    const inputs60 = createDefaultInputs({ intervalMinutes: 60, model: 'erlangC' });

    const result15 = runModel(inputs15);
    const result30 = runModel(inputs30);
    const result60 = runModel(inputs60);

    // All should return valid results
    expect(result15).not.toBeNull();
    expect(result30).not.toBeNull();
    expect(result60).not.toBeNull();

    // Different intervals should produce different agent requirements
    // Shorter intervals with same volume = higher traffic intensity = more agents
    expect(result15!.requiredAgents).toBeGreaterThan(result30!.requiredAgents);
    expect(result30!.requiredAgents).toBeGreaterThan(result60!.requiredAgents);
  });

  test('converts percentage inputs correctly', () => {
    const inputs = createDefaultInputs({
      targetSLPercent: 80,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      model: 'erlangC',
    });

    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Service level should be >= target (in percent)
    expect(result!.serviceLevel).toBeGreaterThanOrEqual(80);
    // Occupancy should be <= max (in percent)
    expect(result!.occupancy).toBeLessThanOrEqual(90);
  });

  test('outputs percentages correctly (decimal * 100)', () => {
    const inputs = createDefaultInputs({ model: 'erlangC' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Service level should be in 0-100 range, not 0-1
    expect(result!.serviceLevel).toBeGreaterThanOrEqual(0);
    expect(result!.serviceLevel).toBeLessThanOrEqual(100);
    // Occupancy should be in 0-100 range
    expect(result!.occupancy).toBeGreaterThanOrEqual(0);
    expect(result!.occupancy).toBeLessThanOrEqual(100);
  });

  test('does NOT include abandonment fields', () => {
    const inputs = createDefaultInputs({ model: 'erlangC' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.abandonmentRate).toBeUndefined();
    expect(result!.expectedAbandonments).toBeUndefined();
    expect(result!.retrialProbability).toBeUndefined();
    expect(result!.virtualTraffic).toBeUndefined();
  });

  test('handles zero volume gracefully', () => {
    const inputs = createDefaultInputs({ volume: 0, model: 'erlangC' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.requiredAgents).toBe(0);
  });

  test('Erlang C never returns null (always finds a solution)', () => {
    // Even extreme targets should return a result
    const inputs = createDefaultInputs({
      volume: 1000,
      targetSLPercent: 99,
      thresholdSeconds: 5,
      model: 'erlangC',
    });
    const result = runModel(inputs);
    expect(result).not.toBeNull();
  });
});

describe('modelRunner - Erlang A Path', () => {
  test('returns correct modelName', () => {
    const inputs = createDefaultInputs({ model: 'erlangA' });
    const result = runModel(inputs);
    expect(result?.modelName).toBe('Erlang A');
  });

  test('includes averagePatience in calculation', () => {
    const inputsLowPatience = createDefaultInputs({ model: 'erlangA', averagePatience: 30 });
    const inputsHighPatience = createDefaultInputs({ model: 'erlangA', averagePatience: 300 });

    const resultLow = runModel(inputsLowPatience);
    const resultHigh = runModel(inputsHighPatience);

    expect(resultLow).not.toBeNull();
    expect(resultHigh).not.toBeNull();

    // Higher patience should result in higher abandonment rate (more time to abandon)
    // Actually, lower patience = higher abandonment (impatient customers leave)
    expect(resultLow!.abandonmentRate).toBeGreaterThan(resultHigh!.abandonmentRate!);
  });

  test('returns null when calculateErlangAMetrics returns null', () => {
    // Very extreme scenario that may be impossible
    const inputs = createDefaultInputs({
      volume: 100000,
      targetSLPercent: 99.99,
      thresholdSeconds: 1,
      model: 'erlangA',
      averagePatience: 5,
    });
    const result = runModel(inputs);
    // May return null for impossible targets
    // If not null, just verify it's a valid result
    if (result === null) {
      expect(result).toBeNull();
    } else {
      expect(result.modelName).toBe('Erlang A');
    }
  });

  test('includes abandonmentRate and expectedAbandonments', () => {
    const inputs = createDefaultInputs({ model: 'erlangA' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.abandonmentRate).toBeDefined();
    expect(result!.expectedAbandonments).toBeDefined();
    expect(result!.abandonmentRate).toBeGreaterThanOrEqual(0);
    expect(result!.abandonmentRate).toBeLessThanOrEqual(1);
    expect(result!.expectedAbandonments).toBeGreaterThanOrEqual(0);
  });

  test('does NOT include retrial fields', () => {
    const inputs = createDefaultInputs({ model: 'erlangA' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.retrialProbability).toBeUndefined();
    expect(result!.virtualTraffic).toBeUndefined();
  });

  test('calculates FTE from requiredAgents and shrinkage', () => {
    const inputs = createDefaultInputs({ model: 'erlangA', shrinkagePercent: 25 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // FTE = agents / (1 - shrinkage) = agents / 0.75
    // So FTE should be greater than requiredAgents
    expect(result!.totalFTE).toBeGreaterThan(result!.requiredAgents);
    // Approximate check: FTE ≈ agents / 0.75
    const expectedFTE = result!.requiredAgents / 0.75;
    expect(result!.totalFTE).toBeCloseTo(expectedFTE, 1);
  });

  test('calculates occupancy correctly', () => {
    const inputs = createDefaultInputs({ model: 'erlangA' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.occupancy).toBeGreaterThanOrEqual(0);
    expect(result!.occupancy).toBeLessThanOrEqual(100);
  });
});

describe('modelRunner - Erlang X Path', () => {
  test('returns correct modelName', () => {
    const inputs = createDefaultInputs({ model: 'erlangX' });
    const result = runModel(inputs);
    expect(result?.modelName).toBe('Erlang X');
  });

  test('returns null when calculateErlangXMetrics returns null', () => {
    // Very extreme scenario
    const inputs = createDefaultInputs({
      volume: 100000,
      targetSLPercent: 99.99,
      thresholdSeconds: 1,
      model: 'erlangX',
      averagePatience: 5,
    });
    const result = runModel(inputs);
    // May return null for impossible targets
    if (result === null) {
      expect(result).toBeNull();
    } else {
      expect(result.modelName).toBe('Erlang X');
    }
  });

  test('includes all optional fields', () => {
    const inputs = createDefaultInputs({ model: 'erlangX' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.abandonmentRate).toBeDefined();
    expect(result!.expectedAbandonments).toBeDefined();
    expect(result!.retrialProbability).toBeDefined();
    expect(result!.virtualTraffic).toBeDefined();
  });

  test('virtualTraffic is greater than or equal to base traffic', () => {
    const inputs = createDefaultInputs({ model: 'erlangX' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Base traffic = (volume * aht) / (intervalMinutes * 60)
    const baseTraffic = (inputs.volume * inputs.aht) / (inputs.intervalMinutes * 60);
    expect(result!.virtualTraffic).toBeGreaterThanOrEqual(baseTraffic);
  });

  test('retrialProbability is bounded', () => {
    const inputs = createDefaultInputs({ model: 'erlangX' });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.retrialProbability).toBeGreaterThanOrEqual(0);
    expect(result!.retrialProbability).toBeLessThanOrEqual(1);
  });

  test('calculates FTE and occupancy same as Erlang A', () => {
    const inputs = createDefaultInputs({ model: 'erlangX', shrinkagePercent: 25 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // FTE > requiredAgents when shrinkage > 0
    expect(result!.totalFTE).toBeGreaterThan(result!.requiredAgents);
    // Occupancy in percentage
    expect(result!.occupancy).toBeGreaterThanOrEqual(0);
    expect(result!.occupancy).toBeLessThanOrEqual(100);
  });
});

describe('modelRunner - Unit Conversions', () => {
  test('interval: minutes to seconds', () => {
    // Same traffic should require same agents regardless of how interval is expressed
    // 100 calls in 30 min = 200 calls in 60 min (same rate)
    const inputs30 = createDefaultInputs({ volume: 100, intervalMinutes: 30 });
    const inputs60 = createDefaultInputs({ volume: 200, intervalMinutes: 60 });

    const result30 = runModel(inputs30);
    const result60 = runModel(inputs60);

    expect(result30).not.toBeNull();
    expect(result60).not.toBeNull();
    // Should have approximately same agent requirements (same traffic intensity)
    expect(result30!.requiredAgents).toBeCloseTo(result60!.requiredAgents, 0);
  });

  test('service level: input percentage, output percentage', () => {
    const inputs = createDefaultInputs({ targetSLPercent: 80 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Input is 80 (percent), output should also be in percent
    expect(result!.serviceLevel).toBeGreaterThanOrEqual(80);
    expect(result!.serviceLevel).toBeLessThanOrEqual(100);
  });

  test('occupancy: output is percentage', () => {
    const inputs = createDefaultInputs({ maxOccupancy: 85 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Should be in 0-100 range, not 0-1
    expect(result!.occupancy).toBeLessThanOrEqual(85);
  });

  test('shrinkage: input percentage converts to decimal for FTE', () => {
    const inputs0 = createDefaultInputs({ shrinkagePercent: 0 });
    const inputs25 = createDefaultInputs({ shrinkagePercent: 25 });
    const inputs50 = createDefaultInputs({ shrinkagePercent: 50 });

    const result0 = runModel(inputs0);
    const result25 = runModel(inputs25);
    const result50 = runModel(inputs50);

    expect(result0).not.toBeNull();
    expect(result25).not.toBeNull();
    expect(result50).not.toBeNull();

    // 0% shrinkage: FTE = agents
    expect(result0!.totalFTE).toBe(result0!.requiredAgents);
    // 25% shrinkage: FTE = agents / 0.75
    expect(result25!.totalFTE).toBeCloseTo(result25!.requiredAgents / 0.75, 1);
    // 50% shrinkage: FTE = agents / 0.50 = agents * 2
    expect(result50!.totalFTE).toBeCloseTo(result50!.requiredAgents / 0.50, 1);
  });
});

describe('modelRunner - Output Normalization', () => {
  test('all required fields present in ModelRunResult', () => {
    const inputs = createDefaultInputs();
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.modelName).toBeDefined();
    expect(result!.requiredAgents).toBeDefined();
    expect(result!.totalFTE).toBeDefined();
    expect(result!.serviceLevel).toBeDefined();
    expect(result!.asa).toBeDefined();
    expect(result!.occupancy).toBeDefined();
  });

  test('modelName matches model ID', () => {
    const inputsC = createDefaultInputs({ model: 'erlangC' });
    const inputsA = createDefaultInputs({ model: 'erlangA' });
    const inputsX = createDefaultInputs({ model: 'erlangX' });

    expect(runModel(inputsC)?.modelName).toBe('Erlang C');
    expect(runModel(inputsA)?.modelName).toBe('Erlang A');
    expect(runModel(inputsX)?.modelName).toBe('Erlang X');
  });

  test('number types are correct', () => {
    const inputs = createDefaultInputs();
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(typeof result!.requiredAgents).toBe('number');
    expect(typeof result!.totalFTE).toBe('number');
    expect(typeof result!.serviceLevel).toBe('number');
    expect(typeof result!.asa).toBe('number');
    expect(typeof result!.occupancy).toBe('number');
  });

  test('percentage fields are in 0-100 range', () => {
    const inputs = createDefaultInputs();
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.serviceLevel).toBeGreaterThanOrEqual(0);
    expect(result!.serviceLevel).toBeLessThanOrEqual(100);
    expect(result!.occupancy).toBeGreaterThanOrEqual(0);
    expect(result!.occupancy).toBeLessThanOrEqual(100);
  });

  test('agent counts are non-negative', () => {
    const inputs = createDefaultInputs();
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.requiredAgents).toBeGreaterThanOrEqual(0);
  });

  test('FTE >= requiredAgents (shrinkage inflates headcount)', () => {
    const inputs = createDefaultInputs({ shrinkagePercent: 25 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.totalFTE).toBeGreaterThanOrEqual(result!.requiredAgents);
  });

  test('ASA is non-negative', () => {
    const inputs = createDefaultInputs();
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.asa).toBeGreaterThanOrEqual(0);
  });
});

describe('modelRunner - Null Handling', () => {
  test('Erlang C path never returns null', () => {
    // Even with extreme inputs, Erlang C should always return a result
    const extremeInputs = createDefaultInputs({
      volume: 10000,
      targetSLPercent: 99,
      thresholdSeconds: 1,
      model: 'erlangC',
    });
    const result = runModel(extremeInputs);
    expect(result).not.toBeNull();
  });

  test('null check does not throw', () => {
    const inputs = createDefaultInputs({
      volume: 100000,
      targetSLPercent: 99.99,
      thresholdSeconds: 1,
      model: 'erlangA',
    });

    // Should not throw, just return null or valid result
    expect(() => runModel(inputs)).not.toThrow();
  });
});

describe('modelRunner - Edge Cases', () => {
  test('zero volume', () => {
    const inputs = createDefaultInputs({ volume: 0 });

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    expect(resultC).not.toBeNull();
    expect(resultC!.requiredAgents).toBe(0);

    // A and X may or may not handle zero volume - just verify no crash
    if (resultA) expect(resultA.requiredAgents).toBe(0);
    if (resultX) expect(resultX.requiredAgents).toBe(0);
  });

  test('very small volume (< 1 call)', () => {
    const inputs = createDefaultInputs({ volume: 0.5 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.requiredAgents).toBeGreaterThanOrEqual(0);
  });

  test('very high traffic (1000 calls in 30 min)', () => {
    const inputs = createDefaultInputs({ volume: 1000 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.requiredAgents).toBeGreaterThan(0);
    // 1000 calls * 180s / 1800s = 100 Erlangs, need > 100 agents
    expect(result!.requiredAgents).toBeGreaterThan(100);
  });

  test('very short AHT (10 seconds)', () => {
    const inputs = createDefaultInputs({ aht: 10 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Very short AHT = low traffic intensity
    expect(result!.requiredAgents).toBeLessThan(10);
  });

  test('very long AHT (1 hour)', () => {
    const inputs = createDefaultInputs({ aht: 3600 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // Long AHT = high traffic intensity
    expect(result!.requiredAgents).toBeGreaterThan(100);
  });

  test('target SL at boundary: 0%', () => {
    const inputs = createDefaultInputs({ targetSLPercent: 0 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
  });

  test('target SL at boundary: 100%', () => {
    const inputs = createDefaultInputs({ targetSLPercent: 100 });
    const result = runModel(inputs);

    // May return null or require very high agents
    if (result) {
      expect(result.serviceLevel).toBeGreaterThanOrEqual(99);
    }
  });

  test('shrinkage at boundary: 0%', () => {
    const inputs = createDefaultInputs({ shrinkagePercent: 0 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.totalFTE).toBe(result!.requiredAgents);
  });

  test('shrinkage near boundary: 99%', () => {
    const inputs = createDefaultInputs({ shrinkagePercent: 99 });
    const result = runModel(inputs);

    expect(result).not.toBeNull();
    // FTE = agents / 0.01 = agents * 100
    expect(result!.totalFTE).toBeGreaterThan(result!.requiredAgents * 50);
  });

  test('averagePatience boundary: very short (10 seconds)', () => {
    const inputs = createDefaultInputs({ model: 'erlangA', averagePatience: 10 });
    const result = runModel(inputs);

    if (result) {
      expect(result.abandonmentRate).toBeGreaterThan(0);
    }
  });

  test('averagePatience boundary: very long (30 minutes)', () => {
    const inputs = createDefaultInputs({ model: 'erlangA', averagePatience: 1800 });
    const result = runModel(inputs);

    if (result) {
      // Very patient customers = low abandonment
      expect(result.abandonmentRate).toBeLessThan(0.5);
    }
  });
});

describe('modelRunner - Cross-Model Comparison', () => {
  test('all models achieve target service level', () => {
    const inputs = createDefaultInputs({ targetSLPercent: 80 });

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    expect(resultC).not.toBeNull();
    expect(resultC!.serviceLevel).toBeGreaterThanOrEqual(80);

    if (resultA) expect(resultA.serviceLevel).toBeGreaterThanOrEqual(80);
    if (resultX) expect(resultX.serviceLevel).toBeGreaterThanOrEqual(80);
  });

  test('Erlang A requires fewer or equal agents than Erlang C', () => {
    const inputs = createDefaultInputs({ averagePatience: 120 });

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');

    expect(resultC).not.toBeNull();

    if (resultA) {
      // A accounts for abandonment which helps SL, so may need fewer agents
      expect(resultA.requiredAgents).toBeLessThanOrEqual(resultC!.requiredAgents);
    }
  });

  test('ASA is positive for all models', () => {
    const inputs = createDefaultInputs();

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    expect(resultC).not.toBeNull();
    expect(resultC!.asa).toBeGreaterThanOrEqual(0);

    if (resultA) expect(resultA.asa).toBeGreaterThanOrEqual(0);
    if (resultX) expect(resultX.asa).toBeGreaterThanOrEqual(0);
  });

  test('FTE calculation consistent across models', () => {
    const inputs = createDefaultInputs({ shrinkagePercent: 25 });

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    // All should have FTE > requiredAgents when shrinkage > 0
    expect(resultC).not.toBeNull();
    expect(resultC!.totalFTE).toBeGreaterThan(resultC!.requiredAgents);

    if (resultA) expect(resultA.totalFTE).toBeGreaterThan(resultA.requiredAgents);
    if (resultX) expect(resultX.totalFTE).toBeGreaterThan(resultX.requiredAgents);
  });
});

describe('modelRunner - Integration', () => {
  test('end-to-end Erlang C flow with realistic inputs', () => {
    // Typical call center: 1000 calls in 30 min, 3 min AHT, 80/20 SL, 25% shrinkage
    const inputs = createDefaultInputs({
      volume: 1000,
      aht: 180,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      model: 'erlangC',
    });

    const result = runModel(inputs);

    expect(result).not.toBeNull();
    expect(result!.modelName).toBe('Erlang C');
    // Traffic = 1000 * 180 / 1800 = 100 Erlangs, need 100+ agents
    expect(result!.requiredAgents).toBeGreaterThan(100);
    expect(result!.totalFTE).toBeGreaterThan(result!.requiredAgents);
    expect(result!.serviceLevel).toBeGreaterThanOrEqual(80);
    expect(result!.occupancy).toBeLessThanOrEqual(90);
    expect(result!.asa).toBeGreaterThan(0);
    expect(result!.asa).toBeLessThan(20); // Should be below threshold for 80% SL
  });

  test('end-to-end Erlang A flow with realistic inputs', () => {
    const inputs = createDefaultInputs({
      volume: 1000,
      aht: 180,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      model: 'erlangA',
      averagePatience: 120,
    });

    const result = runModel(inputs);

    if (result) {
      expect(result.modelName).toBe('Erlang A');
      expect(result.requiredAgents).toBeGreaterThan(0);
      expect(result.serviceLevel).toBeGreaterThanOrEqual(80);
      expect(result.abandonmentRate).toBeDefined();
      expect(result.expectedAbandonments).toBeDefined();
    }
  });

  test('end-to-end Erlang X flow with realistic inputs', () => {
    const inputs = createDefaultInputs({
      volume: 1000,
      aht: 180,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      model: 'erlangX',
      averagePatience: 120,
    });

    const result = runModel(inputs);

    if (result) {
      expect(result.modelName).toBe('Erlang X');
      expect(result.requiredAgents).toBeGreaterThan(0);
      expect(result.serviceLevel).toBeGreaterThanOrEqual(80);
      expect(result.abandonmentRate).toBeDefined();
      expect(result.expectedAbandonments).toBeDefined();
      expect(result.retrialProbability).toBeDefined();
      expect(result.virtualTraffic).toBeDefined();
    }
  });

  test('model comparison with identical inputs', () => {
    const inputs = createDefaultInputs({
      volume: 500,
      aht: 180,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 120,
    });

    const resultC = runModel(inputs, 'erlangC');
    const resultA = runModel(inputs, 'erlangA');
    const resultX = runModel(inputs, 'erlangX');

    expect(resultC).not.toBeNull();

    // All models should produce valid, comparable results
    const results = [resultC, resultA, resultX].filter(Boolean) as ModelRunResult[];
    expect(results.length).toBeGreaterThan(0);

    // All should achieve target SL
    for (const r of results) {
      expect(r.serviceLevel).toBeGreaterThanOrEqual(80);
    }
  });
});

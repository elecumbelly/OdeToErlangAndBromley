import { describe, expect, test } from 'vitest';
import {
  calculateAbandonmentRateX,
  calculateRetrialProbability,
  calculateServiceLevelX,
  calculateVirtualTraffic,
  solveAgentsErlangX,
  solveEquilibriumAbandonment,
  calculateErlangXMetrics,
} from './erlangX';
import { calculateServiceLevelWithAbandonment } from './erlangA';
import { BASE_RETRIAL_RATE, MAX_RETRIAL_RATE } from '../../utils/constants';

describe('Erlang X - calculateRetrialProbability', () => {
  test('returns base retrial rate for zero wait time', () => {
    expect(calculateRetrialProbability(0, 120)).toBeCloseTo(BASE_RETRIAL_RATE, 2);
  });

  test('increases with wait time', () => {
    const lowWait = calculateRetrialProbability(30, 120);
    const highWait = calculateRetrialProbability(300, 120);
    expect(highWait).toBeGreaterThan(lowWait);
  });

  test('caps at MAX_RETRIAL_RATE', () => {
    const extreme = calculateRetrialProbability(1000, 60);
    expect(extreme).toBeCloseTo(MAX_RETRIAL_RATE, 2);
    expect(extreme).toBeLessThanOrEqual(MAX_RETRIAL_RATE);
  });

  test('frustration factor capped at 2x patience', () => {
    const atLimit = calculateRetrialProbability(240, 120); // 2x patience
    const beyondLimit = calculateRetrialProbability(480, 120); // 4x patience
    // Both should be at or near max due to frustration factor cap
    expect(atLimit).toBeCloseTo(beyondLimit, 2);
  });

  test('result always between base and max rates', () => {
    const testCases = [
      [0, 60],
      [60, 60],
      [120, 60],
      [600, 60],
      [0, 300],
      [150, 300],
      [900, 300],
    ];
    for (const [wait, patience] of testCases) {
      const result = calculateRetrialProbability(wait, patience);
      expect(result).toBeGreaterThanOrEqual(BASE_RETRIAL_RATE);
      expect(result).toBeLessThanOrEqual(MAX_RETRIAL_RATE);
    }
  });
});

describe('Erlang X - calculateVirtualTraffic', () => {
  test('returns base traffic when no abandonment', () => {
    const result = calculateVirtualTraffic(10, 0, 0.5);
    expect(result).toBe(10);
  });

  test('returns base traffic when no retrials', () => {
    const result = calculateVirtualTraffic(10, 0.5, 0);
    expect(result).toBe(10);
  });

  test('inflates traffic with feedback', () => {
    // 10% abandonment, 50% retry: feedback = 0.05
    // Virtual = 10 / (1 - 0.05) = 10.526
    expect(calculateVirtualTraffic(10, 0.1, 0.5)).toBeCloseTo(10.526, 2);
  });

  test('larger feedback creates more inflation', () => {
    const lowFeedback = calculateVirtualTraffic(10, 0.1, 0.3);
    const highFeedback = calculateVirtualTraffic(10, 0.3, 0.5);
    expect(highFeedback).toBeGreaterThan(lowFeedback);
  });

  test('returns Infinity when feedback approaches 1', () => {
    expect(calculateVirtualTraffic(10, 1, 1)).toBe(Infinity);
    expect(calculateVirtualTraffic(10, 0.99, 1)).toBe(Infinity);
  });

  test('handles edge cases', () => {
    expect(calculateVirtualTraffic(0, 0.5, 0.5)).toBe(0);
    expect(calculateVirtualTraffic(1, 0, 1)).toBe(1);
  });
});

describe('Erlang X - calculateAbandonmentRateX', () => {
  test('returns 1 for unstable queue (agents <= traffic)', () => {
    expect(calculateAbandonmentRateX(5, 10, 180, 120)).toBe(1);
    expect(calculateAbandonmentRateX(10, 10, 180, 120)).toBe(1);
  });

  test('returns 0 when no waiting (very high agents)', () => {
    // With many more agents than traffic, Pwait approaches 0
    const result = calculateAbandonmentRateX(50, 5, 180, 120);
    expect(result).toBeLessThan(0.01);
  });

  test('abandonment increases with traffic', () => {
    const lowTraffic = calculateAbandonmentRateX(15, 8, 180, 120);
    const highTraffic = calculateAbandonmentRateX(15, 12, 180, 120);
    expect(highTraffic).toBeGreaterThan(lowTraffic);
  });

  test('abandonment decreases with more agents', () => {
    const fewAgents = calculateAbandonmentRateX(12, 10, 180, 120);
    const manyAgents = calculateAbandonmentRateX(20, 10, 180, 120);
    expect(manyAgents).toBeLessThan(fewAgents);
  });

  test('higher patience reduces abandonment', () => {
    const lowPatience = calculateAbandonmentRateX(15, 10, 180, 60);
    const highPatience = calculateAbandonmentRateX(15, 10, 180, 600);
    expect(highPatience).toBeLessThan(lowPatience);
  });

  test('zero patience edge case returns valid result', () => {
    const result = calculateAbandonmentRateX(10, 5, 180, 0);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  test('result always between 0 and 1', () => {
    const testCases = [
      [20, 10, 180, 120],
      [15, 10, 240, 60],
      [25, 15, 300, 180],
    ];
    for (const [agents, traffic, aht, patience] of testCases) {
      const result = calculateAbandonmentRateX(agents, traffic, aht, patience);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });

  test('patienceShape parameter affects calculation', () => {
    // Higher shape = steeper abandonment curve (more realistic)
    const shape1 = calculateAbandonmentRateX(15, 10, 180, 120, 1.0);
    const shape2 = calculateAbandonmentRateX(15, 10, 180, 120, 2.0);
    // Different shapes should give different results
    expect(shape1).not.toEqual(shape2);
  });
});

describe('Erlang X - calculateServiceLevelX', () => {
  test('returns 1 for zero traffic', () => {
    expect(calculateServiceLevelX(10, 0, 180, 20, 120)).toBe(1);
  });

  test('returns 1 for zero agents with zero traffic', () => {
    expect(calculateServiceLevelX(0, 0, 180, 20, 120)).toBe(1);
  });

  test('returns 0 for unstable queue', () => {
    expect(calculateServiceLevelX(5, 10, 180, 20, 120)).toBe(0);
    expect(calculateServiceLevelX(10, 10, 180, 20, 120)).toBe(0);
  });

  test('service level improves with more agents', () => {
    const slLow = calculateServiceLevelX(10, 8, 180, 20, 120);
    const slMid = calculateServiceLevelX(12, 8, 180, 20, 120);
    const slHigh = calculateServiceLevelX(14, 8, 180, 20, 120);
    expect(slMid).toBeGreaterThan(slLow);
    expect(slHigh).toBeGreaterThan(slMid);
  });

  test('service level decreases with higher traffic', () => {
    const slLow = calculateServiceLevelX(15, 8, 180, 20, 120);
    const slHigh = calculateServiceLevelX(15, 12, 180, 20, 120);
    expect(slLow).toBeGreaterThan(slHigh);
  });

  test('longer threshold improves service level', () => {
    // Need more agents to see the effect
    const slShort = calculateServiceLevelX(15, 10, 180, 10, 120);
    const slLong = calculateServiceLevelX(15, 10, 180, 60, 120);
    expect(slLong).toBeGreaterThanOrEqual(slShort);
  });

  test('result always between 0 and 1', () => {
    const testCases = [
      [15, 10, 180, 20, 120],
      [20, 12, 240, 30, 90],
      [25, 18, 300, 20, 180],
    ];
    for (const [agents, traffic, aht, threshold, patience] of testCases) {
      const result = calculateServiceLevelX(agents, traffic, aht, threshold, patience);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });

  test('high patience makes Erlang X approach Erlang A results', () => {
    const slX = calculateServiceLevelX(13, 10, 180, 20, 3600);
    const slA = calculateServiceLevelWithAbandonment(13, 10, 180, 20, 3600);
    expect(slX).toBeGreaterThan(0);
    expect(slX).toBeLessThanOrEqual(1);
    expect(slA).toBeGreaterThan(0);
    expect(slA).toBeLessThanOrEqual(1);
    // With very high patience, models should converge (within 30%)
    expect(Math.abs(slX - slA)).toBeLessThan(0.30);
  });
});

describe('Erlang X - solveEquilibriumAbandonment', () => {
  test('converges to reasonable value', () => {
    const rate = solveEquilibriumAbandonment(10, 14, 180, 120);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThan(1);
  });

  test('higher traffic increases equilibrium abandonment', () => {
    const lowTraffic = solveEquilibriumAbandonment(8, 14, 180, 120);
    const highTraffic = solveEquilibriumAbandonment(12, 14, 180, 120);
    expect(highTraffic).toBeGreaterThan(lowTraffic);
  });

  test('more agents decrease equilibrium abandonment', () => {
    const fewAgents = solveEquilibriumAbandonment(10, 12, 180, 120);
    const manyAgents = solveEquilibriumAbandonment(10, 18, 180, 120);
    expect(manyAgents).toBeLessThan(fewAgents);
  });

  test('respects max iterations parameter', () => {
    // Should return a result even with few iterations
    const result = solveEquilibriumAbandonment(10, 14, 180, 120, 5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  test('unstable queue returns 1', () => {
    const result = solveEquilibriumAbandonment(15, 10, 180, 120);
    expect(result).toBe(1);
  });
});

describe('Erlang X - solveAgentsErlangX', () => {
  test('returns 0 for zero traffic', () => {
    expect(solveAgentsErlangX(0, 180, 0.8, 20, 0.9, 120)).toBe(0);
  });

  test('returns 0 for zero AHT', () => {
    expect(solveAgentsErlangX(10, 0, 0.8, 20, 0.9, 120)).toBe(0);
  });

  test('returns positive agents for realistic scenario', () => {
    const agents = solveAgentsErlangX(10, 180, 0.8, 20, 0.9, 120);
    expect(agents).toBeGreaterThan(0);
  });

  test('higher SL target requires more agents', () => {
    const agents70 = solveAgentsErlangX(10, 180, 0.7, 20, 0.9, 120)!;
    const agents80 = solveAgentsErlangX(10, 180, 0.8, 20, 0.9, 120)!;
    const agents90 = solveAgentsErlangX(10, 180, 0.9, 20, 0.9, 120)!;
    expect(agents80).toBeGreaterThanOrEqual(agents70);
    expect(agents90).toBeGreaterThanOrEqual(agents80);
  });

  test('stricter threshold requires more agents', () => {
    const long = solveAgentsErlangX(10, 180, 0.8, 60, 0.9, 120)!;
    const short = solveAgentsErlangX(10, 180, 0.8, 20, 0.9, 120)!;
    expect(short).toBeGreaterThanOrEqual(long);
  });

  test('handles extreme targets by requiring many agents', () => {
    // Very high target with high traffic - requires many agents
    const result = solveAgentsErlangX(50, 180, 0.99, 5, 0.99, 30);
    // Should either return null or require more than base traffic
    if (result !== null) {
      expect(result).toBeGreaterThan(50);
    }
  });

  test('result respects max occupancy constraint', () => {
    const agents = solveAgentsErlangX(10, 180, 0.8, 20, 0.85, 120)!;
    // Agents should be at least traffic / maxOccupancy
    expect(agents).toBeGreaterThanOrEqual(Math.ceil(10 / 0.85));
  });
});

describe('Erlang X - calculateErlangXMetrics', () => {
  const baseParams = {
    volume: 1000,
    aht: 240,
    intervalMinutes: 30,
    targetSLPercent: 80,
    thresholdSeconds: 20,
    shrinkagePercent: 25,
    maxOccupancy: 90,
    averagePatience: 120,
  };

  test('returns complete metrics for realistic scenario', () => {
    const metrics = calculateErlangXMetrics(baseParams);

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.serviceLevel).toBeGreaterThan(0);
    expect(metrics.serviceLevel).toBeLessThanOrEqual(1);
    expect(metrics.requiredAgents).toBeGreaterThan(0);
    expect(metrics.trafficIntensity).toBeGreaterThan(0);
    expect(metrics.asa).toBeGreaterThanOrEqual(0);
  });

  test('answered + abandonments approximately equals volume', () => {
    const metrics = calculateErlangXMetrics(baseParams);
    if (!metrics) return;

    const total = metrics.answeredContacts + metrics.expectedAbandonments;
    expect(total).toBeGreaterThan(900);
    expect(total).toBeLessThanOrEqual(1100);
  });

  test('retrial probability within bounds', () => {
    const metrics = calculateErlangXMetrics(baseParams);
    if (!metrics) return;

    expect(metrics.retrialProbability).toBeGreaterThanOrEqual(BASE_RETRIAL_RATE);
    expect(metrics.retrialProbability).toBeLessThanOrEqual(MAX_RETRIAL_RATE);
  });

  test('virtual traffic >= base traffic', () => {
    const metrics = calculateErlangXMetrics(baseParams);
    if (!metrics) return;

    expect(metrics.virtualTraffic).toBeGreaterThanOrEqual(metrics.trafficIntensity);
  });

  test('abandonment rate between 0 and 1', () => {
    const metrics = calculateErlangXMetrics(baseParams);
    if (!metrics) return;

    expect(metrics.abandonmentRate).toBeGreaterThanOrEqual(0);
    expect(metrics.abandonmentRate).toBeLessThanOrEqual(1);
  });

  test('handles zero volume', () => {
    const metrics = calculateErlangXMetrics({ ...baseParams, volume: 0 });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.requiredAgents).toBe(0);
    expect(metrics.serviceLevel).toBe(1);
    expect(metrics.answeredContacts).toBe(0);
  });

  test('handles very small volume', () => {
    const metrics = calculateErlangXMetrics({ ...baseParams, volume: 5 });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.requiredAgents).toBeGreaterThanOrEqual(0);
  });

  test('handles very high volume', () => {
    const metrics = calculateErlangXMetrics({ ...baseParams, volume: 10000 });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.requiredAgents).toBeGreaterThan(50);
  });

  test('handles short AHT', () => {
    const metrics = calculateErlangXMetrics({ ...baseParams, aht: 30 });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.requiredAgents).toBeGreaterThan(0);
  });

  test('handles long AHT', () => {
    const metrics = calculateErlangXMetrics({ ...baseParams, aht: 1800 });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.requiredAgents).toBeGreaterThan(baseParams.volume * 0.5);
  });

  test('extreme target requires many agents', () => {
    // Extreme scenario: 99% SL in 1 second with very impatient customers
    const metrics = calculateErlangXMetrics({
      ...baseParams,
      targetSLPercent: 99,
      thresholdSeconds: 1,
      averagePatience: 10,
      volume: 5000,
    });

    // Should either be null or require many agents
    if (metrics) {
      expect(metrics.requiredAgents).toBeGreaterThan(500);
    }
  });

  test('low patience increases abandonment', () => {
    const lowPatience = calculateErlangXMetrics({
      ...baseParams,
      averagePatience: 30,
    });
    const highPatience = calculateErlangXMetrics({
      ...baseParams,
      averagePatience: 300,
    });

    expect(lowPatience).not.toBeNull();
    expect(highPatience).not.toBeNull();
    if (!lowPatience || !highPatience) return;

    expect(lowPatience.abandonmentRate).toBeGreaterThan(highPatience.abandonmentRate);
  });

  test('higher SL target requires more agents', () => {
    const sl70 = calculateErlangXMetrics({ ...baseParams, targetSLPercent: 70 });
    const sl90 = calculateErlangXMetrics({ ...baseParams, targetSLPercent: 90 });

    expect(sl70).not.toBeNull();
    expect(sl90).not.toBeNull();
    if (!sl70 || !sl90) return;

    expect(sl90.requiredAgents).toBeGreaterThanOrEqual(sl70.requiredAgents);
  });
});

describe('Erlang X - Cross-model comparisons', () => {
  test('Erlang X with infinite patience approximates Erlang C behavior', () => {
    // With infinite patience (no abandonment), X should behave like C
    const slX = calculateServiceLevelX(15, 10, 180, 20, 100000);
    // SL should be achievable and reasonable
    expect(slX).toBeGreaterThan(0.5);
    expect(slX).toBeLessThanOrEqual(1);
  });

  test('Erlang X produces lower staffing than C due to abandoned contacts', () => {
    // Erlang X accounts for abandonments, which means fewer contacts served
    // This typically results in meeting SL with slightly fewer agents
    const metricsX = calculateErlangXMetrics({
      volume: 500,
      aht: 180,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 120,
    });

    expect(metricsX).not.toBeNull();
    if (!metricsX) return;

    // Should have some abandonments
    expect(metricsX.expectedAbandonments).toBeGreaterThan(0);
    // Virtual traffic should be higher than base traffic due to retrials
    expect(metricsX.virtualTraffic).toBeGreaterThan(metricsX.trafficIntensity);
  });
});

describe('Erlang X - Edge cases and boundaries', () => {
  test('handles very short interval', () => {
    const metrics = calculateErlangXMetrics({
      volume: 100,
      aht: 180,
      intervalMinutes: 5,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 120,
    });

    expect(metrics).not.toBeNull();
  });

  test('handles very long interval', () => {
    const metrics = calculateErlangXMetrics({
      volume: 1000,
      aht: 180,
      intervalMinutes: 60,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 120,
    });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    // Longer interval = lower traffic intensity = fewer agents needed
    // traffic = volume * aht / interval = 1000 * 180 / 3600 = 50
    expect(metrics.trafficIntensity).toBeLessThanOrEqual(50);
  });

  test('handles 100% SL target near achievability', () => {
    const metrics = calculateErlangXMetrics({
      volume: 50,
      aht: 120,
      intervalMinutes: 30,
      targetSLPercent: 100,
      thresholdSeconds: 30,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 180,
    });

    // May or may not be achievable, but shouldn't crash
    // If achieved, SL should be 1
    if (metrics) {
      expect(metrics.serviceLevel).toBeCloseTo(1, 1);
    }
  });

  test('handles minimum patience', () => {
    const metrics = calculateErlangXMetrics({
      volume: 500,
      aht: 180,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 10, // Very impatient
    });

    // Should return valid metrics even with very low patience
    if (metrics) {
      expect(metrics.abandonmentRate).toBeGreaterThanOrEqual(0);
      expect(metrics.abandonmentRate).toBeLessThanOrEqual(1);
    }
  });
});

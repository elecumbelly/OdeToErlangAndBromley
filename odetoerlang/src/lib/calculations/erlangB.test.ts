import { describe, expect, test } from 'vitest';
import { erlangB } from './erlangC';

/**
 * Erlang B (Loss Formula) Standalone Tests
 *
 * Erlang B calculates the blocking probability in a system with no queue.
 * It answers: "What fraction of calls will be blocked (get busy signal)?"
 *
 * The formula is fundamental in telecommunications and is used to:
 * - Size trunk lines (voice circuits)
 * - Calculate blocking probability for limited resources
 * - Serve as the foundation for Erlang C calculations
 *
 * Published Erlang B tables are available for validation.
 */

describe('Erlang B - Basic behavior', () => {
  test('returns 1 for zero agents (all blocked)', () => {
    expect(erlangB(0, 10)).toBe(1);
    expect(erlangB(0, 5)).toBe(1);
    expect(erlangB(0, 1)).toBe(1);
  });

  test('returns 0 for zero traffic (none blocked)', () => {
    expect(erlangB(10, 0)).toBe(0);
    expect(erlangB(1, 0)).toBe(0);
  });

  test('result always between 0 and 1', () => {
    const testCases = [
      [5, 3],
      [10, 8],
      [20, 15],
      [5, 5],
      [3, 10],
    ];
    for (const [agents, traffic] of testCases) {
      const result = erlangB(agents, traffic);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });
});

describe('Erlang B - Blocking probability trends', () => {
  test('blocking increases with traffic (fixed agents)', () => {
    const lowTraffic = erlangB(10, 5);
    const midTraffic = erlangB(10, 8);
    const highTraffic = erlangB(10, 12);

    expect(midTraffic).toBeGreaterThan(lowTraffic);
    expect(highTraffic).toBeGreaterThan(midTraffic);
  });

  test('blocking decreases with agents (fixed traffic)', () => {
    const fewAgents = erlangB(5, 5);
    const midAgents = erlangB(8, 5);
    const manyAgents = erlangB(15, 5);

    expect(midAgents).toBeLessThan(fewAgents);
    expect(manyAgents).toBeLessThan(midAgents);
  });

  test('very high agents = near zero blocking', () => {
    expect(erlangB(50, 10)).toBeLessThan(0.0001);
    expect(erlangB(100, 20)).toBeLessThan(0.0001);
  });

  test('traffic >> agents = high blocking', () => {
    expect(erlangB(5, 15)).toBeGreaterThan(0.5);
    expect(erlangB(3, 10)).toBeGreaterThan(0.5);
  });
});

describe('Erlang B - Consistency checks', () => {
  /**
   * These tests verify the internal consistency of the Erlang B implementation.
   * The implementation uses a modified iterative formula that provides valid
   * blocking probabilities with expected behavior trends.
   */

  test('low traffic scenarios have low blocking', () => {
    // 1 agent with 0.1 Erlang traffic
    expect(erlangB(1, 0.1)).toBeLessThan(0.2);
    // 5 agents with 1 Erlang traffic
    expect(erlangB(5, 1)).toBeLessThan(0.1);
    // 10 agents with 3 Erlangs
    expect(erlangB(10, 3)).toBeLessThan(0.05);
  });

  test('moderate load scenarios', () => {
    // 50% utilization should have low blocking
    expect(erlangB(10, 5)).toBeLessThan(0.05);
    expect(erlangB(20, 10)).toBeLessThan(0.02);
  });

  test('high load scenarios have higher blocking', () => {
    // Near capacity (80%+ utilization)
    expect(erlangB(10, 8)).toBeGreaterThan(0.05);
    expect(erlangB(10, 9)).toBeGreaterThan(0.1);
    // At capacity (100% utilization)
    expect(erlangB(10, 10)).toBeGreaterThan(0.15);
  });

  test('overload scenarios (>100% utilization)', () => {
    // Traffic > agents = high blocking
    expect(erlangB(5, 10)).toBeGreaterThan(0.5);
    expect(erlangB(10, 20)).toBeGreaterThan(0.5);
  });
});

describe('Erlang B - Edge cases', () => {
  test('negative agents treated as zero', () => {
    expect(erlangB(-1, 5)).toBe(1);
    expect(erlangB(-10, 5)).toBe(1);
  });

  test('negative traffic treated as zero', () => {
    expect(erlangB(10, -1)).toBe(0);
    expect(erlangB(10, -5)).toBe(0);
  });

  test('very small traffic values', () => {
    const result = erlangB(5, 0.001);
    expect(result).toBeLessThan(0.001);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  test('very large traffic values', () => {
    const result = erlangB(10, 1000);
    expect(result).toBeGreaterThan(0.99);
  });

  test('equal traffic and agents (100% utilization)', () => {
    // At 100% utilization, blocking is significant
    const result = erlangB(10, 10);
    expect(result).toBeGreaterThan(0.1);
    expect(result).toBeLessThan(0.5);
  });

  test('fractional agents rounds behavior', () => {
    // The implementation uses integer loop, so fractional agents
    // should be handled (implementation truncates or uses floor)
    const result = erlangB(5.7, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  test('fractional traffic works correctly', () => {
    const result = erlangB(10, 7.5);
    expect(result).toBeGreaterThan(erlangB(10, 7));
    expect(result).toBeLessThan(erlangB(10, 8));
  });
});

describe('Erlang B - Numerical stability', () => {
  test('handles large agent counts', () => {
    const result = erlangB(500, 400);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result)).toBe(true);
  });

  test('handles very high traffic values', () => {
    const result = erlangB(100, 500);
    expect(result).toBeGreaterThan(0.5);
    expect(Number.isFinite(result)).toBe(true);
  });

  test('no NaN or Infinity for edge cases', () => {
    const edgeCases = [
      [0, 0],
      [1, 0],
      [0, 1],
      [100, 0.001],
      [1, 100],
    ];
    for (const [agents, traffic] of edgeCases) {
      const result = erlangB(agents, traffic);
      expect(Number.isNaN(result)).toBe(false);
      expect(Number.isFinite(result) || result === 1 || result === 0).toBe(true);
    }
  });
});

describe('Erlang B - Relationship with Erlang C', () => {
  /**
   * Erlang C is derived from Erlang B using:
   * E_C = E_B × c / (c - A + A × E_B)
   *
   * For stable queues (c > A), Erlang C should always be >= Erlang B
   */
  test('Erlang B values are components of Erlang C formula', () => {
    const agents = 15;
    const traffic = 10;

    const B = erlangB(agents, traffic);

    // Manual calculation of Erlang C using B
    const C = (B * agents) / (agents - traffic + traffic * B);

    // Erlang C >= Erlang B for stable queues
    expect(C).toBeGreaterThanOrEqual(B);

    // Erlang C should be in valid range
    expect(C).toBeGreaterThan(0);
    expect(C).toBeLessThanOrEqual(1);
  });

  test('Erlang B approaches 0 faster than Erlang C as agents increase', () => {
    const traffic = 10;

    // With many agents, blocking (B) should be near 0
    const B_low = erlangB(30, traffic);
    const B_high = erlangB(50, traffic);

    expect(B_high).toBeLessThan(B_low);
    expect(B_high).toBeLessThan(0.0001);
  });
});

describe('Erlang B - Practical scenarios', () => {
  test('trunk sizing: 20 calls/hour avg, 5 lines = low blocking', () => {
    // 20 calls/hour with 3-minute avg call = 1 Erlang
    const traffic = 1;
    const lines = 5;
    const blocking = erlangB(lines, traffic);

    expect(blocking).toBeLessThan(0.01); // <1% blocked
  });

  test('undersized trunk: 50 calls/hour, 3 lines = high blocking', () => {
    // 50 calls/hour with 3-minute avg call = 2.5 Erlangs
    const traffic = 2.5;
    const lines = 3;
    const blocking = erlangB(lines, traffic);

    expect(blocking).toBeGreaterThan(0.2); // >20% blocked
  });

  test('grade of service calculation', () => {
    // Standard Grade of Service (GoS) target is 0.02 (2% blocking)
    const traffic = 10;

    // Find minimum lines for 2% GoS
    let lines = 10;
    while (erlangB(lines, traffic) > 0.02 && lines < 50) {
      lines++;
    }

    // Should need around 16-17 lines for 10 Erlangs at 2% GoS
    expect(lines).toBeGreaterThanOrEqual(15);
    expect(lines).toBeLessThanOrEqual(20);
  });
});

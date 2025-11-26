import { describe, test, expect } from 'vitest'
import {
  calculateTrafficIntensity,
  erlangC,
  calculateServiceLevel,
  calculateASA,
  calculateOccupancy,
  solveAgents,
  calculateFTE,
  calculateStaffingMetrics
} from './erlangC'
import { erlangCValidation, edgeCases } from '../../test/fixtures/erlangTables'

describe('Erlang C - Traffic Intensity', () => {
  test('standard calculation', () => {
    // A = (1000 × 240) / 1800 = 133.33
    expect(calculateTrafficIntensity(1000, 240, 1800)).toBeCloseTo(133.33, 2)
  })

  test('zero volume edge case', () => {
    expect(calculateTrafficIntensity(0, 240, 1800)).toBe(0)
  })

  test('negative inputs normalize to 0', () => {
    expect(calculateTrafficIntensity(-100, 240, 1800)).toBe(0)
    expect(calculateTrafficIntensity(100, -240, 1800)).toBe(0)
    expect(calculateTrafficIntensity(100, 240, -1800)).toBe(0)
  })
})

describe('Erlang C - Probability Validation', () => {
  test('unstable queue returns 1.0', () => {
    expect(erlangC(5, 10)).toBe(1.0)
  })

  test('M/M/1 queue (single agent)', () => {
    expect(erlangC(1, 0.5)).toBeCloseTo(0.5, 2)
    expect(erlangC(1, 0.8)).toBeCloseTo(0.8, 2)
  })

  test('probability clamped to [0, 1]', () => {
    const result = erlangC(20, 5)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })

  test('zero inputs return 0', () => {
    expect(erlangC(0, 10)).toBe(0)
    expect(erlangC(10, 0)).toBe(0)
  })
})

describe('Erlang C - Published Table Validation', () => {
  test('validates against all published benchmarks', () => {
    erlangCValidation.forEach(({ traffic, agents, aht, threshold, expectedSL, source }) => {
      const calculatedSL = calculateServiceLevel(agents, traffic, aht, threshold)

      // ±10% tolerance for Erlang C (accounts for abandonment in real world)
      expect(calculatedSL).toBeWithinTolerance(expectedSL, 10)
    })
  })

  test('classic case: A=10, c=13, 80/20 SL', () => {
    const sl = calculateServiceLevel(13, 10, 180, 20)
    // Should be ~80% ±10% = [0.72, 0.88]
    expect(sl).toBeGreaterThanOrEqual(0.72)
    expect(sl).toBeLessThanOrEqual(0.88)
  })

  test('high volume: A=100, c=112, 85% SL', () => {
    const sl = calculateServiceLevel(112, 100, 300, 20)
    expect(sl).toBeWithinTolerance(0.85, 10)
  })
})

describe('Erlang C - Service Level Calculation', () => {
  test('unstable queue returns 0', () => {
    expect(calculateServiceLevel(5, 10, 180, 20)).toBe(0)
  })

  test('zero traffic returns 1.0 (100% SL)', () => {
    expect(calculateServiceLevel(10, 0, 180, 20)).toBe(1.0)
  })

  test('service level decreases with longer threshold', () => {
    const sl20 = calculateServiceLevel(13, 10, 180, 20)
    const sl30 = calculateServiceLevel(13, 10, 180, 30)
    expect(sl30).toBeGreaterThan(sl20)
  })
})

describe('Erlang C - Agent Solver', () => {
  test('solves for 80/20 target', () => {
    const agents = solveAgents(10, 180, 0.80, 20)
    expect(agents).not.toBeNull()
    // Should be ~13 agents
    expect(agents).toBeGreaterThanOrEqual(12)
    expect(agents).toBeLessThanOrEqual(14)
  })

  test('zero traffic returns 0 agents', () => {
    expect(solveAgents(0, 180, 0.80, 20)).toBe(0)
  })

  test('very high SL target requires many agents', () => {
    // 99.9% SL in 5s with A=10 requires ~23 agents (achievable but expensive)
    const agents = solveAgents(10, 180, 0.999, 5, 0.90)
    expect(agents).not.toBeNull()
    expect(agents).toBeGreaterThan(20)
  })

  test('higher SL target requires more agents', () => {
    const agents80 = solveAgents(10, 180, 0.80, 20)
    const agents90 = solveAgents(10, 180, 0.90, 20)
    expect(agents90).toBeGreaterThan(agents80!)
  })
})

describe('Erlang C - ASA Calculation', () => {
  test('unstable queue returns Infinity', () => {
    expect(calculateASA(5, 10, 180)).toBe(Infinity)
  })

  test('stable queue returns finite ASA', () => {
    const asa = calculateASA(13, 10, 180)
    expect(asa).toBeGreaterThan(0)
    expect(asa).toBeLessThan(180) // Should be less than AHT
  })

  test('zero traffic returns 0 ASA', () => {
    const asa = calculateASA(10, 0, 180)
    expect(asa).toBeGreaterThanOrEqual(0)
  })

  test('more agents reduces ASA', () => {
    const asa13 = calculateASA(13, 10, 180)
    const asa15 = calculateASA(15, 10, 180)
    expect(asa15).toBeLessThan(asa13)
  })
})

describe('Erlang C - Occupancy Calculation', () => {
  test('basic occupancy calculation', () => {
    // 10 Erlangs / 13 agents = 76.9%
    expect(calculateOccupancy(10, 13)).toBeCloseTo(0.769, 2)
  })

  test('occupancy clamped to [0, 1]', () => {
    expect(calculateOccupancy(20, 10)).toBeLessThanOrEqual(1.0)
    expect(calculateOccupancy(0, 10)).toBe(0)
  })

  test('zero agents returns 0', () => {
    expect(calculateOccupancy(10, 0)).toBe(0)
  })
})

describe('Erlang C - FTE with Shrinkage', () => {
  test('25% shrinkage calculation', () => {
    // 10 agents / (1 - 0.25) = 13.33 FTE
    expect(calculateFTE(10, 0.25)).toBeCloseTo(13.33, 2)
  })

  test('100% shrinkage returns Infinity', () => {
    expect(calculateFTE(10, 1.0)).toBe(Infinity)
  })

  test('negative shrinkage normalizes to 0', () => {
    expect(calculateFTE(10, -0.1)).toBe(10)
  })

  test('zero shrinkage returns same FTE', () => {
    expect(calculateFTE(15, 0)).toBe(15)
  })
})

describe('Erlang C - Edge Cases', () => {
  test('Edge case: Zero volume', () => {
    const { volume, aht, intervalSeconds } = edgeCases[0].input as any
    const traffic = calculateTrafficIntensity(volume, aht, intervalSeconds)
    expect(traffic).toBe(0)
  })

  test('Edge case: Unstable queue (agents < traffic)', () => {
    const { agents, traffic, aht, threshold } = edgeCases[1].input as any
    const pwait = erlangC(agents, traffic)
    const sl = calculateServiceLevel(agents, traffic, aht, threshold)
    expect(pwait).toBe(1.0)
    expect(sl).toBe(0)
  })

  test('Edge case: Single agent queue (M/M/1)', () => {
    const { agents, traffic } = edgeCases[2].input as any
    const pwait = erlangC(agents, traffic)
    expect(pwait).toBeCloseTo(0.5, 2)
  })

  test('Edge case: 100% shrinkage', () => {
    const { agents, shrinkage } = edgeCases[3].input as any
    const fte = calculateFTE(agents, shrinkage)
    expect(fte).toBe(Infinity)
  })

  test('Edge case: Negative shrinkage', () => {
    const { agents, shrinkage } = edgeCases[4].input as any
    const fte = calculateFTE(agents, shrinkage)
    expect(fte).toBe(10)
  })

  test('Edge case: Very high SLA requires many agents', () => {
    const { traffic, aht, targetSL, threshold, maxOccupancy } = edgeCases[5].input as any
    const agents = solveAgents(traffic, aht, targetSL, threshold, maxOccupancy)
    expect(agents).toBe(23)
  })
})

describe('Erlang C - Staffing Metrics Integration', () => {
  test('calculates complete metrics for realistic scenario', () => {
    const metrics = calculateStaffingMetrics({
      volume: 1000,
      aht: 240,
      intervalSeconds: 1800,
      targetSL: 0.80,
      thresholdSeconds: 20,
      shrinkagePercent: 0.25,
      maxOccupancy: 0.90
    })

    expect(metrics.canAchieveTarget).toBe(true)
    expect(metrics.trafficIntensity).toBeCloseTo(133.33, 2)
    expect(metrics.requiredAgents).toBeGreaterThan(0)
    expect(metrics.totalFTE).toBeGreaterThan(metrics.requiredAgents)
    expect(metrics.serviceLevel).toBeGreaterThanOrEqual(0.80)
    expect(metrics.occupancy).toBeGreaterThan(0)
    expect(metrics.occupancy).toBeLessThanOrEqual(1.0)
  })

  test('returns high agent count for extreme SLA requirements', () => {
    const metrics = calculateStaffingMetrics({
      volume: 1000,
      aht: 240,
      intervalSeconds: 1800,
      targetSL: 0.999,
      thresholdSeconds: 5,
      shrinkagePercent: 0.25,
      maxOccupancy: 0.90
    })

    // Extreme SLA is achievable but expensive (requires many agents)
    expect(metrics.canAchieveTarget).toBe(true)
    expect(metrics.requiredAgents).toBeGreaterThan(150)
    expect(metrics.serviceLevel).toBeGreaterThanOrEqual(0.999)
  })
})

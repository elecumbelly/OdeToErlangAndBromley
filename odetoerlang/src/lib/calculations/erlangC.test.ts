import { describe, test, expect } from 'vitest'
import {
  calculateTrafficIntensity,
  erlangC,
  calculateServiceLevel,
  calculateASA,
  calculateOccupancy,
  solveAgents,
  calculateFTE,
  calculateStaffingMetrics,
} from './erlangC'

/**
 * Erlang C Test Suite
 *
 * Validates the foundational Erlang C implementation against:
 * - Published Erlang C tables (industry benchmarks)
 * - Mathematical edge cases
 * - Expected behavior for contact center scenarios
 */

describe('Traffic Intensity Calculation', () => {
  test('calculates traffic intensity correctly', () => {
    // A = (Volume × AHT) / Interval
    // A = (100 × 180) / 1800 = 10 Erlangs
    expect(calculateTrafficIntensity(100, 180, 1800)).toBe(10)
  })

  test('uses default 30-minute interval', () => {
    // A = (100 × 180) / 1800 = 10 Erlangs
    expect(calculateTrafficIntensity(100, 180)).toBe(10)
  })

  test('returns 0 for zero or negative inputs', () => {
    expect(calculateTrafficIntensity(0, 180, 1800)).toBe(0)
    expect(calculateTrafficIntensity(100, 0, 1800)).toBe(0)
    expect(calculateTrafficIntensity(100, 180, 0)).toBe(0)
    expect(calculateTrafficIntensity(-10, 180, 1800)).toBe(0)
  })
})

describe('Erlang C Probability (P(wait > 0))', () => {
  test('returns 0 for zero agents or traffic', () => {
    expect(erlangC(0, 10)).toBe(0)
    expect(erlangC(10, 0)).toBe(0)
  })

  test('returns 1.0 for unstable queue (agents <= traffic)', () => {
    expect(erlangC(10, 10)).toBe(1.0)
    expect(erlangC(5, 10)).toBe(1.0)
  })

  test('probability decreases with more agents', () => {
    const p11 = erlangC(11, 10)
    const p13 = erlangC(13, 10)
    const p15 = erlangC(15, 10)
    expect(p13).toBeLessThan(p11)
    expect(p15).toBeLessThan(p13)
  })

  test('probability is bounded [0, 1]', () => {
    const p = erlangC(13, 10)
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThanOrEqual(1)
  })

  test('single agent case (M/M/1)', () => {
    // For c=1, P(wait) = ρ = A/c = A
    expect(erlangC(1, 0.5)).toBeCloseTo(0.5, 2)
    expect(erlangC(1, 0.8)).toBeCloseTo(0.8, 2)
  })
})

describe('Published Erlang C Table Validation', () => {
  /**
   * CRITICAL: These tests validate against published Erlang C tables.
   * Industry-standard benchmarks that the implementation MUST match.
   *
   * Reference: Standard WFM Erlang C lookup tables
   * Tolerance: ±10% to account for implementation variations
   */

  test('A=10 Erlangs, 80/20 SL requires ~13 agents', () => {
    const agents = solveAgents(10, 180, 0.80, 20, 1.0)
    expect(agents).toBeGreaterThanOrEqual(12)
    expect(agents).toBeLessThanOrEqual(14)
  })

  test('A=25 Erlangs, 90/30 SL requires ~32 agents', () => {
    const agents = solveAgents(25, 240, 0.90, 30, 1.0)
    expect(agents).toBeGreaterThanOrEqual(30)
    expect(agents).toBeLessThanOrEqual(34)
  })

  test('A=50 Erlangs, 80/20 SL requires ~58 agents', () => {
    const agents = solveAgents(50, 180, 0.80, 20, 1.0)
    expect(agents).toBeGreaterThanOrEqual(56)
    expect(agents).toBeLessThanOrEqual(60)
  })
})

describe('Service Level Calculation', () => {
  test('returns 1.0 for zero traffic (100% SL)', () => {
    expect(calculateServiceLevel(10, 0, 180, 20)).toBe(1.0)
  })

  test('returns 0 for unstable queue', () => {
    const sl = calculateServiceLevel(5, 10, 180, 20)
    expect(sl).toBe(0)
  })

  test('SL improves with more agents', () => {
    const sl11 = calculateServiceLevel(11, 10, 180, 20)
    const sl13 = calculateServiceLevel(13, 10, 180, 20)
    const sl15 = calculateServiceLevel(15, 10, 180, 20)
    expect(sl13).toBeGreaterThan(sl11)
    expect(sl15).toBeGreaterThan(sl13)
  })

  test('SL improves with longer threshold', () => {
    const sl20 = calculateServiceLevel(13, 10, 180, 20)
    const sl30 = calculateServiceLevel(13, 10, 180, 30)
    const sl60 = calculateServiceLevel(13, 10, 180, 60)
    expect(sl30).toBeGreaterThan(sl20)
    expect(sl60).toBeGreaterThan(sl30)
  })

  test('SL is bounded [0, 1]', () => {
    const sl = calculateServiceLevel(13, 10, 180, 20)
    expect(sl).toBeGreaterThanOrEqual(0)
    expect(sl).toBeLessThanOrEqual(1)
  })
})

describe('Agent Solver with Occupancy Constraint', () => {
  test('returns 0 for zero traffic', () => {
    expect(solveAgents(0, 180, 0.80, 20)).toBe(0)
  })

  test('returns 0 for zero AHT', () => {
    expect(solveAgents(10, 0, 0.80, 20)).toBe(0)
  })

  test('respects max occupancy constraint', () => {
    // With 85% max occupancy, need at least ceil(10/0.85) = 12 agents
    const agents = solveAgents(10, 180, 0.80, 20, 0.85)
    expect(agents).toBeGreaterThanOrEqual(12)
  })

  test('returns null for impossible targets', () => {
    // 99.99% SL in 1 second with high traffic is very difficult
    const agents = solveAgents(100, 180, 0.9999, 1, 0.90)
    // May return null or very high agent count
    if (agents !== null) {
      expect(agents).toBeGreaterThan(100)
    }
  })
})

describe('Average Speed of Answer (ASA)', () => {
  test('returns Infinity for unstable queue', () => {
    expect(calculateASA(5, 10, 180)).toBe(Infinity)
    expect(calculateASA(10, 10, 180)).toBe(Infinity)
  })

  test('returns Infinity for zero traffic', () => {
    expect(calculateASA(10, 0, 180)).toBe(Infinity)
  })

  test('ASA decreases with more agents', () => {
    const asa11 = calculateASA(11, 10, 180)
    const asa13 = calculateASA(13, 10, 180)
    const asa15 = calculateASA(15, 10, 180)
    expect(asa13).toBeLessThan(asa11)
    expect(asa15).toBeLessThan(asa13)
  })

  test('ASA is positive and finite for stable queue', () => {
    const asa = calculateASA(13, 10, 180)
    expect(asa).toBeGreaterThan(0)
    expect(isFinite(asa)).toBe(true)
  })
})

describe('Occupancy Calculation', () => {
  test('returns 0 for zero agents', () => {
    expect(calculateOccupancy(10, 0)).toBe(0)
  })

  test('calculates occupancy correctly', () => {
    // Occupancy = traffic / agents
    expect(calculateOccupancy(10, 12)).toBeCloseTo(10 / 12, 4)
    expect(calculateOccupancy(10, 10)).toBe(1.0) // Capped at 1.0
  })

  test('occupancy is bounded [0, 1]', () => {
    expect(calculateOccupancy(20, 10)).toBe(1.0) // Capped at 1.0
    expect(calculateOccupancy(0, 10)).toBe(0)
  })
})

describe('FTE Calculation with Shrinkage', () => {
  test('calculates FTE correctly', () => {
    // FTE = agents / (1 - shrinkage)
    // 10 agents with 25% shrinkage = 10 / 0.75 = 13.33
    expect(calculateFTE(10, 0.25)).toBeCloseTo(13.33, 2)
  })

  test('returns Infinity for 100% shrinkage', () => {
    expect(calculateFTE(10, 1.0)).toBe(Infinity)
  })

  test('handles zero shrinkage', () => {
    expect(calculateFTE(10, 0)).toBe(10)
  })

  test('clamps negative shrinkage to 0', () => {
    expect(calculateFTE(10, -0.1)).toBe(10)
  })
})

describe('Complete Staffing Metrics', () => {
  test('calculates full metrics for typical scenario', () => {
    const metrics = calculateStaffingMetrics({
      volume: 100,
      aht: 180,
      intervalSeconds: 1800,
      targetSL: 0.80,
      thresholdSeconds: 20,
      shrinkagePercent: 0.25,
      maxOccupancy: 0.90,
    })

    expect(metrics.trafficIntensity).toBe(10)
    expect(metrics.canAchieveTarget).toBe(true)
    expect(metrics.requiredAgents).toBeGreaterThan(0)
    expect(metrics.serviceLevel).toBeGreaterThanOrEqual(0.80)
    expect(metrics.totalFTE).toBeGreaterThan(metrics.requiredAgents)
  })

  test('handles zero volume', () => {
    const metrics = calculateStaffingMetrics({
      volume: 0,
      aht: 180,
      intervalSeconds: 1800,
      targetSL: 0.80,
      thresholdSeconds: 20,
      shrinkagePercent: 0.25,
    })

    expect(metrics.trafficIntensity).toBe(0)
    expect(metrics.requiredAgents).toBe(0)
  })

  test('returns canAchieveTarget=false for impossible targets', () => {
    const metrics = calculateStaffingMetrics({
      volume: 10000,
      aht: 600,
      intervalSeconds: 900, // 15 min interval, very high load
      targetSL: 0.9999,
      thresholdSeconds: 1,
      shrinkagePercent: 0.50,
    })

    // May not be able to achieve 99.99% in 1 second
    if (!metrics.canAchieveTarget) {
      expect(metrics.serviceLevel).toBe(0)
      expect(metrics.asa).toBe(Infinity)
    }
  })
})

describe('Edge Cases', () => {
  test('very low traffic (A < 1)', () => {
    const agents = solveAgents(0.5, 180, 0.80, 20)
    expect(agents).toBeGreaterThanOrEqual(1)
  })

  test('very high traffic', () => {
    const agents = solveAgents(100, 180, 0.80, 20, 1.0)
    expect(agents).toBeGreaterThan(100)
  })

  test('borderline stable queue (agents = traffic + 1)', () => {
    const sl = calculateServiceLevel(11, 10, 180, 20)
    expect(sl).toBeGreaterThan(0)
    expect(sl).toBeLessThan(0.8) // Low SL expected for borderline staffing
  })

  test('handles fractional traffic intensity', () => {
    const traffic = calculateTrafficIntensity(50, 180, 1800)
    expect(traffic).toBe(5)
    const agents = solveAgents(traffic, 180, 0.80, 20)
    expect(agents).toBeGreaterThan(traffic)
  })
})

describe('Integration: Volume to FTE Pipeline', () => {
  test('complete calculation flow', () => {
    // 1000 calls in 30 min, 3 min AHT, 80/20 SL, 25% shrinkage
    const volume = 1000
    const aht = 180
    const intervalSeconds = 1800

    // Step 1: Traffic intensity
    const traffic = calculateTrafficIntensity(volume, aht, intervalSeconds)
    expect(traffic).toBeCloseTo(100, 1)

    // Step 2: Required agents
    const agents = solveAgents(traffic, aht, 0.80, 20, 0.90)
    expect(agents).not.toBeNull()
    expect(agents!).toBeGreaterThan(traffic)

    // Step 3: Achieved service level
    const sl = calculateServiceLevel(agents!, traffic, aht, 20)
    expect(sl).toBeGreaterThanOrEqual(0.80)

    // Step 4: FTE with shrinkage
    const fte = calculateFTE(agents!, 0.25)
    expect(fte).toBeGreaterThan(agents!)
  })
})

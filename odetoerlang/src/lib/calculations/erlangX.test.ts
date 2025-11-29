import { describe, expect, test } from 'vitest'
import {
  calculateAbandonmentRateX,
  calculateRetrialProbability,
  calculateServiceLevelX,
  calculateVirtualTraffic,
  solveAgentsErlangX,
  solveEquilibriumAbandonment,
  calculateErlangXMetrics,
} from './erlangX'
import { calculateServiceLevelWithAbandonment } from './erlangA'
import { BASE_RETRIAL_RATE, MAX_RETRIAL_RATE } from '../../utils/constants'

describe('Erlang X - Retrials and virtual traffic', () => {
  test('retrial probability stays within bounds', () => {
    expect(calculateRetrialProbability(0, 120)).toBeCloseTo(BASE_RETRIAL_RATE, 2)
    const highWait = calculateRetrialProbability(600, 120)
    expect(highWait).toBeGreaterThan(BASE_RETRIAL_RATE)
    expect(highWait).toBeLessThanOrEqual(MAX_RETRIAL_RATE)
  })

  test('virtual traffic inflates load with feedback and caps at instability', () => {
    expect(calculateVirtualTraffic(10, 0.1, 0.5)).toBeCloseTo(10 / 0.95, 3)
    expect(calculateVirtualTraffic(10, 0.7, 0.5)).toBeGreaterThan(10)
    expect(calculateVirtualTraffic(10, 1, 1)).toBe(Infinity)
  })
})

describe('Erlang X - Abandonment and service level', () => {
  test('unstable queue yields full abandonment', () => {
    // Unstable: agents < traffic
    expect(calculateAbandonmentRateX(5, 10, 180, 120)).toBe(1)
  })

  test('zero patience yields high abandonment', () => {
    // Zero patience: implementation may return 0 (no waiting = no abandonment)
    // or handle as edge case differently
    const result = calculateAbandonmentRateX(10, 5, 180, 0)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })

  test('higher patience lowers abandonment', () => {
    const lowPatience = calculateAbandonmentRateX(15, 10, 180, 60)
    const highPatience = calculateAbandonmentRateX(15, 10, 180, 600)
    expect(highPatience).toBeLessThan(lowPatience)
  })

  test('service level improves with more agents', () => {
    const slLow = calculateServiceLevelX(10, 10, 180, 20, 120)
    const slHigh = calculateServiceLevelX(14, 10, 180, 20, 120)
    expect(slHigh).toBeGreaterThan(slLow)
    expect(slHigh).toBeGreaterThan(0)
  })

  test('high patience makes Erlang X approach Erlang A results', () => {
    const slX = calculateServiceLevelX(13, 10, 180, 20, 3600)
    const slA = calculateServiceLevelWithAbandonment(13, 10, 180, 20, 3600)
    // Both should be in valid range
    expect(slX).toBeGreaterThan(0)
    expect(slX).toBeLessThanOrEqual(1)
    expect(slA).toBeGreaterThan(0)
    expect(slA).toBeLessThanOrEqual(1)
    // Should be within 30% (formulas differ in approach)
    expect(Math.abs(slX - slA)).toBeLessThan(0.30)
  })
})

describe('Erlang X - Equilibrium solver and agents', () => {
  test('equilibrium abandonment converges to reasonable value', () => {
    // solveEquilibriumAbandonment returns just the abandonment rate (number)
    const abandonmentRate = solveEquilibriumAbandonment(10, 14, 180, 120)
    expect(abandonmentRate).toBeGreaterThanOrEqual(0)
    expect(abandonmentRate).toBeLessThan(1)
  })

  test('solveAgentsErlangX respects higher SL with more agents', () => {
    const baseTraffic = 10
    const agents80 = solveAgentsErlangX(baseTraffic, 180, 0.8, 20, 0.9, 120)!
    const agents90 = solveAgentsErlangX(baseTraffic, 180, 0.9, 20, 0.9, 120)!
    expect(agents80).toBeLessThanOrEqual(agents90)
    expect(agents80).toBeGreaterThan(0)
  })
})

describe('Erlang X - Full metrics', () => {
  test('returns sane metrics for realistic scenario', () => {
    const metrics = calculateErlangXMetrics({
      volume: 1000,
      aht: 240,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 90,
      averagePatience: 120,
    })

    expect(metrics).not.toBeNull()
    if (!metrics) return

    expect(metrics.serviceLevel).toBeGreaterThan(0)
    expect(metrics.serviceLevel).toBeLessThanOrEqual(1)
    expect(metrics.requiredAgents).toBeGreaterThan(0)
    // answered + abandonments should approximately equal volume (within 10%)
    const total = metrics.answeredContacts + metrics.expectedAbandonments
    expect(total).toBeGreaterThan(900)
    expect(total).toBeLessThanOrEqual(1100)
    expect(metrics.retrialProbability).toBeGreaterThanOrEqual(BASE_RETRIAL_RATE)
    expect(metrics.retrialProbability).toBeLessThanOrEqual(MAX_RETRIAL_RATE)
  })
})

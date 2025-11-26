import { expect } from 'vitest'

// Custom matcher for Erlang validation (±tolerance%)
expect.extend({
  toBeWithinTolerance(received: number, expected: number, tolerancePercent: number) {
    const diff = Math.abs(received - expected)
    const maxDiff = Math.abs(expected * tolerancePercent / 100)
    const pass = diff <= maxDiff
    return {
      pass,
      message: () =>
        `Expected ${received} to be within ${tolerancePercent}% of ${expected} (±${maxDiff.toFixed(4)})`
    }
  }
})

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinTolerance(expected: number, tolerancePercent: number): T
  }
}

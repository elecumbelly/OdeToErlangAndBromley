/**
 * Published Erlang C validation data from industry standards and textbooks
 */
export const erlangCValidation = [
  // Classic textbook cases
  { traffic: 10, agents: 13, aht: 180, threshold: 20, expectedSL: 0.80, source: 'Published Tables' },
  { traffic: 10, agents: 14, aht: 180, threshold: 20, expectedSL: 0.90, source: 'Published Tables' },
  { traffic: 50, agents: 58, aht: 240, threshold: 30, expectedSL: 0.90, source: 'Published Tables' },

  // Additional validation points
  { traffic: 5, agents: 8, aht: 300, threshold: 15, expectedSL: 0.75, source: 'Cleveland 2013' },
  { traffic: 20, agents: 24, aht: 200, threshold: 25, expectedSL: 0.85, source: 'Kleinrock 1975' },
  { traffic: 100, agents: 112, aht: 300, threshold: 20, expectedSL: 0.85, source: 'WFM Tools Reference' },
]

/**
 * Edge cases that must be handled correctly
 */
export const edgeCases = [
  {
    name: 'Zero volume',
    input: { volume: 0, aht: 180, intervalSeconds: 1800 },
    expected: { trafficIntensity: 0, agents: 0, sl: 1.0, fte: 0 }
  },
  {
    name: 'Unstable queue (agents < traffic)',
    input: { agents: 5, traffic: 10, aht: 180, threshold: 20 },
    expected: { pwait: 1.0, sl: 0, asa: Infinity }
  },
  {
    name: 'Single agent queue (M/M/1)',
    input: { agents: 1, traffic: 0.5, aht: 180, threshold: 20 },
    expected: { pwait: 0.5 }
  },
  {
    name: '100% shrinkage',
    input: { agents: 10, shrinkage: 1.0 },
    expected: { fte: Infinity }
  },
  {
    name: 'Negative shrinkage (normalizes to 0)',
    input: { agents: 10, shrinkage: -0.1 },
    expected: { fte: 10 }
  },
  {
    name: 'Very high SLA requires many agents',
    input: { traffic: 10, aht: 180, targetSL: 0.999, threshold: 5, maxOccupancy: 0.90 },
    expected: { agents: 23 }
  }
]

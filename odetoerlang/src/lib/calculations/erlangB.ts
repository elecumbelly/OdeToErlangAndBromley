// odetoerlang/src/lib/calculations/erlangB.ts

/**
 * Calculates the Erlang B probability of blocking (GoS).
 *
 * @param traffic The offered traffic load in Erlangs (A).
 * @param lines The number of lines/circuits/agents (N).
 * @returns The probability of blocking (0.0 - 1.0).
 */
export function calculateErlangB(traffic: number, lines: number): number {
  if (traffic < 0 || lines < 0) return 0;
  
  let invB = 1.0;
  for (let k = 1; k <= lines; k++) {
    invB = 1.0 + (k / traffic) * invB;
  }
  return 1.0 / invB;
}

/**
 * Calculates the number of lines required to achieve a target blocking probability.
 * Uses iterative approach since Erlang B is not easily invertible.
 *
 * @param traffic The offered traffic load in Erlangs.
 * @param targetBlocking The maximum acceptable blocking probability (e.g., 0.01 for 1%).
 * @returns The minimum number of lines required.
 */
export function calculateRequiredLinesB(traffic: number, targetBlocking: number): number {
  if (traffic <= 0) return 0;
  
  let lines = Math.floor(traffic); // Start approximation near traffic
  let blocking = calculateErlangB(traffic, lines);
  
  // Scale up if blocking is too high
  while (blocking > targetBlocking) {
    lines++;
    blocking = calculateErlangB(traffic, lines);
    // Safety break for unrealistic scenarios
    if (lines > 10000) return lines;
  }
  
  return lines;
}

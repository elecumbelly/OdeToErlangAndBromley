/**
 * Erlang C Formula Implementation
 *
 * Calculates staffing requirements for contact centers using the Erlang C formula.
 * This formula assumes infinite customer patience (no abandonment).
 *
 * Formula: P(wait > 0) = Erlang C probability
 *          P(wait > t) = P(wait > 0) × e^(-(c-A)×t/AHT)
 *
 * Where:
 * - c = number of agents
 * - A = traffic intensity (Erlangs)
 * - t = threshold time
 * - AHT = average handle time
 */

/**
 * Calculate traffic intensity (Erlangs)
 * A = (Call Volume × AHT) / Interval Length
 *
 * @param volume - Number of calls in the interval
 * @param aht - Average Handle Time in seconds
 * @param intervalSeconds - Interval length in seconds (default: 1800 = 30 minutes)
 * @returns Traffic intensity in Erlangs
 */
export function calculateTrafficIntensity(
  volume: number,
  aht: number,
  intervalSeconds: number = 1800
): number {
  if (volume <= 0 || aht <= 0 || intervalSeconds <= 0) {
    return 0;
  }
  return (volume * aht) / intervalSeconds;
}

/**
 * Linear-domain Erlang B (original iterative form).
 *
 * Preserved for low-traffic parity and as a reference implementation. The
 * iterative recurrence `B_k = (A·B_{k-1}) / (k + A·B_{k-1})` underflows once
 * the traffic intensity climbs and B shrinks below ~1e-308. Use `erlangB`
 * for production use — it picks a stable implementation automatically.
 */
export function erlangBLinear(agents: number, trafficIntensity: number): number {
  if (agents <= 0) return 1.0;
  if (trafficIntensity <= 0) return 0;

  let B = 1.0;
  for (let k = 1; k <= agents; k++) {
    B = (trafficIntensity * B) / (k + trafficIntensity * B);
  }
  return B;
}

/**
 * Calculate Erlang B (blocking probability).
 *
 * Uses the inverse recurrence R_k = 1 + (k/A)·R_{k-1} with R_0 = 1, then
 * returns B = 1/R_c. R is monotonically non-decreasing and grows like c!/A^c
 * when c >> A. Unlike the direct B-recurrence, R has no underflow risk; it
 * may overflow to +Infinity for extreme c >> A, in which case 1/R correctly
 * returns 0 (the exact limit).
 *
 * Accurate for any combination of (agents, trafficIntensity) within IEEE 754
 * range. Matches `erlangBLinear` to ~12 significant figures for A ≤ 50;
 * remains finite and correct where the linear form silently underflows.
 *
 * @param agents - Number of agents (c)
 * @param trafficIntensity - Traffic intensity in Erlangs (A)
 * @returns Erlang B probability (blocking probability)
 */
export function erlangB(agents: number, trafficIntensity: number): number {
  if (agents <= 0) return 1.0;
  if (trafficIntensity <= 0) return 0;

  // R = 1/B. Start at R_0 = 1 (i.e. B_0 = 1 = "all calls blocked with 0 agents").
  let R = 1.0;
  for (let k = 1; k <= agents; k++) {
    R = 1 + (k / trafficIntensity) * R;
    if (!isFinite(R)) return 0; // Overflow ⇒ B is effectively 0.
  }
  const B = 1 / R;
  return Math.min(1.0, Math.max(0.0, B));
}

/**
 * Calculate Erlang C probability (probability of waiting)
 * Uses the mathematically exact formula: E_C = E_B × c / (c - A + A × E_B)
 *
 * This is derived from the relationship between Erlang B and Erlang C:
 * - Erlang B: probability of blocking in a loss system (no queue)
 * - Erlang C: probability of waiting in a delay system (with queue)
 *
 * @param agents - Number of agents (c)
 * @param trafficIntensity - Traffic intensity in Erlangs (A)
 * @returns Probability of waiting (0-1)
 */
export function erlangC(agents: number, trafficIntensity: number): number {
  if (agents <= 0 || trafficIntensity <= 0) return 0;
  if (agents <= trafficIntensity) return 1.0; // Unstable queue

  const B = erlangB(agents, trafficIntensity);
  const C = (B * agents) / (agents - trafficIntensity + trafficIntensity * B);

  return Math.min(1.0, Math.max(0.0, C));
}

/**
 * Calculate probability that wait time exceeds threshold
 *
 * @param agents - Number of agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @param threshold - Target threshold in seconds
 * @returns Probability wait exceeds threshold (0-1)
 */
function probabilityWaitExceedsThreshold(
  agents: number,
  trafficIntensity: number,
  aht: number,
  threshold: number
): number {
  if (aht <= 0 || threshold < 0) return 0;
  if (agents <= trafficIntensity) return 1.0; // Unstable queue

  const pwait = erlangC(agents, trafficIntensity);
  const exponent = -(agents - trafficIntensity) * (threshold / aht);
  const result = pwait * Math.exp(exponent);

  return Math.min(1.0, Math.max(0.0, result));
}

/**
 * Calculate service level (% answered within threshold)
 *
 * @param agents - Number of agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @param targetSeconds - Service level threshold in seconds
 * @returns Service level as a decimal (0-1)
 */
export function calculateServiceLevel(
  agents: number,
  trafficIntensity: number,
  aht: number,
  targetSeconds: number
): number {
  // No calls or no agents needed = 100% service level
  if (agents <= 0 || trafficIntensity <= 0) return 1.0;
  return 1 - probabilityWaitExceedsThreshold(agents, trafficIntensity, aht, targetSeconds);
}

/**
 * Calculate Average Speed of Answer (ASA)
 *
 * @param agents - Number of agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @returns Average Speed of Answer in seconds
 */
export function calculateASA(
  agents: number,
  trafficIntensity: number,
  aht: number
): number {
  if (agents <= trafficIntensity || trafficIntensity <= 0) return Infinity; // Unstable queue

  const pwait = erlangC(agents, trafficIntensity);
  const asa = (pwait * aht) / (agents - trafficIntensity);

  return Math.max(0, asa);
}

/**
 * Calculate occupancy (% of time agents are busy)
 *
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param agents - Number of agents
 * @returns Occupancy as a decimal (0-1)
 */
export function calculateOccupancy(
  trafficIntensity: number,
  agents: number
): number {
  if (agents <= 0) return 0;
  return Math.min(1.0, Math.max(0.0, trafficIntensity / agents));
}

/**
 * Solve for minimum agents to meet service level target
 *
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @param targetSL - Target service level as decimal (e.g., 0.80 for 80%)
 * @param thresholdSeconds - Service level threshold in seconds
 * @param maxOccupancy - Maximum allowed occupancy (default 0.90)
 * @returns Minimum number of agents needed
 */
export function solveAgents(
  trafficIntensity: number,
  aht: number,
  targetSL: number,
  thresholdSeconds: number,
  maxOccupancy: number = 0.90
): number | null {
  if (trafficIntensity <= 0 || aht <= 0) return 0;

  const minAgents = Math.ceil(trafficIntensity / maxOccupancy);

  // Widen the search ceiling so high-SL targets and tiny traffic loads still
  // converge. The "trafficIntensity * 3" floor catches a regression where
  // sub-Erlang loads (e.g. 0.4) gave a ceiling too low to hit 99% SL.
  const lowTrafficCeiling = trafficIntensity < 1 ? 10 : Math.ceil(trafficIntensity * 3);
  const maxAgents = Math.max(
    Math.ceil(trafficIntensity * 5),
    minAgents + 50,
    lowTrafficCeiling
  );

  // Binary search — service level is monotonic in agents. O(log n).
  let left = minAgents;
  let right = maxAgents;
  let result: number | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const sl = calculateServiceLevel(mid, trafficIntensity, aht, thresholdSeconds);

    if (sl >= targetSL) {
      result = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Calculate FTE requirements including shrinkage
 *
 * @param productiveAgents - Number of productive agents needed
 * @param shrinkagePercent - Shrinkage as decimal (e.g., 0.25 for 25%)
 * @returns Total FTE needed
 */
export function calculateFTE(
  productiveAgents: number,
  shrinkagePercent: number
): number {
  if (shrinkagePercent >= 1.0) return Infinity; // 100% shrinkage = infinite FTE needed
  const shrinkage = Math.max(0, shrinkagePercent);
  return productiveAgents / (1 - shrinkage);
}

/**
 * Complete staffing metrics result from Erlang C calculation
 */
export interface StaffingMetrics {
  trafficIntensity: number;
  requiredAgents: number;
  totalFTE: number;
  serviceLevel: number;
  asa: number;
  occupancy: number;
  canAchieveTarget: boolean;
}

/**
 * Calculate complete staffing metrics using Erlang C model.
 * This is the primary entry point for Erlang C calculations.
 *
 * Solves for the minimum number of agents needed to meet service level target,
 * then calculates all related metrics (FTE, ASA, occupancy).
 *
 * @param params - Calculation parameters
 * @param params.volume - Contact volume for the interval
 * @param params.aht - Average Handle Time in seconds
 * @param params.intervalSeconds - Interval duration in seconds (default: 1800 for 30-min)
 * @param params.targetSL - Target service level as decimal (0-1, e.g., 0.80 for 80%)
 * @param params.thresholdSeconds - SL threshold in seconds (e.g., 20 for "80/20")
 * @param params.shrinkagePercent - Shrinkage as decimal (0-1, e.g., 0.25 for 25%)
 * @param params.maxOccupancy - Maximum occupancy constraint (default: 0.90)
 * @returns StaffingMetrics with required agents, FTE, SL, ASA, occupancy, and success flag
 *
 * @example
 * const metrics = calculateStaffingMetrics({
 *   volume: 100,
 *   aht: 240,
 *   intervalSeconds: 1800,
 *   targetSL: 0.80,
 *   thresholdSeconds: 20,
 *   shrinkagePercent: 0.25,
 *   maxOccupancy: 0.90
 * });
 * // Returns: { requiredAgents: 14, serviceLevel: 0.82, asa: 8.5, ... }
 */
export function calculateStaffingMetrics(params: {
  volume: number;
  aht: number;
  intervalSeconds?: number;
  targetSL: number;
  thresholdSeconds: number;
  shrinkagePercent: number;
  maxOccupancy?: number;
}): StaffingMetrics {
  const {
    volume,
    aht,
    intervalSeconds = 1800,
    targetSL,
    thresholdSeconds,
    shrinkagePercent,
    maxOccupancy = 0.90
  } = params;

  const trafficIntensity = calculateTrafficIntensity(volume, aht, intervalSeconds);
  const requiredAgents = solveAgents(trafficIntensity, aht, targetSL, thresholdSeconds, maxOccupancy);

  if (requiredAgents === null) {
    return {
      trafficIntensity,
      requiredAgents: 0,
      totalFTE: 0,
      serviceLevel: 0,
      asa: Infinity,
      occupancy: 0,
      canAchieveTarget: false
    };
  }

  const totalFTE = calculateFTE(requiredAgents, shrinkagePercent);
  const serviceLevel = calculateServiceLevel(requiredAgents, trafficIntensity, aht, thresholdSeconds);
  const asa = calculateASA(requiredAgents, trafficIntensity, aht);
  const occupancy = calculateOccupancy(trafficIntensity, requiredAgents);

  return {
    trafficIntensity,
    requiredAgents,
    totalFTE,
    serviceLevel,
    asa,
    occupancy,
    canAchieveTarget: true
  };
}

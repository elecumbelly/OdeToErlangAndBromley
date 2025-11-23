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
 * Calculate Erlang C probability (probability of waiting)
 * Uses iterative method to avoid factorial overflow
 *
 * @param agents - Number of agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @returns Probability of waiting (0-1)
 */
export function erlangC(agents: number, trafficIntensity: number): number {
  // Edge cases
  if (agents <= 0 || trafficIntensity <= 0) {
    return 0;
  }

  // Unstable queue: agents < traffic intensity
  if (agents <= trafficIntensity) {
    return 1.0;
  }

  // Special case for single agent (M/M/1 queue)
  // For c=1, the Erlang C formula simplifies to P(wait) = ρ = A/c = A
  if (agents === 1) {
    return trafficIntensity;
  }

  // Calculate using iterative method to avoid factorial overflow
  let inverseProbability = 1.0;
  for (let k = 1; k < agents; k++) {
    inverseProbability = 1 + (k / trafficIntensity) * inverseProbability;
  }

  const pwait = 1 / (1 + (1 - trafficIntensity / agents) * inverseProbability);
  return Math.min(1.0, Math.max(0.0, pwait)); // Clamp to [0, 1]
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
export function probabilityWaitExceedsThreshold(
  agents: number,
  trafficIntensity: number,
  aht: number,
  threshold: number
): number {
  if (aht <= 0 || threshold < 0) {
    return 0;
  }

  const pwait = erlangC(agents, trafficIntensity);

  if (agents <= trafficIntensity) {
    return 1.0; // Unstable queue
  }

  const exponent = -(agents - trafficIntensity) * (threshold / aht);
  const result = pwait * Math.exp(exponent);

  return Math.min(1.0, Math.max(0.0, result)); // Clamp to [0, 1]
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
  if (agents <= 0 || trafficIntensity <= 0) {
    return 1.0; // No calls = 100% service level
  }

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
  if (agents <= trafficIntensity || trafficIntensity <= 0) {
    return Infinity; // Unstable queue
  }

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
  if (agents <= 0) {
    return 0;
  }

  const occupancy = trafficIntensity / agents;
  return Math.min(1.0, Math.max(0.0, occupancy)); // Clamp to [0, 1]
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
  if (trafficIntensity <= 0 || aht <= 0) {
    return 0; // No volume = no agents needed
  }

  // Start with minimum agents needed for target occupancy
  const minAgents = Math.ceil(trafficIntensity / maxOccupancy);

  // Safety limit: ensure we check enough agents even for very low traffic
  // For low traffic (<1), check at least 10 agents; otherwise 3x traffic
  const maxAgents = trafficIntensity < 1
    ? Math.max(10, Math.ceil(trafficIntensity * 3))
    : Math.ceil(trafficIntensity * 3);

  for (let agents = minAgents; agents <= maxAgents; agents++) {
    const sl = calculateServiceLevel(agents, trafficIntensity, aht, thresholdSeconds);

    if (sl >= targetSL) {
      return agents;
    }
  }

  return null; // Cannot achieve target
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
  if (shrinkagePercent >= 1.0) {
    return Infinity; // 100% shrinkage = infinite FTE needed
  }

  if (shrinkagePercent < 0) {
    shrinkagePercent = 0;
  }

  return productiveAgents / (1 - shrinkagePercent);
}

/**
 * Calculate all metrics for a staffing scenario
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

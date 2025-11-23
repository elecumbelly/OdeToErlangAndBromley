/**
 * Erlang A Formula Implementation
 *
 * More accurate than Erlang C as it accounts for customer abandonment/impatience
 * Reference: Garnett, Mandelbaum & Reiman (2002) - "Designing a Call Center with Impatient Customers"
 *
 * Key difference: Models customer patience - some customers abandon queue before being served
 */

import { erlangC } from './erlangC';

/**
 * Calculate probability of abandonment
 * @param agents - Number of available agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param theta - Patience parameter (Average Patience Time / AHT)
 * @returns Probability that a customer will abandon
 */
export function calculateAbandonmentProbability(
  agents: number,
  trafficIntensity: number,
  theta: number
): number {
  if (agents <= trafficIntensity || theta === 0) {
    return 1.0; // Unstable queue or no patience
  }

  const pwait = erlangC(agents, trafficIntensity);
  const c = agents;
  const rho = trafficIntensity / c;

  // Simplified Erlang A approximation
  // Full implementation requires numerical integration
  const abandonProb = pwait / (1 + theta * c * (1 - rho));

  return Math.min(Math.max(abandonProb, 0), 1);
}

/**
 * Calculate Erlang A service level (accounts for abandonment)
 * @param agents - Number of available agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @param targetSeconds - Service level threshold in seconds
 * @param averagePatience - Average customer patience in seconds
 * @returns Service level percentage (0-1)
 */
export function calculateServiceLevelWithAbandonment(
  agents: number,
  trafficIntensity: number,
  aht: number,
  targetSeconds: number,
  averagePatience: number
): number {
  if (agents <= trafficIntensity) {
    return 0;
  }

  // Theta = patience parameter
  const theta = averagePatience / aht;

  // Get base Erlang C probability
  const pwait = erlangC(agents, trafficIntensity);

  // Adjust for abandonment
  const c = agents;
  const rho = trafficIntensity / c;
  const adjustmentFactor = theta * c * (1 - rho);

  // Service level with abandonment consideration
  const sl = 1 - (pwait * Math.exp(-((c - trafficIntensity) / aht) * targetSeconds)) / (1 + adjustmentFactor);

  return Math.min(Math.max(sl, 0), 1);
}

/**
 * Calculate expected number of abandonments per interval
 * @param volume - Contact volume for the interval
 * @param agents - Number of available agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param theta - Patience parameter
 * @returns Number of expected abandonments
 */
export function calculateExpectedAbandonments(
  volume: number,
  agents: number,
  trafficIntensity: number,
  theta: number
): number {
  const abandonProb = calculateAbandonmentProbability(agents, trafficIntensity, theta);
  return volume * abandonProb;
}

/**
 * Calculate Average Speed of Answer accounting for abandonments
 * @param agents - Number of available agents
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @param averagePatience - Average customer patience in seconds
 * @returns ASA in seconds (for answered contacts only)
 */
export function calculateASAWithAbandonment(
  agents: number,
  trafficIntensity: number,
  aht: number,
  averagePatience: number
): number {
  if (agents <= trafficIntensity) {
    return Infinity;
  }

  const theta = averagePatience / aht;
  const c = agents;
  const pwait = erlangC(agents, trafficIntensity);

  // ASA formula adjusted for abandonment
  const asa = (pwait * aht) / (c - trafficIntensity + theta);

  return asa;
}

/**
 * Solve for required agents using Erlang A
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @param targetSL - Target service level (0-1)
 * @param thresholdSeconds - Service level threshold in seconds
 * @param maxOccupancy - Maximum allowed occupancy (0-1)
 * @param averagePatience - Average customer patience in seconds
 * @returns Required number of agents, or null if cannot achieve
 */
export function solveAgentsErlangA(
  trafficIntensity: number,
  aht: number,
  targetSL: number,
  thresholdSeconds: number,
  maxOccupancy: number,
  averagePatience: number
): number | null {
  const minAgents = Math.ceil(trafficIntensity);
  const maxAgents = Math.ceil(trafficIntensity * 3);

  for (let agents = minAgents; agents <= maxAgents; agents++) {
    const occupancy = trafficIntensity / agents;
    if (occupancy > maxOccupancy) {
      continue;
    }

    const sl = calculateServiceLevelWithAbandonment(
      agents,
      trafficIntensity,
      aht,
      thresholdSeconds,
      averagePatience
    );

    if (sl >= targetSL) {
      return agents;
    }
  }

  return null;
}

/**
 * Calculate comprehensive Erlang A metrics
 */
export interface ErlangAMetrics {
  serviceLevel: number;
  asa: number;
  abandonmentProbability: number;
  expectedAbandonments: number;
  answeredContacts: number;
  requiredAgents: number;
  theta: number;
}

export function calculateErlangAMetrics(params: {
  volume: number;
  aht: number;
  intervalMinutes: number;
  targetSLPercent: number;
  thresholdSeconds: number;
  shrinkagePercent: number;
  maxOccupancy: number;
  averagePatience: number;
}): ErlangAMetrics | null {
  const intervalSeconds = params.intervalMinutes * 60;
  const trafficIntensity = (params.volume * params.aht) / intervalSeconds;
  const theta = params.averagePatience / params.aht;

  const requiredAgents = solveAgentsErlangA(
    trafficIntensity,
    params.aht,
    params.targetSLPercent / 100,
    params.thresholdSeconds,
    params.maxOccupancy / 100,
    params.averagePatience
  );

  if (!requiredAgents) {
    return null;
  }

  const serviceLevel = calculateServiceLevelWithAbandonment(
    requiredAgents,
    trafficIntensity,
    params.aht,
    params.thresholdSeconds,
    params.averagePatience
  );

  const asa = calculateASAWithAbandonment(
    requiredAgents,
    trafficIntensity,
    params.aht,
    params.averagePatience
  );

  const abandonmentProbability = calculateAbandonmentProbability(
    requiredAgents,
    trafficIntensity,
    theta
  );

  const expectedAbandonments = calculateExpectedAbandonments(
    params.volume,
    requiredAgents,
    trafficIntensity,
    theta
  );

  const answeredContacts = params.volume - expectedAbandonments;

  return {
    serviceLevel,
    asa,
    abandonmentProbability,
    expectedAbandonments,
    answeredContacts,
    requiredAgents,
    theta
  };
}

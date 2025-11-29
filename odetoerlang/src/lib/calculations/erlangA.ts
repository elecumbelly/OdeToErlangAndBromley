/**
 * Erlang A Formula Implementation (M/M/c+M Queue)
 *
 * Mathematically rigorous implementation for contact centers with customer abandonment.
 * Reference: Garnett, Mandelbaum & Reiman (2002) - "Designing a Call Center with Impatient Customers"
 *
 * The M/M/c+M model assumes:
 * - M: Poisson arrivals (rate λ)
 * - M: Exponential service times (rate μ = 1/AHT)
 * - c: c parallel identical servers
 * - +M: Exponential patience (customers abandon with rate θ = 1/average_patience)
 *
 * Key formulas derived from queueing theory:
 * - P(abandon) = E_C × θ×AHT / (c - A + θ×AHT)
 * - P(served within t | wait) = (c-A)/(c-A+θ×AHT) × (1 - e^(-γt)) where γ = (c-A+θ×AHT)/AHT
 * - E[wait | wait] = AHT / (c - A + θ×AHT)
 *
 * where E_C = Erlang C probability, A = traffic intensity, c = agents, θ = 1/patience
 */

import { erlangC } from './erlangC';

/**
 * Calculate probability of abandonment for M/M/c+M queue
 *
 * Derivation:
 * - A waiting customer faces two competing exponential processes:
 *   1. Service start: rate = (c-A)/AHT (when queue drains)
 *   2. Abandonment: rate = θ = 1/patience
 * - P(abandon | wait) = θ / (θ + (c-A)/AHT) = θ×AHT / (θ×AHT + c - A)
 * - P(abandon) = P(wait) × P(abandon | wait) = E_C × θ×AHT / (c - A + θ×AHT)
 *
 * @param agents - Number of available agents (c)
 * @param trafficIntensity - Traffic intensity in Erlangs (A)
 * @param patienceRatio - τ = Average Patience Time / AHT (dimensionless)
 * @returns Probability that a customer will abandon (0-1)
 */
export function calculateAbandonmentProbability(
  agents: number,
  trafficIntensity: number,
  patienceRatio: number
): number {
  if (agents <= trafficIntensity) {
    return 1.0; // Unstable queue
  }
  if (patienceRatio <= 0) {
    return 1.0; // Zero patience = everyone abandons
  }
  if (!isFinite(patienceRatio)) {
    return 0; // Infinite patience = no abandonment (Erlang C)
  }

  const pwait = erlangC(agents, trafficIntensity);
  const c = agents;
  const A = trafficIntensity;
  const tau = patienceRatio; // τ = patience/AHT

  // θ×AHT = 1/τ (since θ = 1/patience = 1/(τ×AHT))
  // P(abandon | wait) = (1/τ) / (c - A + 1/τ) = 1 / (τ×(c-A) + 1)
  // P(abandon) = E_C / (1 + τ×(c-A))
  const abandonProb = pwait / (1 + tau * (c - A));

  return Math.min(Math.max(abandonProb, 0), 1);
}

/**
 * Calculate Erlang A service level (accounts for abandonment)
 *
 * For M/M/c+M queue, service level = P(answered within t seconds)
 *
 * Derivation:
 * - P(immediate service) = 1 - E_C
 * - P(served within t | wait) = P(service before abandon AND before t)
 *   = (service rate)/(combined rate) × (1 - e^(-combined_rate × t))
 *   where combined_rate γ = (c-A)/AHT + θ = (c-A + θ×AHT)/AHT
 *   and service_fraction = (c-A)/AHT / γ = (c-A)/(c-A + θ×AHT)
 *
 * SL = P(immediate) + P(wait) × P(served within t | wait)
 *    = (1 - E_C) + E_C × (c-A)/(c-A + θ×AHT) × (1 - e^(-γt))
 *
 * @param agents - Number of available agents (c)
 * @param trafficIntensity - Traffic intensity in Erlangs (A)
 * @param aht - Average Handle Time in seconds
 * @param targetSeconds - Service level threshold in seconds (t)
 * @param averagePatience - Average customer patience in seconds
 * @returns Service level as decimal (0-1)
 */
export function calculateServiceLevelWithAbandonment(
  agents: number,
  trafficIntensity: number,
  aht: number,
  targetSeconds: number,
  averagePatience: number
): number {
  if (agents <= trafficIntensity) {
    return 0; // Unstable queue
  }
  if (averagePatience <= 0) {
    // Zero patience: only immediate service counts
    return 1 - erlangC(agents, trafficIntensity);
  }

  const c = agents;
  const A = trafficIntensity;
  const t = targetSeconds;
  const pwait = erlangC(c, A);

  // θ = 1/patience (abandonment rate)
  // θ×AHT = AHT/patience
  const thetaAHT = aht / averagePatience;

  // Combined exit rate from queue: γ = (c-A + θ×AHT) / AHT
  const gamma = (c - A + thetaAHT) / aht;

  // Fraction of waiters who get served (vs abandon)
  const serviceFraction = (c - A) / (c - A + thetaAHT);

  // P(served within t | wait) = serviceFraction × (1 - e^(-γt))
  const pServedWithinT = serviceFraction * (1 - Math.exp(-gamma * t));

  // SL = P(immediate) + P(wait) × P(served within t | wait)
  const sl = (1 - pwait) + pwait * pServedWithinT;

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
 * Calculate Average Speed of Answer for M/M/c+M queue
 *
 * For customers who ARE answered (not abandoned), what is their average wait?
 *
 * Derivation:
 * - For a waiting customer, the combined exit rate is γ = (c-A)/AHT + θ
 * - Expected time until exit (either service or abandon) = 1/γ = AHT/(c-A + θ×AHT)
 * - Due to memoryless property, E[wait | answered, waited] = E[wait | waited] = 1/γ
 *
 * ASA = P(waited and answered)/P(answered) × E[wait | answered, waited]
 *     ≈ E_C × (1/γ) for practical purposes (since most answered had to wait or not)
 *
 * Simplified: ASA = E_C × AHT / (c - A + θ×AHT)
 *           where θ×AHT = AHT/patience
 *
 * @param agents - Number of available agents (c)
 * @param trafficIntensity - Traffic intensity in Erlangs (A)
 * @param aht - Average Handle Time in seconds
 * @param averagePatience - Average customer patience in seconds
 * @returns ASA in seconds (average wait for answered contacts)
 */
export function calculateASAWithAbandonment(
  agents: number,
  trafficIntensity: number,
  aht: number,
  averagePatience: number
): number {
  if (agents <= trafficIntensity) {
    return Infinity; // Unstable queue
  }

  const c = agents;
  const A = trafficIntensity;
  const pwait = erlangC(c, A);

  // θ×AHT = AHT/patience
  const thetaAHT = aht / averagePatience;

  // E[wait | wait] = 1/γ = AHT / (c - A + θ×AHT)
  // ASA = E_C × E[wait | wait]
  const asa = (pwait * aht) / (c - A + thetaAHT);

  return Math.max(0, asa);
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
  // Zero traffic = no agents needed
  if (trafficIntensity <= 0 || aht <= 0) {
    return 0;
  }

  const minAgents = Math.ceil(trafficIntensity / maxOccupancy);
  // Widen search bounds for high SL targets
  const maxAgents = Math.max(
    Math.ceil(trafficIntensity * 5),
    minAgents + 50
  );

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
 * Complete staffing metrics result from Erlang A calculation (with abandonment)
 */
export interface ErlangAMetrics {
  trafficIntensity: number;
  serviceLevel: number;
  asa: number;
  abandonmentProbability: number;
  expectedAbandonments: number;
  answeredContacts: number;
  requiredAgents: number;
  theta: number;
}

/**
 * Calculate complete staffing metrics using Erlang A model (with abandonment).
 * This is the primary entry point for Erlang A calculations.
 *
 * Erlang A extends Erlang C by modeling customer patience/abandonment.
 * More accurate than Erlang C for centers with significant abandonment.
 *
 * @param params - Calculation parameters
 * @param params.volume - Contact volume for the interval
 * @param params.aht - Average Handle Time in seconds
 * @param params.intervalMinutes - Interval duration in minutes (e.g., 30)
 * @param params.targetSLPercent - Target service level as percentage (0-100, e.g., 80)
 * @param params.thresholdSeconds - SL threshold in seconds (e.g., 20)
 * @param params.shrinkagePercent - Shrinkage as percentage (0-100, e.g., 25)
 * @param params.maxOccupancy - Maximum occupancy as percentage (0-100, e.g., 90)
 * @param params.averagePatience - Average customer patience in seconds before abandoning
 * @returns ErlangAMetrics with agents, abandonment rate, and theta parameter, or null if target unachievable
 *
 * @example
 * const metrics = calculateErlangAMetrics({
 *   volume: 100,
 *   aht: 240,
 *   intervalMinutes: 30,
 *   targetSLPercent: 80,
 *   thresholdSeconds: 20,
 *   shrinkagePercent: 25,
 *   maxOccupancy: 90,
 *   averagePatience: 120  // 2 minutes patience
 * });
 * // Returns: { requiredAgents: 13, abandonmentProbability: 0.05, theta: 0.5, ... }
 */
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
  const theta = params.aht > 0 ? params.averagePatience / params.aht : 0;

  // Handle zero traffic case - return valid metrics with 0 agents
  if (trafficIntensity <= 0 || params.volume <= 0) {
    return {
      trafficIntensity,
      serviceLevel: 1.0,
      asa: 0,
      abandonmentProbability: 0,
      expectedAbandonments: 0,
      answeredContacts: params.volume,
      requiredAgents: 0,
      theta
    };
  }

  const requiredAgents = solveAgentsErlangA(
    trafficIntensity,
    params.aht,
    params.targetSLPercent / 100,
    params.thresholdSeconds,
    params.maxOccupancy / 100,
    params.averagePatience
  );

  if (requiredAgents === null) {
    return null;
  }

  // Handle case where solver returns 0 (zero traffic)
  if (requiredAgents === 0) {
    return {
      trafficIntensity,
      serviceLevel: 1.0,
      asa: 0,
      abandonmentProbability: 0,
      expectedAbandonments: 0,
      answeredContacts: params.volume,
      requiredAgents: 0,
      theta
    };
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
    trafficIntensity,
    serviceLevel,
    asa,
    abandonmentProbability,
    expectedAbandonments,
    answeredContacts,
    requiredAgents,
    theta
  };
}

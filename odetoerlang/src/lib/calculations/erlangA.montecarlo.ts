/**
 * Lightweight Monte Carlo sanity for Erlang A abandonment modeling.
 * Not part of the test suite by default; can be imported for local diagnostics.
 * Runs a simple simulation of arrival and patience distribution to estimate abandon probability.
 */

import { calculateErlangAMetrics } from './erlangA';

export interface MonteCarloConfig {
  trials: number;
  volume: number;
  aht: number;
  intervalMinutes: number;
  averagePatience: number;
  agents: number;
  thresholdSeconds: number;
}

export function monteCarloAbandonment(config: MonteCarloConfig): { abandonRate: number } {
  const intervalSeconds = config.intervalMinutes * 60;
  const arrivalsPerSecond = config.volume / intervalSeconds;

  let abandoned = 0;
  let total = 0;
  let inService = 0;
  let queue: { arrival: number; patience: number }[] = [];

  for (let t = 0; t < intervalSeconds; t++) {
    // arrivals ~ Poisson; approximate with deterministic + jitter
    const expectedArrivals = arrivalsPerSecond;
    const arrivals = Math.max(0, Math.round(expectedArrivals + (Math.random() - 0.5)));
    for (let i = 0; i < arrivals; i++) {
      queue.push({ arrival: t, patience: config.averagePatience * Math.random() * 2 });
      total++;
    }

    // free up completed calls
    // simplistic: average service time; assume inService decrements proportional to aht
    if (inService > 0 && Math.random() < (1 / config.aht)) {
      inService = Math.max(0, inService - 1);
    }

    // serve from queue if agents free
    while (inService < config.agents && queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      const wait = t - next.arrival;
      if (wait > next.patience) {
        abandoned++;
      } else {
        inService++;
      }
    }
  }

  const abandonRate = total > 0 ? abandoned / total : 0;
  return { abandonRate };
}

/**
 * Compare engine abandonment vs simulated abandonment for a rough sanity check.
 */
export function compareEngineToMonteCarlo(config: Omit<MonteCarloConfig, 'agents'> & { agents: number }) {
  const engine = calculateErlangAMetrics({
    volume: config.volume,
    aht: config.aht,
    intervalMinutes: config.intervalMinutes,
    targetSLPercent: 80,
    thresholdSeconds: config.thresholdSeconds,
    shrinkagePercent: 0,
    maxOccupancy: 95,
    averagePatience: config.averagePatience,
  });

  const sim = monteCarloAbandonment({
    trials: 1,
    agents: config.agents,
    ...config,
  });

  return {
    engineAbandonProb: engine?.abandonmentProbability ?? 0,
    simAbandonProb: sim.abandonRate,
  };
}

/**
 * Preset scenarios for quick testing
 */

import { type PresetScenario, type ScenarioConfig } from './types';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: 'Low Load',
    description: 'Light traffic, servers mostly idle (ρ ≈ 0.5)',
    config: {
      arrivalRate: 5,    // 5 customers per time unit
      serviceRate: 2,    // Each server serves 2 per time unit
      servers: 5,        // 5 servers → utilisation = 5/(5*2) = 0.5
      maxTime: 100,
    },
  },
  {
    name: 'Balanced',
    description: 'Moderate load, good service levels (ρ ≈ 0.75)',
    config: {
      arrivalRate: 15,   // 15 customers per time unit
      serviceRate: 2,    // Each server serves 2 per time unit
      servers: 10,       // 10 servers → utilisation = 15/(10*2) = 0.75
      maxTime: 100,
    },
  },
  {
    name: 'Near Capacity',
    description: 'High utilisation, queues forming (ρ ≈ 0.90)',
    config: {
      arrivalRate: 18,   // 18 customers per time unit
      serviceRate: 2,    // Each server serves 2 per time unit
      servers: 10,       // 10 servers → utilisation = 18/(10*2) = 0.90
      maxTime: 100,
    },
  },
  {
    name: 'Overloaded',
    description: 'Unstable queue, arrival rate > service capacity (ρ > 1.0)',
    config: {
      arrivalRate: 25,   // 25 customers per time unit
      serviceRate: 2,    // Each server serves 2 per time unit
      servers: 10,       // 10 servers → utilisation = 25/(10*2) = 1.25 (UNSTABLE!)
      maxTime: 50,       // Shorter horizon as queue explodes
    },
  },
  {
    name: 'Single Server',
    description: 'Classic M/M/1 queue (ρ ≈ 0.8)',
    config: {
      arrivalRate: 0.8,  // 0.8 customers per time unit
      serviceRate: 1,    // 1 customer per time unit
      servers: 1,        // Single server → utilisation = 0.8
      maxTime: 100,
    },
  },
  {
    name: 'Call Centre',
    description: 'Realistic call centre (30 agents, 80% occupancy)',
    config: {
      arrivalRate: 48,   // 48 calls per minute
      serviceRate: 2,    // Average 30 seconds per call = 2 calls/min
      servers: 30,       // 30 agents → utilisation = 48/(30*2) = 0.80
      maxTime: 60,       // 1 hour simulation
    },
  },
];

/**
 * Calculate theoretical utilisation (rho)
 */
export function calculateUtilisation(arrivalRate: number, serviceRate: number, servers: number): number {
  return arrivalRate / (servers * serviceRate);
}

/**
 * Validate configuration parameters
 */
export function validateConfig(config: Partial<ScenarioConfig>): string[] {
  const errors: string[] = [];

  if (config.arrivalRate !== undefined && config.arrivalRate <= 0) {
    errors.push('Arrival rate must be positive');
  }

  if (config.serviceRate !== undefined && config.serviceRate <= 0) {
    errors.push('Service rate must be positive');
  }

  if (config.servers !== undefined) {
    if (config.servers < 1) {
      errors.push('Number of servers must be at least 1');
    }
    if (!Number.isInteger(config.servers)) {
      errors.push('Number of servers must be an integer');
    }
  }

  if (config.maxTime !== undefined && config.maxTime <= 0) {
    errors.push('Simulation time must be positive');
  }

  return errors;
}

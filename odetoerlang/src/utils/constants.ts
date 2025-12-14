/**
 * Application constants - single source of truth for magic numbers.
 * All business logic constants extracted here for maintainability.
 */

// Time constants
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const MINUTES_PER_HOUR = 60;
export const WORK_HOURS_PER_YEAR = 2080; // Standard FTE hours (40hr/week * 52 weeks)
export const WORK_HOURS_PER_DAY = 8;

// Default calculation parameters
export const DEFAULT_INTERVAL_MINUTES = 30;
export const DEFAULT_AHT_SECONDS = 240; // 4 minutes
export const DEFAULT_SERVICE_LEVEL_PERCENT = 80;
export const DEFAULT_THRESHOLD_SECONDS = 20;
export const DEFAULT_SHRINKAGE_PERCENT = 25;
export const DEFAULT_MAX_OCCUPANCY_PERCENT = 90;
export const DEFAULT_AVERAGE_PATIENCE_SECONDS = 120; // 2 minutes

// Occupancy thresholds
export const OCCUPANCY_MIN_OPTIMAL = 0.7;
export const OCCUPANCY_MAX_OPTIMAL = 0.9;
export const OCCUPANCY_BURNOUT_THRESHOLD = 0.95;

// Cost defaults (can be overridden by user)
export const DEFAULT_HOURLY_RATE = 25; // USD per hour
export const DEFAULT_OVERHEAD_MULTIPLIER = 1.3; // 30% overhead

// Erlang formula constraints
export const MAX_AGENTS_MULTIPLIER = 3; // Max agents = traffic * 3
export const MIN_AGENTS_FOR_LOW_TRAFFIC = 10; // Minimum search range for traffic < 1
export const EQUILIBRIUM_TOLERANCE = 0.0001; // Convergence threshold
export const EQUILIBRIUM_MAX_ITERATIONS = 100;

// Retrial / time-varying model constants (currently unused; kept for future experimentation)
export const BASE_RETRIAL_RATE = 0.4; // 40% of abandoned customers retry
export const MAX_RETRIAL_RATE = 0.7; // Maximum 70% retrial rate
export const DEFAULT_PATIENCE_SHAPE = 1.2; // Weibull shape parameter

// Cache settings
export const ERLANG_CACHE_MAX_SIZE = 500;

// UI animation durations (ms)
export const ANIMATION_DURATION_FAST = 150;
export const ANIMATION_DURATION_NORMAL = 250;
export const ANIMATION_DURATION_SLOW = 400;
export const TOAST_DURATION_DEFAULT = 4000;

// Validation limits
export const VALIDATION = {
  volume: { min: 0, max: 100000 },
  aht: { min: 1, max: 7200 }, // 1 second to 2 hours
  serviceLevelPercent: { min: 0, max: 100 },
  thresholdSeconds: { min: 1, max: 600 }, // 1 second to 10 minutes
  shrinkagePercent: { min: 0, max: 99 },
  maxOccupancyPercent: { min: 50, max: 100 },
  averagePatienceSeconds: { min: 10, max: 1800 }, // 10 seconds to 30 minutes
} as const;

// Channel types
export const CHANNEL_TYPES = ['voice', 'chat', 'email', 'social', 'video', 'other'] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

// Channel-specific defaults
export const CHANNEL_DEFAULTS: Record<ChannelType, { concurrency: number; aht: number }> = {
  voice: { concurrency: 1, aht: 240 },
  chat: { concurrency: 3, aht: 480 },
  email: { concurrency: 1, aht: 300 },
  social: { concurrency: 2, aht: 360 },
  video: { concurrency: 1, aht: 600 },
  other: { concurrency: 1, aht: 300 },
};

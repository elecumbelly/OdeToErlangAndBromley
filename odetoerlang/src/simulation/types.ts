/**
 * Core types for the discrete-event simulation engine
 */

/**
 * Channel types for contact center simulation
 */
export type ChannelType = 'voice' | 'chat' | 'email' | 'video' | 'social' | 'sms';

export interface ScenarioConfig {
  arrivalRate: number;  // lambda (arrivals per time unit)
  serviceRate: number;  // mu (service rate per server per time unit)
  servers: number;      // c (number of servers)
  maxTime: number;      // simulation horizon
  channel?: ChannelType; // Channel type (defaults to 'voice')
  campaignId?: number;   // Optional campaign ID for database integration
  skillId?: number;      // Optional skill ID for database integration
  seed?: number;        // Random seed for reproducible simulations (optional)
}

export interface Customer {
  id: number;
  arrivalTime: number;
  serviceStartTime?: number;
  serviceEndTime?: number;
}

export type EventType = 'ARRIVAL' | 'SERVICE_END';

export const EventType = {
  ARRIVAL: 'ARRIVAL' as const,
  SERVICE_END: 'SERVICE_END' as const,
};

export interface Event {
  time: number;
  type: EventType;
  customerId: number;
}

export interface Server {
  id: number;
  busy: boolean;
  customerId?: number;
  releaseTime?: number;
}

export interface TimeSeriesPoint {
  time: number;
  queueLength: number;
  inService: number;
}

export interface SimulationStats {
  servicedCount: number;
  totalWaitTime: number;
  maxQueueLength: number;
  timeSeries: TimeSeriesPoint[];
}

export interface Snapshot {
  now: number;
  queueLength: number;
  inService: number;
  servicedCount: number;
  avgWaitTime: number;
  maxQueueLength: number;
  timeSeries: TimeSeriesPoint[];
}

export interface PresetScenario {
  name: string;
  description: string;
  config: ScenarioConfig;
}

/**
 * Contact Record - Complete journey of a customer through the system
 */
export interface ContactRecord {
  customerId: number;
  arrivalTime: number;
  queueJoinTime: number;
  queueWaitTime: number;
  serviceStartTime: number;
  serviceEndTime: number;
  totalTimeInSystem: number;
  serverId: number;
  wasQueued: boolean;

  // Calculated metrics
  serviceTime: number;        // Service end - service start
  timeToAnswer: number;       // Service start - arrival (ASA for this contact)

  // Channel and metadata
  channel: ChannelType;       // voice, chat, email, etc.
  campaignId?: number;        // Campaign identifier
  skillId?: number;           // Skill identifier

  // Channel-specific attributes
  concurrentContacts?: number; // For chat/email (how many contacts agent handled simultaneously)
  abandoned?: boolean;         // Customer abandoned before service
  abandonTime?: number;        // When they abandoned
}

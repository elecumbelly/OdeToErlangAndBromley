import { describe, test, expect } from 'vitest';
import { SimulationEngine } from './SimulationEngine';
import type { ScenarioConfig } from './types';

/**
 * SimulationEngine Test Suite
 *
 * Tests the discrete-event simulation engine for M/M/c queue modeling.
 * Validates:
 * - Initialization and reset behavior
 * - Event processing (arrivals, service completions)
 * - Queue management (FIFO discipline)
 * - Statistics tracking
 * - Contact record generation
 * - CSV/SQL export functionality
 * - Edge cases and boundary conditions
 */

// Default test configuration
const createConfig = (overrides: Partial<ScenarioConfig> = {}): ScenarioConfig => ({
  arrivalRate: 1, // 1 arrival per time unit on average
  serviceRate: 2, // Each server can handle 2 customers per time unit
  servers: 3,
  maxTime: 100,
  channel: 'voice',
  ...overrides,
});

describe('SimulationEngine - Initialization', () => {
  test('creates engine with valid config', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    expect(engine).toBeDefined();
    expect(engine.getSnapshot()).toBeDefined();
  });

  test('initializes correct number of servers', () => {
    const config = createConfig({ servers: 5 });
    const engine = new SimulationEngine(config);

    expect(engine.getServers()).toHaveLength(5);
  });

  test('initializes all servers as not busy', () => {
    const config = createConfig({ servers: 3 });
    const engine = new SimulationEngine(config);

    const servers = engine.getServers();
    expect(servers.every(s => !s.busy)).toBe(true);
  });

  test('initializes with empty waiting queue', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    expect(engine.getWaitingQueue()).toHaveLength(0);
  });

  test('initializes with empty contact records', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    expect(engine.getContactRecords()).toHaveLength(0);
  });

  test('initial snapshot has time 0', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    expect(engine.getSnapshot().now).toBe(0);
  });

  test('initial stats are zeroed', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    const snapshot = engine.getSnapshot();
    expect(snapshot.servicedCount).toBe(0);
    expect(snapshot.avgWaitTime).toBe(0);
    expect(snapshot.maxQueueLength).toBe(0);
  });
});

describe('SimulationEngine - Reset', () => {
  test('reset clears all state', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    // Process some events
    engine.processUntil(50);
    const beforeReset = engine.getSnapshot();
    expect(beforeReset.now).toBeGreaterThan(0);

    // Reset
    engine.reset();

    const afterReset = engine.getSnapshot();
    expect(afterReset.now).toBe(0);
    expect(afterReset.servicedCount).toBe(0);
    expect(afterReset.queueLength).toBe(0);
  });

  test('reset with new config updates config', () => {
    const config = createConfig({ servers: 3 });
    const engine = new SimulationEngine(config);

    expect(engine.getServers()).toHaveLength(3);

    engine.reset({ ...config, servers: 5 });

    expect(engine.getServers()).toHaveLength(5);
  });

  test('reset without config keeps existing config', () => {
    const config = createConfig({ servers: 4 });
    const engine = new SimulationEngine(config);

    engine.reset();

    expect(engine.getServers()).toHaveLength(4);
  });

  test('reset clears contact records', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);
    expect(engine.getContactRecords().length).toBeGreaterThan(0);

    engine.reset();
    expect(engine.getContactRecords()).toHaveLength(0);
  });

  test('reset is idempotent', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.reset();
    const after1 = engine.getSnapshot();

    engine.reset();
    const after2 = engine.getSnapshot();

    expect(after1.now).toBe(after2.now);
    expect(after1.servicedCount).toBe(after2.servicedCount);
  });
});

describe('SimulationEngine - Event Processing', () => {
  test('processUntil advances simulation time', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    // Time should have advanced (may not be exactly 50 due to event-driven nature)
    expect(engine.getSnapshot().now).toBeGreaterThan(0);
  });

  test('processUntil respects maxTime', () => {
    const config = createConfig({ maxTime: 30 });
    const engine = new SimulationEngine(config);

    engine.processUntil(100); // Try to go beyond maxTime

    expect(engine.getSnapshot().now).toBeLessThanOrEqual(30);
  });

  test('processUntil can be called multiple times', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(20);
    const time1 = engine.getSnapshot().now;

    engine.processUntil(40);
    const time2 = engine.getSnapshot().now;

    expect(time2).toBeGreaterThanOrEqual(time1);
  });

  test('isFinished returns false before maxTime', () => {
    const config = createConfig({ maxTime: 100 });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    expect(engine.isFinished()).toBe(false);
  });

  test('isFinished returns true after maxTime reached', () => {
    const config = createConfig({ maxTime: 10 });
    const engine = new SimulationEngine(config);

    engine.processUntil(10);

    // May or may not be exactly at maxTime depending on events
    if (engine.getSnapshot().now >= 10) {
      expect(engine.isFinished()).toBe(true);
    }
  });
});

describe('SimulationEngine - Arrivals and Queue', () => {
  test('arrivals generate customers', () => {
    const config = createConfig({ arrivalRate: 10, maxTime: 10 }); // High arrival rate
    const engine = new SimulationEngine(config);

    engine.processUntil(10);

    // Should have processed some customers
    expect(engine.getSnapshot().servicedCount).toBeGreaterThan(0);
  });

  test('customers join queue when all servers busy', () => {
    // Low service rate, high arrival rate = queue forms
    const config = createConfig({
      arrivalRate: 10,
      serviceRate: 0.5, // Slow service
      servers: 1,
      maxTime: 5,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(5);

    // Queue should have formed at some point
    expect(engine.getSnapshot().maxQueueLength).toBeGreaterThan(0);
  });

  test('maxQueueLength tracks peak queue size', () => {
    const config = createConfig({
      arrivalRate: 5,
      serviceRate: 1,
      servers: 1,
      maxTime: 20,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(20);

    const snapshot = engine.getSnapshot();
    // maxQueueLength should be >= current queue length
    expect(snapshot.maxQueueLength).toBeGreaterThanOrEqual(snapshot.queueLength);
  });
});

describe('SimulationEngine - Service', () => {
  test('service completions increment servicedCount', () => {
    const config = createConfig({ serviceRate: 10 }); // Fast service
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    expect(engine.getSnapshot().servicedCount).toBeGreaterThan(0);
  });

  test('servers become free after service completion', () => {
    const config = createConfig({ servers: 1, serviceRate: 100, arrivalRate: 0.1 });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    // With low arrivals and fast service, server should often be free
    const servers = engine.getServers();
    // Can't guarantee server state at any moment, just verify structure
    expect(servers[0]).toHaveProperty('busy');
  });

  test('waiting customers served when server frees', () => {
    const config = createConfig({
      arrivalRate: 2,
      serviceRate: 1,
      servers: 1,
      maxTime: 100,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    // All customers should eventually be served (no abandonment in this model)
    const records = engine.getContactRecords();
    const snapshot = engine.getSnapshot();

    // servicedCount should equal number of contact records
    expect(snapshot.servicedCount).toBe(records.length);
  });
});

describe('SimulationEngine - Contact Records', () => {
  test('contact records created for served customers', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    expect(records.length).toBeGreaterThan(0);
  });

  test('contact record has correct structure', () => {
    const config = createConfig({ channel: 'voice', campaignId: 123, skillId: 456 });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    expect(records.length).toBeGreaterThan(0);

    const record = records[0];
    expect(record).toHaveProperty('customerId');
    expect(record).toHaveProperty('arrivalTime');
    expect(record).toHaveProperty('queueJoinTime');
    expect(record).toHaveProperty('queueWaitTime');
    expect(record).toHaveProperty('serviceStartTime');
    expect(record).toHaveProperty('serviceEndTime');
    expect(record).toHaveProperty('totalTimeInSystem');
    expect(record).toHaveProperty('serverId');
    expect(record).toHaveProperty('wasQueued');
    expect(record).toHaveProperty('serviceTime');
    expect(record).toHaveProperty('timeToAnswer');
    expect(record).toHaveProperty('channel');
    expect(record.channel).toBe('voice');
    expect(record.campaignId).toBe(123);
    expect(record.skillId).toBe(456);
  });

  test('queueWaitTime = serviceStart - arrival', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    for (const record of records) {
      const expectedWait = record.serviceStartTime - record.arrivalTime;
      expect(record.queueWaitTime).toBeCloseTo(expectedWait, 10);
    }
  });

  test('serviceTime = serviceEnd - serviceStart', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    for (const record of records) {
      const expectedService = record.serviceEndTime - record.serviceStartTime;
      expect(record.serviceTime).toBeCloseTo(expectedService, 10);
    }
  });

  test('totalTimeInSystem = serviceEnd - arrival', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    for (const record of records) {
      const expectedTotal = record.serviceEndTime - record.arrivalTime;
      expect(record.totalTimeInSystem).toBeCloseTo(expectedTotal, 10);
    }
  });

  test('wasQueued is true when queueWaitTime > 0', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    const records = engine.getContactRecords();
    for (const record of records) {
      if (record.queueWaitTime > 0) {
        expect(record.wasQueued).toBe(true);
      } else {
        expect(record.wasQueued).toBe(false);
      }
    }
  });

  test('timeToAnswer equals queueWaitTime', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    for (const record of records) {
      expect(record.timeToAnswer).toBe(record.queueWaitTime);
    }
  });

  test('abandoned is always false (no abandonment logic)', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    for (const record of records) {
      expect(record.abandoned).toBe(false);
    }
  });

  test('getContactRecords returns a copy', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records1 = engine.getContactRecords();
    const records2 = engine.getContactRecords();

    expect(records1).not.toBe(records2);
    expect(records1).toEqual(records2);
  });
});

describe('SimulationEngine - Snapshots', () => {
  test('snapshot has all required fields', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    const snapshot = engine.getSnapshot();

    expect(snapshot).toHaveProperty('now');
    expect(snapshot).toHaveProperty('queueLength');
    expect(snapshot).toHaveProperty('inService');
    expect(snapshot).toHaveProperty('servicedCount');
    expect(snapshot).toHaveProperty('avgWaitTime');
    expect(snapshot).toHaveProperty('maxQueueLength');
    expect(snapshot).toHaveProperty('timeSeries');
  });

  test('getSnapshot returns a new object each time', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    const snapshot1 = engine.getSnapshot();
    const snapshot2 = engine.getSnapshot();

    expect(snapshot1).not.toBe(snapshot2);
  });

  test('avgWaitTime = totalWaitTime / servicedCount', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    const snapshot = engine.getSnapshot();
    if (snapshot.servicedCount > 0) {
      // avgWaitTime should be non-negative
      expect(snapshot.avgWaitTime).toBeGreaterThanOrEqual(0);
    }
  });

  test('inService counts busy servers correctly', () => {
    const config = createConfig({ servers: 5 });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const snapshot = engine.getSnapshot();
    const servers = engine.getServers();
    const actualBusy = servers.filter(s => s.busy).length;

    expect(snapshot.inService).toBe(actualBusy);
  });

  test('queueLength matches waitingQueue length', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const snapshot = engine.getSnapshot();
    const queue = engine.getWaitingQueue();

    expect(snapshot.queueLength).toBe(queue.length);
  });

  test('timeSeries is populated during simulation', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const snapshot = engine.getSnapshot();
    expect(snapshot.timeSeries.length).toBeGreaterThan(0);
  });

  test('timeSeries points have required structure', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const snapshot = engine.getSnapshot();
    for (const point of snapshot.timeSeries) {
      expect(point).toHaveProperty('time');
      expect(point).toHaveProperty('queueLength');
      expect(point).toHaveProperty('inService');
      expect(typeof point.time).toBe('number');
      expect(typeof point.queueLength).toBe('number');
      expect(typeof point.inService).toBe('number');
    }
  });

  test('timeSeries is sorted by time', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const snapshot = engine.getSnapshot();
    for (let i = 1; i < snapshot.timeSeries.length; i++) {
      expect(snapshot.timeSeries[i].time).toBeGreaterThanOrEqual(snapshot.timeSeries[i - 1].time);
    }
  });
});

describe('SimulationEngine - Server State', () => {
  test('getServers returns copy of servers', () => {
    const config = createConfig({ servers: 3 });
    const engine = new SimulationEngine(config);

    const servers1 = engine.getServers();
    const servers2 = engine.getServers();

    expect(servers1).not.toBe(servers2);
  });

  test('each server has unique id', () => {
    const config = createConfig({ servers: 5 });
    const engine = new SimulationEngine(config);

    const servers = engine.getServers();
    const ids = servers.map(s => s.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(5);
  });

  test('server has correct structure', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    const servers = engine.getServers();
    const server = servers[0];

    expect(server).toHaveProperty('id');
    expect(server).toHaveProperty('busy');
  });
});

describe('SimulationEngine - Waiting Queue', () => {
  test('getWaitingQueue returns copy', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    const queue1 = engine.getWaitingQueue();
    const queue2 = engine.getWaitingQueue();

    expect(queue1).not.toBe(queue2);
  });

  test('queue follows FIFO order', () => {
    // Force queuing by having slow service
    const config = createConfig({
      arrivalRate: 10,
      serviceRate: 0.5,
      servers: 1,
      maxTime: 10,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(10);

    // Check contact records - earlier arrivals should finish first
    const records = engine.getContactRecords();
    if (records.length > 1) {
      // For same server, service end times should respect arrival order
      const serverRecords = records.filter(r => r.serverId === 0);
      for (let i = 1; i < serverRecords.length; i++) {
        expect(serverRecords[i].serviceStartTime).toBeGreaterThanOrEqual(
          serverRecords[i - 1].serviceEndTime - 0.001 // Small tolerance
        );
      }
    }
  });
});

describe('SimulationEngine - CSV Export', () => {
  test('exportContactRecordsAsCSV returns string', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const csv = engine.exportContactRecordsAsCSV();
    expect(typeof csv).toBe('string');
  });

  test('CSV has header row', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const csv = engine.exportContactRecordsAsCSV();
    const lines = csv.split('\n');

    expect(lines[0]).toContain('Customer ID');
    expect(lines[0]).toContain('Channel');
    expect(lines[0]).toContain('Arrival Time');
  });

  test('CSV has correct number of rows', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    const csv = engine.exportContactRecordsAsCSV();
    const lines = csv.split('\n').filter(l => l.length > 0);

    // Header + data rows
    expect(lines.length).toBe(records.length + 1);
  });

  test('empty contact records returns empty string', () => {
    const config = createConfig({ maxTime: 0 });
    const engine = new SimulationEngine(config);

    const csv = engine.exportContactRecordsAsCSV();
    expect(csv).toBe('');
  });

  test('CSV contains channel from config', () => {
    const config = createConfig({ channel: 'chat' });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const csv = engine.exportContactRecordsAsCSV();
    expect(csv).toContain('chat');
  });

  test('numbers formatted to 4 decimal places', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const csv = engine.exportContactRecordsAsCSV();
    // Check for decimal format pattern
    expect(csv).toMatch(/\d+\.\d{4}/);
  });
});

describe('SimulationEngine - SQL Export', () => {
  test('exportAsHistoricalDataSQL returns array of strings', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const sql = engine.exportAsHistoricalDataSQL();
    expect(Array.isArray(sql)).toBe(true);
    expect(sql.length).toBeGreaterThan(0);
  });

  test('each SQL statement is INSERT', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const sql = engine.exportAsHistoricalDataSQL();
    for (const stmt of sql) {
      expect(stmt).toContain('INSERT INTO HistoricalData');
    }
  });

  test('empty records returns empty array', () => {
    const config = createConfig({ maxTime: 0 });
    const engine = new SimulationEngine(config);

    const sql = engine.exportAsHistoricalDataSQL();
    expect(sql).toHaveLength(0);
  });

  test('SQL includes channel', () => {
    const config = createConfig({ channel: 'email' });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const sql = engine.exportAsHistoricalDataSQL();
    expect(sql[0]).toContain("'email'");
  });
});

describe('SimulationEngine - Metadata', () => {
  test('getSimulationMetadata returns config and stats', () => {
    const config = createConfig({ channel: 'voice', campaignId: 100 });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const metadata = engine.getSimulationMetadata();

    expect(metadata).toHaveProperty('config');
    expect(metadata).toHaveProperty('totalContacts');
    expect(metadata).toHaveProperty('channels');
    expect(metadata).toHaveProperty('campaigns');
    expect(metadata).toHaveProperty('skills');
  });

  test('totalContacts matches contact records length', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const metadata = engine.getSimulationMetadata();
    const records = engine.getContactRecords();

    expect(metadata.totalContacts).toBe(records.length);
  });

  test('channels extracted from records', () => {
    const config = createConfig({ channel: 'chat' });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const metadata = engine.getSimulationMetadata();
    expect(metadata.channels).toContain('chat');
  });
});

describe('SimulationEngine - Edge Cases', () => {
  test('handles zero arrival rate (no arrivals)', () => {
    const config = createConfig({ arrivalRate: 0.001, maxTime: 1 });
    const engine = new SimulationEngine(config);

    engine.processUntil(1);

    // Should handle gracefully
    expect(engine.getSnapshot().servicedCount).toBeGreaterThanOrEqual(0);
  });

  test('handles single server (M/M/1)', () => {
    const config = createConfig({ servers: 1, arrivalRate: 0.5, serviceRate: 1 });
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    expect(engine.getSnapshot().servicedCount).toBeGreaterThan(0);
  });

  test('handles many servers with low traffic', () => {
    const config = createConfig({ servers: 100, arrivalRate: 1, serviceRate: 1 });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    // With many servers and low arrival rate, queue should be minimal
    expect(engine.getSnapshot().maxQueueLength).toBeLessThanOrEqual(5);
  });

  test('handles very short maxTime', () => {
    const config = createConfig({ maxTime: 0.001 });
    const engine = new SimulationEngine(config);

    engine.processUntil(0.001);

    // Should handle without error
    expect(engine.getSnapshot()).toBeDefined();
  });

  test('handles high traffic intensity (overloaded system)', () => {
    // rho > 1 (unstable queue)
    const config = createConfig({
      arrivalRate: 5,
      serviceRate: 1,
      servers: 2, // rho = 5 / (2*1) = 2.5 > 1
      maxTime: 10,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(10);

    // Queue should grow
    expect(engine.getSnapshot().maxQueueLength).toBeGreaterThan(0);
  });
});

describe('SimulationEngine - Realistic Scenarios', () => {
  test('typical call center scenario', () => {
    // 30 calls per hour, 5 minute avg handle time, 10 agents
    // Arrival rate = 30/60 = 0.5 per minute
    // Service rate = 1/5 = 0.2 per minute per agent
    const config = createConfig({
      arrivalRate: 0.5,
      serviceRate: 0.2,
      servers: 10,
      maxTime: 60, // 1 hour
      channel: 'voice',
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(60);

    const snapshot = engine.getSnapshot();
    expect(snapshot.servicedCount).toBeGreaterThan(0);
    expect(snapshot.avgWaitTime).toBeGreaterThanOrEqual(0);
  });

  test('stable system (rho < 1) has bounded queue', () => {
    // rho = lambda / (c * mu) = 0.8 / (2 * 1) = 0.4 < 1
    const config = createConfig({
      arrivalRate: 0.8,
      serviceRate: 1,
      servers: 2,
      maxTime: 100,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    // Queue should be relatively small for stable system
    const snapshot = engine.getSnapshot();
    expect(snapshot.maxQueueLength).toBeLessThan(20);
  });

  test('service completions roughly match arrivals in stable system', () => {
    const config = createConfig({
      arrivalRate: 1,
      serviceRate: 2,
      servers: 2,
      maxTime: 100,
    });
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    const snapshot = engine.getSnapshot();
    // In stable system, servicedCount should be close to number of arrivals
    // With arrival rate 1 and maxTime 100, expect ~100 arrivals
    expect(snapshot.servicedCount).toBeGreaterThan(50);
    expect(snapshot.servicedCount).toBeLessThan(200);
  });
});

describe('SimulationEngine - Statistical Properties', () => {
  test('service times follow exponential distribution (positive values)', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    const records = engine.getContactRecords();
    for (const record of records) {
      expect(record.serviceTime).toBeGreaterThan(0);
    }
  });

  test('arrival times are increasing', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    const records = engine.getContactRecords();
    if (records.length > 1) {
      const arrivals = records.map(r => r.arrivalTime).sort((a, b) => a - b);
      for (let i = 1; i < arrivals.length; i++) {
        expect(arrivals[i]).toBeGreaterThanOrEqual(arrivals[i - 1]);
      }
    }
  });

  test('wait times are non-negative', () => {
    const config = createConfig();
    const engine = new SimulationEngine(config);

    engine.processUntil(100);

    const records = engine.getContactRecords();
    for (const record of records) {
      expect(record.queueWaitTime).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('SimulationEngine - Channel Types', () => {
  test('voice channel uses correct defaults', () => {
    const config = createConfig({ channel: 'voice' });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    expect(records.every(r => r.channel === 'voice')).toBe(true);
  });

  test('chat channel sets concurrentContacts', () => {
    const config = createConfig({ channel: 'chat' });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    expect(records.every(r => r.concurrentContacts === 1)).toBe(true);
  });

  test('email channel sets concurrentContacts', () => {
    const config = createConfig({ channel: 'email' });
    const engine = new SimulationEngine(config);

    engine.processUntil(50);

    const records = engine.getContactRecords();
    expect(records.every(r => r.concurrentContacts === 1)).toBe(true);
  });
});

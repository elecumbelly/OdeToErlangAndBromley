/**
 * Discrete-Event Simulation Engine for M/M/c Queue
 *
 * This implements a classical queueing system with:
 * - Poisson arrivals (exponentially distributed inter-arrival times)
 * - Exponential service times
 * - c identical servers
 * - Infinite waiting room
 * - FIFO discipline
 */

import {
  type ScenarioConfig,
  type Customer,
  type Event,
  EventType,
  type Server,
  type SimulationStats,
  type Snapshot,
  type ContactRecord,
} from './types';

export class SimulationEngine {
  private config: ScenarioConfig;
  private now: number = 0;
  private eventQueue: Event[] = [];
  private waitingQueue: Customer[] = [];
  private servers: Server[] = [];
  private customers: Map<number, Customer> = new Map();
  private nextCustomerId: number = 1;
  private stats: SimulationStats;
  private contactRecords: ContactRecord[] = [];

  constructor(config: ScenarioConfig) {
    this.config = { ...config };
    this.stats = this.initStats();
    this.initServers();
    this.scheduleFirstArrival();
  }

  /**
   * Reset the simulation with optional new configuration
   */
  reset(config?: ScenarioConfig): void {
    if (config) {
      this.config = { ...config };
    }

    this.now = 0;
    this.eventQueue = [];
    this.waitingQueue = [];
    this.customers.clear();
    this.nextCustomerId = 1;
    this.stats = this.initStats();
    this.contactRecords = [];
    this.initServers();
    this.scheduleFirstArrival();
  }

  /**
   * Process all events until simulation time reaches tMax
   */
  processUntil(tMax: number): void {
    // Clamp to simulation horizon
    const targetTime = Math.min(tMax, this.config.maxTime);

    while (this.eventQueue.length > 0 && this.eventQueue[0].time <= targetTime) {
      const event = this.popNextEvent();
      if (!event) break;

      this.now = event.time;

      if (event.type === EventType.ARRIVAL) {
        this.handleArrival(event);
      } else if (event.type === EventType.SERVICE_END) {
        this.handleServiceEnd(event);
      }

      // Record time series snapshot (sample every so often to avoid too many points)
      if (this.stats.timeSeries.length === 0 ||
          this.now - this.stats.timeSeries[this.stats.timeSeries.length - 1].time >= 0.5) {
        this.recordTimeSeriesPoint();
      }
    }

    // If we've advanced time, record final snapshot
    if (this.now === targetTime && this.stats.timeSeries.length > 0) {
      const last = this.stats.timeSeries[this.stats.timeSeries.length - 1];
      if (last.time < this.now) {
        this.recordTimeSeriesPoint();
      }
    }
  }

  /**
   * Get current simulation snapshot for rendering
   */
  getSnapshot(): Snapshot {
    const inService = this.servers.filter(s => s.busy).length;
    const avgWaitTime = this.stats.servicedCount > 0
      ? this.stats.totalWaitTime / this.stats.servicedCount
      : 0;

    return {
      now: this.now,
      queueLength: this.waitingQueue.length,
      inService,
      servicedCount: this.stats.servicedCount,
      avgWaitTime,
      maxQueueLength: this.stats.maxQueueLength,
      timeSeries: [...this.stats.timeSeries],
    };
  }

  /**
   * Check if simulation has reached the time horizon
   */
  isFinished(): boolean {
    return this.now >= this.config.maxTime;
  }

  /**
   * Get current servers state (for visualization)
   */
  getServers(): Server[] {
    return this.servers.map(s => ({ ...s }));
  }

  /**
   * Get waiting queue (for visualization)
   */
  getWaitingQueue(): Customer[] {
    return [...this.waitingQueue];
  }

  /**
   * Get all contact records (completed customers)
   */
  getContactRecords(): ContactRecord[] {
    return [...this.contactRecords];
  }

  /**
   * Export contact records as CSV
   */
  exportContactRecordsAsCSV(): string {
    if (this.contactRecords.length === 0) {
      return '';
    }

    // CSV header
    const headers = [
      'Customer ID',
      'Arrival Time',
      'Queue Join Time',
      'Queue Wait Time',
      'Service Start Time',
      'Service End Time',
      'Total Time in System',
      'Server ID',
      'Was Queued',
      'Service Time',
      'Time to Answer (ASA)',
    ];

    // CSV rows
    const rows = this.contactRecords.map(record => [
      record.customerId,
      record.arrivalTime.toFixed(4),
      record.queueJoinTime.toFixed(4),
      record.queueWaitTime.toFixed(4),
      record.serviceStartTime.toFixed(4),
      record.serviceEndTime.toFixed(4),
      record.totalTimeInSystem.toFixed(4),
      record.serverId,
      record.wasQueued ? 'Yes' : 'No',
      record.serviceTime.toFixed(4),
      record.timeToAnswer.toFixed(4),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Download contact records as CSV file
   */
  downloadContactRecordsCSV(filename: string = 'contact-records.csv'): void {
    const csv = this.exportContactRecordsAsCSV();
    if (!csv) return;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private initStats(): SimulationStats {
    return {
      servicedCount: 0,
      totalWaitTime: 0,
      maxQueueLength: 0,
      timeSeries: [],
    };
  }

  private initServers(): void {
    this.servers = Array.from({ length: this.config.servers }, (_, i) => ({
      id: i,
      busy: false,
    }));
  }

  /**
   * Schedule the first customer arrival
   */
  private scheduleFirstArrival(): void {
    const interArrivalTime = this.exponential(this.config.arrivalRate);
    const arrivalTime = this.now + interArrivalTime;

    if (arrivalTime <= this.config.maxTime) {
      this.scheduleEvent({
        time: arrivalTime,
        type: EventType.ARRIVAL,
        customerId: this.nextCustomerId++,
      });
    }
  }

  /**
   * Handle customer arrival event
   */
  private handleArrival(event: Event): void {
    // Create new customer
    const customer: Customer = {
      id: event.customerId,
      arrivalTime: this.now,
    };
    this.customers.set(customer.id, customer);

    // Try to find a free server
    const freeServer = this.servers.find(s => !s.busy);

    if (freeServer) {
      // Start service immediately
      this.startService(customer, freeServer);
    } else {
      // Join waiting queue
      this.waitingQueue.push(customer);

      // Update max queue length
      if (this.waitingQueue.length > this.stats.maxQueueLength) {
        this.stats.maxQueueLength = this.waitingQueue.length;
      }
    }

    // Schedule next arrival (Poisson process)
    const interArrivalTime = this.exponential(this.config.arrivalRate);
    const nextArrivalTime = this.now + interArrivalTime;

    if (nextArrivalTime <= this.config.maxTime) {
      this.scheduleEvent({
        time: nextArrivalTime,
        type: EventType.ARRIVAL,
        customerId: this.nextCustomerId++,
      });
    }
  }

  /**
   * Handle service completion event
   */
  private handleServiceEnd(event: Event): void {
    const customer = this.customers.get(event.customerId);
    if (!customer) return;

    // Mark service end
    customer.serviceEndTime = this.now;

    // Free the server
    const server = this.servers.find(s => s.customerId === customer.id);
    if (!server) return;

    server.busy = false;
    server.customerId = undefined;
    server.releaseTime = this.now;

    // Update stats
    this.stats.servicedCount++;
    if (customer.serviceStartTime !== undefined) {
      const waitTime = customer.serviceStartTime - customer.arrivalTime;
      this.stats.totalWaitTime += waitTime;
    }

    // Create contact record for this completed customer
    if (customer.serviceStartTime !== undefined && customer.serviceEndTime !== undefined) {
      const queueWaitTime = customer.serviceStartTime - customer.arrivalTime;
      const serviceTime = customer.serviceEndTime - customer.serviceStartTime;
      const totalTimeInSystem = customer.serviceEndTime - customer.arrivalTime;

      const contactRecord: ContactRecord = {
        customerId: customer.id,
        arrivalTime: customer.arrivalTime,
        queueJoinTime: customer.arrivalTime,
        queueWaitTime,
        serviceStartTime: customer.serviceStartTime,
        serviceEndTime: customer.serviceEndTime,
        totalTimeInSystem,
        serverId: server.id,
        wasQueued: queueWaitTime > 0,
        serviceTime,
        timeToAnswer: queueWaitTime,
      };

      this.contactRecords.push(contactRecord);
    }

    // If there are customers waiting, start service for the next one
    if (this.waitingQueue.length > 0) {
      const nextCustomer = this.waitingQueue.shift()!;
      this.startService(nextCustomer, server);
    }
  }

  /**
   * Start service for a customer on a server
   */
  private startService(customer: Customer, server: Server): void {
    customer.serviceStartTime = this.now;
    server.busy = true;
    server.customerId = customer.id;

    // Schedule service completion
    const serviceTime = this.exponential(this.config.serviceRate);
    const endTime = this.now + serviceTime;

    this.scheduleEvent({
      time: endTime,
      type: EventType.SERVICE_END,
      customerId: customer.id,
    });
  }

  /**
   * Schedule an event (maintains sorted order by time)
   */
  private scheduleEvent(event: Event): void {
    // Insert in sorted order (simple insertion sort for small queues)
    let insertIndex = this.eventQueue.findIndex(e => e.time > event.time);
    if (insertIndex === -1) {
      this.eventQueue.push(event);
    } else {
      this.eventQueue.splice(insertIndex, 0, event);
    }
  }

  /**
   * Pop the next event from the queue
   */
  private popNextEvent(): Event | undefined {
    return this.eventQueue.shift();
  }

  /**
   * Record current state in time series
   */
  private recordTimeSeriesPoint(): void {
    const inService = this.servers.filter(s => s.busy).length;
    this.stats.timeSeries.push({
      time: this.now,
      queueLength: this.waitingQueue.length,
      inService,
    });
  }

  /**
   * Generate exponentially distributed random variable
   * @param rate - rate parameter (lambda or mu)
   * @returns random value with exponential distribution
   */
  private exponential(rate: number): number {
    // Exponential distribution: -ln(U) / rate where U ~ Uniform(0,1)
    return -Math.log(Math.random()) / rate;
  }
}

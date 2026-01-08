/**
 * Main simulation tab component with animation loop
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { type ScenarioConfig, type Snapshot, type ContactRecord } from '../simulation/types';
import { PRESET_SCENARIOS } from '../simulation/presets';
import ControlsPanel from './ControlsPanel';
import QueueVisual from './QueueVisual';
import StatsPanel from './StatsPanel';
import ContactRecordsPanel from './ContactRecordsPanel';

export default function SimulationTab() {
  // Configuration state
  const [config, setConfig] = useState<ScenarioConfig>(PRESET_SCENARIOS[1].config); // Start with "Balanced"

  // Simulation state
  const [snapshot, setSnapshot] = useState<Snapshot>({
    now: 0,
    queueLength: 0,
    inService: 0,
    servicedCount: 0,
    avgWaitTime: 0,
    maxQueueLength: 0,
    timeSeries: [],
  });

  const [contactRecords, setContactRecords] = useState<ContactRecord[]>([]);
  const [recordStats, setRecordStats] = useState({ currentRecords: 0, maxRecords: 10000, recordsDropped: 0, isAtLimit: false });

  // Playback state
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  // Refs for animation loop
  const engineRef = useRef<SimulationEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRealTimeRef = useRef<number>(0);

  /**
   * Initialize or reset the simulation engine
   */
  const initEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset(config);
    } else {
      engineRef.current = new SimulationEngine(config);
    }
    setSnapshot(engineRef.current.getSnapshot());
    setContactRecords([]);
    setIsFinished(false);
  }, [config]);

  /**
   * Animation loop using requestAnimationFrame
   */
  const animate = useCallback((currentTime: number) => {
    if (!engineRef.current) return;

    // Calculate time delta
    const deltaReal = lastRealTimeRef.current === 0
      ? 0
      : (currentTime - lastRealTimeRef.current) / 1000; // Convert to seconds

    lastRealTimeRef.current = currentTime;

    if (deltaReal > 0) {
      // Calculate simulation time delta based on speed
      const deltaSim = deltaReal * speed;
      const currentSnapshot = engineRef.current.getSnapshot();
      const targetSimTime = currentSnapshot.now + deltaSim;

      // Process events until target time
      engineRef.current.processUntil(targetSimTime);

      // Get updated snapshot, contact records, and record stats
      const newSnapshot = engineRef.current.getSnapshot();
      setSnapshot(newSnapshot);
      setContactRecords(engineRef.current.getContactRecords());
      setRecordStats(engineRef.current.getRecordStats());

      // Check if finished
      if (engineRef.current.isFinished()) {
        setIsFinished(true);
        setIsRunning(false);
        return;
      }
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [speed]);

  /**
   * Start the simulation
   */
  const handleStart = useCallback(() => {
    if (!engineRef.current) {
      initEngine();
    }

    setIsRunning(true);
    lastRealTimeRef.current = 0; // Reset time tracking
  }, [initEngine]);

  /**
   * Pause the simulation
   */
  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * Reset the simulation
   */
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsFinished(false);
    lastRealTimeRef.current = 0;
    initEngine();
  }, [initEngine]);

  /**
   * Handle config changes (will apply on next reset/start)
   */
  const handleConfigChange = useCallback((newConfig: ScenarioConfig) => {
    setConfig(newConfig);
  }, []);

  /**
   * Export contact records as CSV
   */
  const handleExportCSV = useCallback(() => {
    if (engineRef.current) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      engineRef.current.downloadContactRecordsCSV(`contact-records-${timestamp}.csv`);
    }
  }, []);

  /**
   * Effect: Manage animation loop
   */
  useEffect(() => {
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastRealTimeRef.current = 0; // Reset when paused
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, animate]);

  /**
   * Effect: Initialize engine on mount
   */
  useEffect(() => {
    initEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Get current queue and servers for visualization
  const servers = engineRef.current?.getServers() || [];
  const waitingQueue = engineRef.current?.getWaitingQueue() || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-bg-surface to-bg-elevated border border-border-subtle rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple/[0.05] to-transparent pointer-events-none" />
        <div className="flex items-start space-x-4 relative z-10">
          <div className="bg-bg-elevated border border-purple/30 p-3 rounded-lg shadow-glow-purple">
            <svg className="w-8 h-8 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">Real-Time Queue Simulation</h2>
            <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
              Discrete-event simulation of a multi-server (M/M/c) system. Validate your Erlang calculations by watching the queue dynamics unfold in real-time. Adjust arrival rates and service speed on the fly.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1">
          <ControlsPanel
            config={config}
            onConfigChange={handleConfigChange}
            isRunning={isRunning}
            isFinished={isFinished}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={setSpeed}
          />
        </div>

        {/* Middle Column: Visualization */}
        <div className="lg:col-span-1">
          <QueueVisual
            servers={servers}
            waitingQueue={waitingQueue}
            maxQueueDisplay={30}
          />
        </div>

        {/* Right Column: Statistics */}
        <div className="lg:col-span-1">
          <StatsPanel snapshot={snapshot} />
        </div>
      </div>

      {/* Contact Records Section */}
      <div className="mt-2">
        {recordStats.recordsDropped > 0 && (
          <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg flex gap-3 items-center">
            <span className="text-amber text-lg">⚠️</span>
            <p className="text-sm text-amber">
              <strong>Record Limit Reached:</strong> Displaying {recordStats.currentRecords.toLocaleString()} most recent contacts.
              ({recordStats.recordsDropped.toLocaleString()} older records dropped to maintain performance)
            </p>
          </div>
        )}
        <ContactRecordsPanel
          records={contactRecords}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Help Section */}
      <div className="p-6 bg-bg-surface border-l-4 border-blue rounded-r-lg border-y border-r border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-3">Simulation Mechanics</h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <p>
            This engine uses a <strong>M/M/c</strong> queueing model:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-text-muted">
            <li><strong>Arrivals:</strong> Poisson process (random arrivals averaging λ calls/hour)</li>
            <li><strong>Service:</strong> Exponential distribution (random duration averaging μ minutes)</li>
            <li><strong>Servers:</strong> {config.servers} parallel agents</li>
          </ul>
          <div className="mt-4 p-3 bg-bg-elevated rounded border border-border-muted">
            <p className="font-semibold text-text-primary text-xs uppercase tracking-wide mb-1">Stability Check</p>
            <p>
              Traffic Intensity (ρ) = λ / (c × μ). If this exceeds 1.0, the queue will grow infinitely.
              Target 0.7 - 0.85 for optimal balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

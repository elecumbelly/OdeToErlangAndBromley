/**
 * Main simulation tab component with animation loop
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { type ScenarioConfig, type Snapshot } from '../simulation/types';
import { PRESET_SCENARIOS } from '../simulation/presets';
import ControlsPanel from './ControlsPanel';
import QueueVisual from './QueueVisual';
import StatsPanel from './StatsPanel';

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

      // Get updated snapshot
      const newSnapshot = engineRef.current.getSnapshot();
      setSnapshot(newSnapshot);

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
    <div>
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Queue Simulation (M/M/c)</h2>
            <p className="text-sm opacity-95">
              Discrete-event simulation of a multi-server queueing system with Poisson arrivals and exponential service times.
              Adjust parameters, control playback speed, and watch the queue evolve in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div>
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
        <div>
          <QueueVisual
            servers={servers}
            waitingQueue={waitingQueue}
            maxQueueDisplay={30}
          />
        </div>

        {/* Right Column: Statistics */}
        <div>
          <StatsPanel snapshot={snapshot} />
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>M/M/c Queue:</strong> This simulation models a queueing system with:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>M</strong> (Markovian arrivals): Customers arrive following a Poisson process with rate λ</li>
            <li><strong>M</strong> (Markovian service): Service times are exponentially distributed with rate μ per server</li>
            <li><strong>c</strong>: Number of identical servers working in parallel</li>
          </ul>
          <p className="mt-3">
            <strong>Traffic Intensity (ρ):</strong> Defined as λ / (c × μ). When ρ ≥ 1, the queue is unstable and will grow without bound.
            For stable operation, keep ρ &lt; 1 (e.g., 0.7-0.9 for good service levels).
          </p>
          <p className="mt-3">
            <strong>Speed Control:</strong> The slider adjusts how fast simulation time progresses relative to real time.
            At 1x speed, one simulation time unit = one real second. At 10x, time advances 10× faster.
          </p>
        </div>
      </div>
    </div>
  );
}

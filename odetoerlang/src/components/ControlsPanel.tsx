/**
 * Controls panel for simulation parameters and playback
 */

import { useState, useEffect } from 'react';
import { type ScenarioConfig } from '../simulation/types';
import { PRESET_SCENARIOS, validateConfig, calculateUtilisation } from '../simulation/presets';

interface ControlsPanelProps {
  config: ScenarioConfig;
  onConfigChange: (config: ScenarioConfig) => void;
  isRunning: boolean;
  isFinished: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export default function ControlsPanel({
  config,
  onConfigChange,
  isRunning,
  isFinished,
  onStart,
  onPause,
  onReset,
  speed,
  onSpeedChange,
}: ControlsPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [errors, setErrors] = useState<string[]>([]);

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleFieldChange = (field: keyof ScenarioConfig, value: number) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);

    // Validate
    const validationErrors = validateConfig(newConfig);
    setErrors(validationErrors);

    // Only propagate if valid
    if (validationErrors.length === 0) {
      onConfigChange(newConfig);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = PRESET_SCENARIOS.find(p => p.name === presetName);
    if (preset) {
      setLocalConfig(preset.config);
      onConfigChange(preset.config);
      setErrors([]);
    }
  };

  const utilisation = calculateUtilisation(
    localConfig.arrivalRate,
    localConfig.serviceRate,
    localConfig.servers
  );

  const isUnstable = utilisation >= 1.0;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Simulation Controls</h3>

      {/* Preset Scenarios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Start Scenarios
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          onChange={(e) => handlePresetSelect(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Select a preset...</option>
          {PRESET_SCENARIOS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} - {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Parameters */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold text-gray-700">Custom Parameters</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arrival Rate (λ)
            <span className="text-xs text-gray-500 ml-2">customers per time unit</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={localConfig.arrivalRate}
            onChange={(e) => handleFieldChange('arrivalRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Rate (μ)
            <span className="text-xs text-gray-500 ml-2">per server per time unit</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={localConfig.serviceRate}
            onChange={(e) => handleFieldChange('serviceRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Servers (c)
          </label>
          <input
            type="number"
            step="1"
            min="1"
            value={localConfig.servers}
            onChange={(e) => handleFieldChange('servers', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Simulation Time Horizon
          </label>
          <input
            type="number"
            step="10"
            min="10"
            value={localConfig.maxTime}
            onChange={(e) => handleFieldChange('maxTime', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Utilisation Display */}
        <div className={`p-3 rounded-md ${isUnstable ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="text-sm font-medium mb-1">
            Traffic Intensity (ρ): <span className="font-bold">{utilisation.toFixed(3)}</span>
          </div>
          <div className="text-xs text-gray-600">
            {isUnstable ? (
              <span className="text-red-700 font-medium">⚠️ Unstable queue (ρ ≥ 1.0) - queue will grow unbounded!</span>
            ) : (
              <span>System capacity: {((1 - utilisation) * 100).toFixed(1)}% spare capacity</span>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            {errors.map((error, i) => (
              <div key={i} className="text-sm text-red-700">❌ {error}</div>
            ))}
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="pt-4 border-t space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Playback</h4>

        {/* Play/Pause/Reset Buttons */}
        <div className="flex space-x-2">
          {!isFinished ? (
            <button
              onClick={isRunning ? onPause : onStart}
              disabled={errors.length > 0}
              className={`
                flex-1 px-4 py-2 rounded-md font-medium transition-colors
                ${errors.length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isRunning
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
          ) : (
            <button
              onClick={onReset}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              🔄 Restart
            </button>
          )}
          <button
            onClick={onReset}
            disabled={isRunning}
            className={`
              flex-1 px-4 py-2 rounded-md font-medium transition-colors
              ${isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
              }
            `}
          >
            🔄 Reset
          </button>
        </div>

        {/* Speed Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Simulation Speed: <span className="font-bold text-primary-600">{speed.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="50"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1x (slow)</span>
            <span>1x (real-time)</span>
            <span>50x (fast)</span>
          </div>
        </div>

        {/* Status */}
        <div className="text-sm text-gray-600 text-center">
          {isFinished ? (
            <span className="text-green-700 font-medium">✓ Simulation complete</span>
          ) : isRunning ? (
            <span className="text-blue-700 font-medium">⏵ Running...</span>
          ) : (
            <span className="text-gray-500">⏸ Paused</span>
          )}
        </div>
      </div>
    </div>
  );
}

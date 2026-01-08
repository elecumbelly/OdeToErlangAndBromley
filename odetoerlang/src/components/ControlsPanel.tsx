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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Derived state for friendlier inputs (Volume/AHT)
  // Arrival Rate (lambda) is per MINUTE in standard Erlang C usage usually, but simulation might use seconds.
  // Assuming simulation time unit = 1 second for simplicity in conversion logic below.
  // Wait, Erlang calculations typically normalize. Let's assume standard WFM inputs:
  // Volume = Calls per Hour
  // AHT = Seconds
  // Lambda (arrivals/sec) = Volume / 3600
  // Mu (services/sec) = 1 / AHT
  
  // NOTE: The simulation engine might treat time differently.
  // Checking default presets:
  // Balanced: arrivalRate: 0.8, serviceRate: 0.1, servers: 10
  // 0.8 arrivals/unit. 0.1 services/unit (service time = 10 units).
  // If unit = second: 0.8 calls/sec = 2880 calls/hour. Service = 10s.
  // Let's expose "Arrivals per Minute" and "Avg Service Time (sec)" to keep it relatable.
  
  const [displayVolume, setDisplayVolume] = useState(localConfig.arrivalRate * 60); // Arrivals per minute
  const [displayAHT, setDisplayAHT] = useState(1 / localConfig.serviceRate); // Service time in units

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config);
    setDisplayVolume(config.arrivalRate * 60);
    setDisplayAHT(1 / config.serviceRate);
  }, [config]);

  const updateConfigFromDisplay = (volPerMin: number, aht: number) => {
    const arrivalRate = volPerMin / 60;
    const serviceRate = aht > 0 ? 1 / aht : 0.1;
    
    handleFieldChange('arrivalRate', arrivalRate);
    handleFieldChange('serviceRate', serviceRate);
  };

  const handleFieldChange = (field: keyof ScenarioConfig, value: number) => {
    const newConfig = { ...localConfig, [field]: value };
    // If updating underlying rates directly, sync display
    if (field === 'arrivalRate') setDisplayVolume(value * 60);
    if (field === 'serviceRate') setDisplayAHT(1 / value);
    
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
      setDisplayVolume(preset.config.arrivalRate * 60);
      setDisplayAHT(1 / preset.config.serviceRate);
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
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-6 tracking-wide">Controls</h3>

      <div className="space-y-6 flex-1">
        {/* Preset Scenarios */}
        <div>
          <label className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">
            Load Scenario
          </label>
          <select
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:border-cyan outline-none"
            onChange={(e) => handlePresetSelect(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Select a preset...</option>
            {PRESET_SCENARIOS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Simplified Parameters */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-1 block">
                Arrivals / Min
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={Math.round(displayVolume)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDisplayVolume(val);
                  updateConfigFromDisplay(val, displayAHT);
                }}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:border-cyan outline-none"
              />
            </div>
            <div>
              <label className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-1 block">
                Avg Handle Time
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={Math.round(displayAHT)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDisplayAHT(val);
                  updateConfigFromDisplay(displayVolume, val);
                }}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:border-cyan outline-none"
              />
              <span className="text-xs text-text-muted absolute right-8 mt-[-26px]">sec</span>
            </div>
          </div>

          <div>
            <label className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-1 block">
              Agents (Servers)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={localConfig.servers}
              onChange={(e) => handleFieldChange('servers', parseInt(e.target.value))}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:border-cyan outline-none font-mono font-bold"
            />
          </div>
        </div>

        {/* Utilisation Bar */}
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">System Load (Intensity)</span>
            <span className={`font-mono font-bold ${isUnstable ? 'text-red' : 'text-cyan'}`}>
              {(utilisation * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isUnstable ? 'bg-red' : 'bg-cyan'}`}
              style={{ width: `${Math.min(100, utilisation * 100)}%` }}
            />
          </div>
          {isUnstable && (
            <p className="text-xs text-red mt-1">⚠️ Unstable: Arrivals exceed capacity!</p>
          )}
        </div>

        {/* Advanced Toggle */}
        <div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-text-secondary hover:text-cyan transition-colors flex items-center gap-1"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-3 p-3 bg-bg-elevated/50 rounded-lg border border-border-muted text-xs">
              <div>
                <label className="block text-text-muted mb-1">Sim Horizon (ticks)</label>
                <input
                  type="number"
                  step="100"
                  value={localConfig.maxTime}
                  onChange={(e) => handleFieldChange('maxTime', parseFloat(e.target.value))}
                  className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-text-muted mb-1">Raw λ (Arr/Tick)</label>
                <input
                  type="number"
                  step="0.01"
                  value={localConfig.arrivalRate}
                  onChange={(e) => handleFieldChange('arrivalRate', parseFloat(e.target.value))}
                  className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1 font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mt-6 pt-6 border-t border-border-muted space-y-4">
        <div className="flex gap-2">
          {!isFinished ? (
            <button
              onClick={isRunning ? onPause : onStart}
              disabled={errors.length > 0}
              className={`
                flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg
                ${errors.length > 0
                  ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
                  : isRunning
                    ? 'bg-amber text-bg-base hover:bg-amber/90 shadow-glow-amber'
                    : 'bg-green text-bg-base hover:bg-green/90 shadow-glow-green'
                }
              `}
            >
              {isRunning ? 'PAUSE' : 'START SIMULATION'}
            </button>
          ) : (
            <button
              onClick={onReset}
              className="flex-1 px-4 py-3 bg-cyan text-bg-base hover:bg-cyan/90 rounded-lg font-bold text-sm transition-all shadow-glow-cyan"
            >
              RESTART
            </button>
          )}
          <button
            onClick={onReset}
            disabled={isRunning}
            className={`
              px-4 py-3 rounded-lg font-bold text-sm transition-all border
              ${isRunning
                ? 'border-transparent text-text-muted cursor-not-allowed'
                : 'bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary'
              }
            `}
          >
            RESET
          </button>
        </div>

        {/* Speed Slider */}
        <div className="px-1">
          <div className="flex justify-between text-xs text-text-muted mb-2">
            <span>Speed</span>
            <span className="font-mono text-cyan">{speed}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-cyan"
          />
        </div>
      </div>
    </div>
  );
}

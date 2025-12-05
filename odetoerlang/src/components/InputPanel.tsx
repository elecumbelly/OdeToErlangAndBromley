import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import type { ErlangModel } from '../types';

const InputPanel: React.FC = () => {
  const { inputs, setInput, reset } = useCalculatorStore();

  const handleChange = (key: keyof typeof inputs) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value) || 0;
    setInput(key, value);
  };

  const inputClass = "mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all duration-fast";
  const labelClass = "block text-2xs font-semibold text-text-secondary uppercase tracking-widest";
  const hintClass = "mt-1 text-2xs text-text-muted";

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-muted">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Input Parameters</h2>
        <button
          onClick={reset}
          className="px-3 py-1 bg-bg-hover hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle rounded-md text-2xs font-medium transition-all uppercase tracking-wide"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {/* Volume */}
        <div>
          <label htmlFor="volume" className={labelClass}>
            Call Volume
            <span className="text-text-muted ml-1 lowercase font-normal">/interval</span>
          </label>
          <input
            id="volume"
            type="number"
            min="0"
            step="1"
            value={inputs.volume}
            onChange={handleChange('volume')}
            className={inputClass}
            placeholder="100"
          />
        </div>

        {/* AHT */}
        <div>
          <label htmlFor="aht" className={labelClass}>
            AHT
            <span className="text-text-muted ml-1 lowercase font-normal">seconds</span>
          </label>
          <input
            id="aht"
            type="number"
            min="0"
            step="1"
            value={inputs.aht}
            onChange={handleChange('aht')}
            className={inputClass}
            placeholder="240"
          />
          <p className={hintClass}>Talk + ACW. Voice: 180-360s</p>
        </div>

        {/* Interval */}
        <div>
          <label htmlFor="intervalMinutes" className={labelClass}>
            Interval
          </label>
          <select
            id="intervalMinutes"
            value={inputs.intervalMinutes}
            onChange={(e) => setInput('intervalMinutes', parseFloat(e.target.value))}
            className={inputClass}
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
        </div>

        {/* Model Selection */}
        <div className="pt-3 border-t border-border-muted">
          <label htmlFor="model" className={labelClass}>
            Model
          </label>
          <select
            id="model"
            value={inputs.model}
            onChange={(e) => setInput('model', e.target.value as ErlangModel)}
            className={inputClass}
          >
            <option value="erlangC">Erlang C</option>
            <option value="erlangA">Erlang A</option>
            <option value="erlangX">Erlang X</option>
          </select>
          <div className="mt-2 p-2 bg-bg-elevated border border-border-muted rounded-md">
            <p className="text-2xs text-text-secondary">
              {inputs.model === 'erlangC' && (
                <>
                  <span className="text-cyan font-medium">C:</span> Classic. Infinite patience. Overestimates SL 5-15%.
                </>
              )}
              {inputs.model === 'erlangA' && (
                <>
                  <span className="text-green font-medium">A:</span> With abandonment. ~5% error. Needs patience.
                </>
              )}
              {inputs.model === 'erlangX' && (
                <>
                  <span className="text-magenta font-medium">X:</span> Most accurate. Abandonment + retrials. Industry standard.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Average Patience - Only show for Erlang A/X */}
        {(inputs.model === 'erlangA' || inputs.model === 'erlangX') && (
          <div className="animate-fade-in">
            <label htmlFor="averagePatience" className={labelClass}>
              Patience
              <span className="text-text-muted ml-1 lowercase font-normal">seconds</span>
            </label>
            <input
              id="averagePatience"
              type="number"
              min="0"
              step="1"
              value={inputs.averagePatience}
              onChange={handleChange('averagePatience')}
              className={inputClass}
              placeholder="120"
            />
            <p className={hintClass}>Time before abandon. 60-180s typical</p>
          </div>
        )}

        {/* Service Level Target */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-muted">
          <div>
            <label htmlFor="targetSLPercent" className={labelClass}>
              SL Target %
            </label>
            <input
              id="targetSLPercent"
              type="number"
              min="0"
              max="100"
              step="1"
              value={inputs.targetSLPercent}
              onChange={handleChange('targetSLPercent')}
              className={inputClass}
              placeholder="80"
            />
          </div>

          <div>
            <label htmlFor="thresholdSeconds" className={labelClass}>
              Threshold
            </label>
            <input
              id="thresholdSeconds"
              type="number"
              min="0"
              step="1"
              value={inputs.thresholdSeconds}
              onChange={handleChange('thresholdSeconds')}
              className={inputClass}
              placeholder="20"
            />
          </div>
        </div>

        <div className="bg-cyan/5 border border-cyan/20 rounded-md p-2">
          <p className="text-2xs text-cyan">
            <span className="font-semibold">{inputs.targetSLPercent}/{inputs.thresholdSeconds}</span>
            <span className="text-text-secondary ml-1">
              = {inputs.targetSLPercent}% answered in {inputs.thresholdSeconds}s
            </span>
          </p>
        </div>

        {/* Shrinkage */}
        <div className="pt-3 border-t border-border-muted">
          <label htmlFor="shrinkagePercent" className={labelClass}>
            Shrinkage %
          </label>
          <input
            id="shrinkagePercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={inputs.shrinkagePercent}
            onChange={handleChange('shrinkagePercent')}
            className={inputClass}
            placeholder="25"
          />
          <p className={hintClass}>Breaks, training, meetings. 20-35% typical</p>
        </div>

        {/* Max Occupancy */}
        <div>
          <label htmlFor="maxOccupancy" className={labelClass}>
            Max Occupancy %
          </label>
          <input
            id="maxOccupancy"
            type="number"
            min="0"
            max="100"
            step="1"
            value={inputs.maxOccupancy}
            onChange={handleChange('maxOccupancy')}
            className={inputClass}
            placeholder="90"
          />
          <p className={hintClass}>Agent utilization cap. Voice: 85-90%</p>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;

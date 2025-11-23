import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore';

const InputPanel: React.FC = () => {
  const { inputs, setInput, reset } = useCalculatorStore();

  const handleChange = (key: keyof typeof inputs) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value) || 0;
    setInput(key, value);
  };

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Input Parameters</h2>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* Volume */}
        <div>
          <label htmlFor="volume" className={labelClass}>
            Call Volume
            <span className="text-gray-500 text-xs ml-2">(contacts per interval)</span>
          </label>
          <input
            id="volume"
            type="number"
            min="0"
            step="1"
            value={inputs.volume}
            onChange={handleChange('volume')}
            className={inputClass}
            placeholder="e.g., 100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Number of incoming contacts in the interval
          </p>
        </div>

        {/* AHT */}
        <div>
          <label htmlFor="aht" className={labelClass}>
            Average Handle Time (AHT)
            <span className="text-gray-500 text-xs ml-2">(seconds)</span>
          </label>
          <input
            id="aht"
            type="number"
            min="0"
            step="1"
            value={inputs.aht}
            onChange={handleChange('aht')}
            className={inputClass}
            placeholder="e.g., 240 (4 minutes)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Average time to handle a contact (talk time + after-call work). Typical voice: 180-360 seconds
          </p>
        </div>

        {/* Interval */}
        <div>
          <label htmlFor="intervalMinutes" className={labelClass}>
            Interval Length
            <span className="text-gray-500 text-xs ml-2">(minutes)</span>
          </label>
          <select
            id="intervalMinutes"
            value={inputs.intervalMinutes}
            onChange={(e) => setInput('intervalMinutes', parseFloat(e.target.value))}
            className={inputClass}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes (standard)</option>
            <option value={60}>60 minutes</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Time period for volume measurement. Standard is 30 minutes.
          </p>
        </div>

        {/* Service Level Target */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetSLPercent" className={labelClass}>
              Service Level %
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
              placeholder="e.g., 80"
            />
            <p className="mt-1 text-xs text-gray-500">
              Target % (e.g., 80 for 80/20)
            </p>
          </div>

          <div>
            <label htmlFor="thresholdSeconds" className={labelClass}>
              Threshold (sec)
            </label>
            <input
              id="thresholdSeconds"
              type="number"
              min="0"
              step="1"
              value={inputs.thresholdSeconds}
              onChange={handleChange('thresholdSeconds')}
              className={inputClass}
              placeholder="e.g., 20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Time limit (e.g., 20 for 80/20)
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <strong>Service Level:</strong> {inputs.targetSLPercent}/{inputs.thresholdSeconds} means{' '}
            {inputs.targetSLPercent}% of contacts answered within {inputs.thresholdSeconds} seconds
          </p>
        </div>

        {/* Shrinkage */}
        <div>
          <label htmlFor="shrinkagePercent" className={labelClass}>
            Shrinkage %
            <span className="text-gray-500 text-xs ml-2">(breaks, training, etc.)</span>
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
            placeholder="e.g., 25"
          />
          <p className="mt-1 text-xs text-gray-500">
            % of paid time not available for handling contacts. Typical range: 20-35%
          </p>
        </div>

        {/* Max Occupancy */}
        <div>
          <label htmlFor="maxOccupancy" className={labelClass}>
            Maximum Occupancy %
            <span className="text-gray-500 text-xs ml-2">(agent utilization cap)</span>
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
            placeholder="e.g., 90"
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum % of time agents should be busy. Typical voice: 85-90%
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;

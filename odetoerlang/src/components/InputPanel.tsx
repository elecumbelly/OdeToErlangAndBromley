import React, { useEffect, useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { useDatabaseStore } from '../store/databaseStore';
import type { CalculationInputs, ErlangVariant } from '../types';
import { resolveAssumptionsForDate } from '../lib/forecasting/assumptionResolver';
import { mergeCalculationInputs } from '../lib/forecasting/inputMerger';
import { getCampaignById, type Campaign } from '../lib/database/dataAccess';
import { validateCalculationInputs, getFieldError } from '../lib/validation/inputValidation';

const InputPanel: React.FC = () => {
  const { inputs, setInput, reset, date, setDate } = useCalculatorStore();
  const { selectedCampaignId, campaigns } = useDatabaseStore();

  const validation = useMemo(() => validateCalculationInputs(inputs), [inputs]);
  const getError = (field: keyof CalculationInputs) => getFieldError(validation, field);

  useEffect(() => {
    async function loadResolvedInputs() {
      // Define a comprehensive default campaign object to ensure all fields are present
      const defaultCampaign: Campaign = {
        id: -1, // Placeholder ID for a non-existent campaign
        campaign_name: 'Global Defaults',
        client_id: -1,
        channel_type: 'Voice',
        start_date: '1970-01-01',
        end_date: null,
        sla_target_percent: 80,
        sla_threshold_seconds: 20,
        concurrency_allowed: 1,
        active: true,
        created_at: '1970-01-01T00:00:00Z',
      };

      let currentCampaignDetails: Campaign = defaultCampaign;

      if (selectedCampaignId !== null) {
        const campaign = await getCampaignById(selectedCampaignId);
        if (campaign) {
          currentCampaignDetails = campaign;
        }
      }

      const assumptions = resolveAssumptionsForDate(selectedCampaignId, date, currentCampaignDetails);
      const currentCalculatorState = useCalculatorStore.getState().inputs; 
      const mergedInputs = mergeCalculationInputs(assumptions, currentCalculatorState);
      
      // Update calculator store inputs with resolved values.
      for (const key of Object.keys(mergedInputs) as Array<keyof CalculationInputs>) {
        if (currentCalculatorState[key] !== mergedInputs[key]) {
          setInput(key, mergedInputs[key]);
        }
      }
    }

    loadResolvedInputs();
  }, [selectedCampaignId, date, campaigns, setInput]);

  const handleChange = (key: keyof CalculationInputs) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setInput(key, value);
    } else {
      // Handle string values for select elements (like model type)
      setInput(key, e.target.value as ErlangVariant);
    }
  };

  const getInputClass = (error?: string) => 
    `mt-1 block w-full rounded-md bg-bg-surface text-sm px-3 py-2 focus:outline-none transition-all duration-fast ${
      error 
        ? 'border border-red text-red focus:border-red focus:ring-2 focus:ring-red/20' 
        : 'border border-border-subtle text-text-primary focus:border-cyan focus:ring-2 focus:ring-cyan/20'
    }`;
  
  const labelClass = "block text-2xs font-semibold text-text-secondary uppercase tracking-widest";
  const hintClass = "mt-1 text-2xs text-text-muted";
  const errorClass = "mt-1 text-xs text-red font-medium animate-fade-in";

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-muted">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Input Parameters</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInput('volume', inputs.volume)}
            className="hidden sm:inline px-3 py-1 bg-bg-hover hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle rounded-md text-2xs font-medium transition-all uppercase tracking-wide"
          >
            Recalc
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 bg-bg-hover hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle rounded-md text-2xs font-medium transition-all uppercase tracking-wide"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date Selector for Assumptions */}
        <div>
          <label htmlFor="currentDate" className={labelClass}>
            Assumptions As Of
          </label>
          <input
            id="currentDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={getInputClass()}
          />
          <p className={hintClass}>View assumptions for this date</p>
        </div>

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
            className={getInputClass(getError('volume'))}
            placeholder="100"
          />
          {getError('volume') && <p className={errorClass}>{getError('volume')}</p>}
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
            className={getInputClass(getError('aht'))}
            placeholder="240"
          />
          {getError('aht') ? <p className={errorClass}>{getError('aht')}</p> : <p className={hintClass}>Talk + ACW. Voice: 180-360s</p>}
        </div>

        {/* Interval */}
        <div>
          <label htmlFor="intervalMinutes" className={labelClass}>
            Interval
          </label>
          <select
            id="intervalMinutes"
            value={inputs.intervalMinutes}
            onChange={handleChange('intervalMinutes')}
            className={getInputClass(getError('intervalMinutes'))}
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
          {getError('intervalMinutes') && <p className={errorClass}>{getError('intervalMinutes')}</p>}
        </div>

        {/* Model Selection */}
        <div className="pt-3 border-t border-border-muted">
          <label htmlFor="model" className={labelClass}>
            Model
          </label>
          <select
            id="model"
            value={inputs.model}
            onChange={handleChange('model')}
            className={getInputClass()}
          >
            <option value="B">Erlang B (blocking/loss)</option>
            <option value="C">Erlang C (queuing)</option>
            <option value="A">Erlang A (abandonment)</option>
          </select>
          <div className="mt-2 p-2 bg-bg-elevated border border-border-muted rounded-md">
            <p className="text-2xs text-text-secondary">
              {inputs.model === 'B' && (
                <>
                  <span className="text-amber font-medium">B:</span> Loss model. No queue - calls blocked if all lines busy. For trunks/IVR.
                </>
              )}
              {inputs.model === 'C' && (
                <>
                  <span className="text-cyan font-medium">C:</span> Queue model. Infinite patience assumed. Overestimates SL 5-15%.
                </>
              )}
              {inputs.model === 'A' && (
                <>
                  <span className="text-green font-medium">A:</span> Queue with abandonment. Requires patience setting. Most realistic.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Average Patience - Only show for Erlang A/X */}
        {inputs.model === 'A' && (
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
              className={getInputClass(getError('averagePatience'))}
              placeholder="120"
            />
            {getError('averagePatience') ? <p className={errorClass}>{getError('averagePatience')}</p> : <p className={hintClass}>Time before abandon. 60-180s typical</p>}
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
              className={getInputClass(getError('targetSLPercent'))}
              placeholder="80"
            />
            {getError('targetSLPercent') && <p className={errorClass}>{getError('targetSLPercent')}</p>}
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
              className={getInputClass(getError('thresholdSeconds'))}
              placeholder="20"
            />
            {getError('thresholdSeconds') && <p className={errorClass}>{getError('thresholdSeconds')}</p>}
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
            className={getInputClass(getError('shrinkagePercent'))}
            placeholder="25"
          />
          {getError('shrinkagePercent') ? <p className={errorClass}>{getError('shrinkagePercent')}</p> : <p className={hintClass}>Breaks, training, meetings. 20-35% typical</p>}
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
            className={getInputClass(getError('maxOccupancy'))}
            placeholder="90"
          />
          {getError('maxOccupancy') ? <p className={errorClass}>{getError('maxOccupancy')}</p> : <p className={hintClass}>Agent utilization cap. Voice: 85-90%</p>}
        </div>

        {/* Concurrency */}
        <div>
          <label htmlFor="concurrency" className={labelClass}>
            Concurrency
          </label>
          <input
            id="concurrency"
            type="number"
            min="1"
            step="1"
            value={inputs.concurrency}
            onChange={handleChange('concurrency')}
            className={getInputClass()}
            placeholder="1"
          />
          <p className={hintClass}>Simultaneous contacts an agent can handle (e.g., for chat)</p>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;

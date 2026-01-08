import React, { useEffect, useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { useDatabaseStore } from '../store/databaseStore';
import type { CalculationInputs, ErlangVariant } from '../types';
import { resolveAssumptionsForDate } from '../lib/forecasting/assumptionResolver';
import { mergeCalculationInputs } from '../lib/forecasting/inputMerger';
import { getCampaignById, type Campaign } from '../lib/database/dataAccess';
import { validateCalculationInputs, getFieldError } from '../lib/validation/inputValidation';

const InputPanel: React.FC = () => {
  const { inputs, setInput, reset, date, setDate, useAssumptions, setUseAssumptions } = useCalculatorStore();
  const { selectedCampaignId, campaigns, assumptions } = useDatabaseStore();

  const validation = useMemo(() => validateCalculationInputs(inputs), [inputs]);
  const getError = (field: keyof CalculationInputs) => getFieldError(validation, field);

  useEffect(() => {
    if (!useAssumptions) {
      return;
    }

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
  }, [selectedCampaignId, date, campaigns, assumptions, setInput, useAssumptions]);

  const updateInput = (key: keyof CalculationInputs, rawValue: string) => {
    const value = parseFloat(rawValue);
    if (!isNaN(value)) {
      setInput(key, value);
    } else {
      // Handle string values for select elements (like model type)
      setInput(key, rawValue as ErlangVariant);
    }
  };

  const getInputClass = (error?: string) =>
    `mt-2 block w-full rounded-lg bg-bg-elevated/50 text-base px-4 py-3 focus:outline-none transition-all duration-200 backdrop-blur-sm ${
      error
        ? 'border-2 border-red text-red focus:border-red focus:ring-2 focus:ring-red/30'
        : 'border border-border-subtle/50 text-text-primary focus:border-cyan focus:ring-2 focus:ring-cyan/20 hover:border-border-subtle'
    }`;

  const labelClass = "block text-sm font-semibold text-text-secondary uppercase tracking-wider";
  const hintClass = "mt-2 text-sm text-text-muted leading-relaxed";
  const errorClass = "mt-2 text-sm text-red font-medium animate-fade-in";

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-subtle/30 bg-gradient-to-b from-bg-surface to-bg-base">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan/[0.02] to-transparent pointer-events-none" />

      <div className="relative p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-muted/50">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-wide">Input Parameters</h2>
            <p className="text-sm text-text-muted mt-1">Configure your workload scenario</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setInput('volume', inputs.volume)}
              className="hidden sm:inline px-4 py-2 bg-bg-elevated/50 hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-subtle/50 rounded-lg text-sm font-medium transition-all hover:border-border-subtle"
            >
              Recalc
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-bg-elevated/50 hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-subtle/50 rounded-lg text-sm font-medium transition-all hover:border-border-subtle"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Date Selector for Assumptions */}
          <div className="p-4 rounded-lg bg-bg-elevated/30 border border-border-muted/30">
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
            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 text-sm text-text-secondary cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useAssumptions}
                  onChange={(e) => setUseAssumptions(e.target.checked)}
                  className="h-5 w-5 rounded border-border-subtle bg-bg-surface text-cyan focus:ring-cyan/30 focus:ring-2 cursor-pointer"
                />
                <span className="group-hover:text-text-primary transition-colors">Sync with assumptions</span>
              </label>
              <span className="text-sm text-text-muted">
                {useAssumptions ? 'Using campaign defaults' : 'Manual values'}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <label htmlFor="volume" className={labelClass}>
              Call Volume
              <span className="text-text-muted ml-2 lowercase font-normal">/interval</span>
            </label>
            <input
              id="volume"
              type="number"
              min="0"
              step="1"
              value={inputs.volume}
              onChange={(e) => updateInput('volume', e.target.value)}
              className={getInputClass(getError('volume'))}
              placeholder="100"
            />
            {getError('volume') && <p className={errorClass}>{getError('volume')}</p>}
          </div>

          {/* AHT */}
          <div>
            <label htmlFor="aht" className={labelClass}>
              AHT
              <span className="text-text-muted ml-2 lowercase font-normal">seconds</span>
            </label>
            <input
              id="aht"
              type="number"
              min="0"
              step="1"
              value={inputs.aht}
              onChange={(e) => updateInput('aht', e.target.value)}
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
              onChange={(e) => updateInput('intervalMinutes', e.target.value)}
              className={getInputClass(getError('intervalMinutes'))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            {getError('intervalMinutes') && <p className={errorClass}>{getError('intervalMinutes')}</p>}
          </div>

          {/* Model Selection */}
          <div className="pt-4 border-t border-border-muted/30">
            <label htmlFor="model" className={labelClass}>
              Model
            </label>
            <select
              id="model"
              value={inputs.model}
              onChange={(e) => updateInput('model', e.target.value)}
              className={getInputClass()}
            >
              <option value="B">Erlang B (blocking/loss)</option>
              <option value="C">Erlang C (queuing)</option>
              <option value="A">Erlang A (abandonment)</option>
            </select>
            <div className="mt-4 p-4 bg-bg-elevated/40 border border-border-muted/30 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-text-secondary leading-relaxed">
                {inputs.model === 'B' && (
                  <>
                    <span className="text-amber font-semibold">Erlang B:</span> Loss model. No queue - calls blocked if all lines busy. Best for trunks/IVR sizing.
                  </>
                )}
                {inputs.model === 'C' && (
                  <>
                    <span className="text-cyan font-semibold">Erlang C:</span> Queue model. Assumes infinite patience. May overestimate service level by 5-15%.
                  </>
                )}
                {inputs.model === 'A' && (
                  <>
                    <span className="text-green font-semibold">Erlang A:</span> Queue with abandonment. Requires patience setting. Most realistic for contact centres.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Average Patience - Only show for Erlang A */}
          {inputs.model === 'A' && (
            <div className="animate-fade-in">
              <label htmlFor="averagePatience" className={labelClass}>
                Patience
                <span className="text-text-muted ml-2 lowercase font-normal">seconds</span>
              </label>
              <input
                id="averagePatience"
                type="number"
                min="0"
                step="1"
                value={inputs.averagePatience}
                onChange={(e) => updateInput('averagePatience', e.target.value)}
                className={getInputClass(getError('averagePatience'))}
                placeholder="120"
              />
              {getError('averagePatience') ? <p className={errorClass}>{getError('averagePatience')}</p> : <p className={hintClass}>Average time before abandon. 60-180s typical</p>}
            </div>
          )}

          {/* Service Level Target */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-muted/30">
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
                onChange={(e) => updateInput('targetSLPercent', e.target.value)}
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
                onChange={(e) => updateInput('thresholdSeconds', e.target.value)}
                className={getInputClass(getError('thresholdSeconds'))}
                placeholder="20"
              />
              {getError('thresholdSeconds') && <p className={errorClass}>{getError('thresholdSeconds')}</p>}
            </div>
          </div>

          <div className="p-4 bg-cyan/5 border border-cyan/20 rounded-lg">
            <p className="text-base text-cyan">
              <span className="font-bold text-lg">{inputs.targetSLPercent}/{inputs.thresholdSeconds}</span>
              <span className="text-text-secondary ml-3">
                = {inputs.targetSLPercent}% answered within {inputs.thresholdSeconds}s
              </span>
            </p>
          </div>

          {/* Shrinkage */}
          <div className="pt-4 border-t border-border-muted/30">
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
              onChange={(e) => updateInput('shrinkagePercent', e.target.value)}
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
              onChange={(e) => updateInput('maxOccupancy', e.target.value)}
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
              onChange={(e) => updateInput('concurrency', e.target.value)}
              className={getInputClass()}
              placeholder="1"
            />
            <p className={hintClass}>Simultaneous contacts per agent (e.g., 3 for chat)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;

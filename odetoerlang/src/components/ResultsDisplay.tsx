import { memo, useEffect, useState } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { useToast } from './ui/Toast';
import { formatNumber, STICKY_HIDDEN_KEY } from './ResultsDisplay/resultsFormat';
import { RequiredVsActualSection } from './ResultsDisplay/RequiredVsActualSection';
import { KeyMetricsGrid } from './ResultsDisplay/KeyMetricsGrid';
import { PerformanceMetrics } from './ResultsDisplay/PerformanceMetrics';
import { AbandonmentSection } from './ResultsDisplay/AbandonmentSection';
import { SensitivityChart } from './ResultsDisplay/SensitivityChart';
import { StickyKPIBar } from './ResultsDisplay/StickyKPIBar';

const ResultsDisplay = memo(() => {
  const { results, inputs, staffingModel, achievableMetrics, activeProductivityModifier } = useCalculatorStore();
  const { addToast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STICKY_HIDDEN_KEY) === 'true') {
      setShowStickyBar(false);
    }
  }, []);

  if (!results) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border-subtle/30 bg-gradient-to-b from-bg-surface to-bg-base p-6">
        <h2 className="text-lg font-bold text-text-primary tracking-wide mb-4">Results</h2>
        <p className="text-text-muted text-base">Enter parameters to see results...</p>
      </div>
    );
  }

  const copyResultsForExcel = async () => {
    const headers = [
      'Model', 'Volume', 'AHT (s)', 'Interval (min)', 'Target SL (%)',
      'Threshold (s)', 'Max Occupancy (%)', 'Required Agents', 'FTE',
      'Service Level (%)', 'ASA (s)', 'Occupancy (%)',
    ];
    const row = [
      inputs.model, inputs.volume, inputs.aht, inputs.intervalMinutes,
      inputs.targetSLPercent, inputs.thresholdSeconds, inputs.maxOccupancy,
      results.requiredAgents,
      formatNumber(results.totalFTE, 1),
      formatNumber(results.serviceLevel, 1),
      formatNumber(results.asa, 1),
      formatNumber(results.occupancy, 1),
    ];
    const csv = `${headers.join(',')}\n${row.join(',')}`;

    try {
      await navigator.clipboard.writeText(csv);
      addToast('Copied results for Excel', 'success');
    } catch (err) {
      console.error('Clipboard write failed, falling back:', err);
      const textarea = document.createElement('textarea');
      textarea.value = csv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      addToast('Copied results (fallback) for Excel', 'success');
    }
  };

  const toggleSticky = () => {
    const next = !showStickyBar;
    setShowStickyBar(next);
    localStorage.setItem(STICKY_HIDDEN_KEY, next ? 'false' : 'true');
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-subtle/30 bg-gradient-to-b from-bg-surface to-bg-base">
      <div className="absolute inset-0 bg-gradient-to-br from-magenta/[0.02] to-transparent pointer-events-none" />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-muted/50">
          <div>
            <h2 className="text-lg font-bold text-text-primary tracking-wide">Results</h2>
            <p className="text-sm text-text-muted mt-1">Calculated staffing requirements</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSticky}
              className="text-sm text-text-muted hover:text-text-secondary underline transition-colors"
            >
              {showStickyBar ? 'Hide' : 'Show'} Sticky KPIs
            </button>
            <button
              type="button"
              onClick={copyResultsForExcel}
              className="text-sm font-semibold text-cyan bg-cyan/10 border border-cyan/30 rounded-lg px-4 py-2 hover:bg-cyan/20 transition-colors"
            >
              Copy for Excel
            </button>
          </div>
        </div>

        <RequiredVsActualSection />

        {!results.canAchieveTarget && (
          <div className="mb-6 p-4 bg-red/10 border border-red/30 rounded-lg">
            <p className="text-base text-red font-medium">
              Target {inputs.targetSLPercent}/{inputs.thresholdSeconds} unachievable. Review parameters.
            </p>
          </div>
        )}

        <KeyMetricsGrid />
        <PerformanceMetrics />
        <AbandonmentSection />

        {activeProductivityModifier !== undefined && activeProductivityModifier < 1.0 && (
          <div className="mt-6 p-4 bg-amber/10 border border-amber/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-amber font-bold uppercase tracking-wide">Reduced Productivity</p>
                <p className="text-sm text-amber/80 mt-1">Calendar events affecting staff efficiency</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber tabular-nums">{(activeProductivityModifier * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-5 bg-bg-elevated/40 border border-border-muted/30 rounded-xl backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Formula</h4>
          <div className="text-sm text-text-muted space-y-2 font-mono">
            <p>A = ({inputs.volume} x {inputs.aht}) / {inputs.intervalMinutes * 60} = <span className="text-cyan font-semibold">{formatNumber(results.trafficIntensity, 2)}</span> Erlangs</p>
            <p>{inputs.model.toUpperCase()}({formatNumber(results.trafficIntensity, 2)}, {inputs.targetSLPercent}/{inputs.thresholdSeconds}) = <span className="text-cyan font-semibold">{results.requiredAgents}</span> agents</p>
            <p>FTE = {results.requiredAgents} / (1 - {inputs.shrinkagePercent/100}) = <span className="text-magenta font-semibold">{formatNumber(results.totalFTE, 1)}</span></p>
          </div>
          {results.assumesStationary === true && (
            <p className="mt-3 text-xs text-amber-DEFAULT/80 font-mono">
              ⚠ Steady-state assumption: result accuracy degrades for intervals with bursty / non-stationary arrivals.
            </p>
          )}
        </div>

        {results.canAchieveTarget && (
          <div className="mt-6 p-5 bg-cyan/5 border border-cyan/20 rounded-xl">
            <h4 className="text-sm font-semibold text-cyan uppercase tracking-wider mb-3">Insights</h4>
            <ul className="text-sm text-text-secondary space-y-2">
              {results.occupancy < inputs.maxOccupancy * 0.7 && (
                <li>+ Low occupancy ({formatNumber(results.occupancy, 1)}%) - idle time likely</li>
              )}
              {results.occupancy > inputs.maxOccupancy * 0.95 && (
                <li>+ Near max occupancy - high agent load</li>
              )}
              {results.serviceLevel > inputs.targetSLPercent * 1.1 && (
                <li>+ SL exceeds target by {formatNumber(results.serviceLevel - inputs.targetSLPercent, 1)}%</li>
              )}
              {results.asa < inputs.thresholdSeconds / 2 && (
                <li>+ Excellent ASA ({formatNumber(results.asa, 1)}s)</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-6 p-4 bg-bg-elevated/40 border border-border-muted/30 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Debug</h4>
            <button
              type="button"
              onClick={() => setShowDebug((v) => !v)}
              className="text-sm text-cyan hover:text-cyan-dim transition-colors"
            >
              {showDebug ? 'Hide' : 'Show'}
            </button>
          </div>
          {showDebug && (
            <pre className="mt-4 text-sm text-text-muted bg-bg-surface border border-border-subtle/30 rounded-lg p-4 overflow-auto max-h-60">
{JSON.stringify({
  inputs,
  results,
  staffingModel,
  achievableMetrics,
  activeProductivityModifier,
}, null, 2)}
            </pre>
          )}
        </div>

        <SensitivityChart />
        <StickyKPIBar visible={showStickyBar} />
      </div>
    </div>
  );
});

export default ResultsDisplay;

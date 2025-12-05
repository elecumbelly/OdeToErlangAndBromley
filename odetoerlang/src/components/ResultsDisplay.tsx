import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore';

const ResultsDisplay: React.FC = () => {
  const { results, inputs, abandonmentMetrics, actualStaff } = useCalculatorStore();

  if (!results) {
    return (
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">Results</h2>
        <p className="text-text-muted text-xs">Enter parameters to see results...</p>
      </div>
    );
  }

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === Infinity) return '∞';
    if (isNaN(num)) return '-';
    return num.toFixed(decimals);
  };

  const formatTime = (seconds: number): string => {
    if (seconds === Infinity) return '∞';
    if (isNaN(seconds)) return '-';
    if (seconds < 60) return `${formatNumber(seconds, 0)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (value: number, target: number): string => {
    if (value >= target) return 'text-green';
    if (value >= target * 0.9) return 'text-amber';
    return 'text-red';
  };

  const getOccupancyColor = (occupancy: number): string => {
    if (occupancy > inputs.maxOccupancy) return 'text-red';
    if (occupancy > inputs.maxOccupancy * 0.95) return 'text-amber';
    return 'text-green';
  };

  // Calculate staffing gap
  const hasActualStaff = actualStaff.totalFTE > 0 || actualStaff.productiveAgents > 0;
  const staffingGap = hasActualStaff ? actualStaff.productiveAgents - results.requiredAgents : 0;
  const isOverstaffed = staffingGap > 0;
  const isUnderstaffed = staffingGap < 0;

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4 pb-3 border-b border-border-muted">
        Results
      </h2>

      {/* Required vs Actual Comparison */}
      {hasActualStaff && (
        <div className="mb-4 p-3 bg-bg-elevated border border-border-muted rounded-lg">
          <h3 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            Required vs Actual
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-surface border border-cyan/20 rounded p-2">
              <p className="text-2xs text-text-muted uppercase">Required</p>
              <p className="text-xl font-bold text-cyan tabular-nums">{results.requiredAgents}</p>
              <p className="text-2xs text-text-muted">{formatNumber(results.totalFTE, 1)} FTE</p>
            </div>
            <div className="bg-bg-surface border border-green/20 rounded p-2">
              <p className="text-2xs text-text-muted uppercase">Actual</p>
              <p className="text-xl font-bold text-green tabular-nums">{actualStaff.productiveAgents}</p>
              <p className="text-2xs text-text-muted">{formatNumber(actualStaff.totalFTE, 1)} FTE</p>
            </div>
          </div>

          {/* Gap */}
          <div className={`mt-2 p-2 rounded ${isOverstaffed ? 'bg-green/5 border border-green/20' : isUnderstaffed ? 'bg-red/5 border border-red/20' : 'bg-bg-hover border border-border-muted'}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xs text-text-secondary uppercase">Gap</span>
              <span className={`text-sm font-bold tabular-nums ${isOverstaffed ? 'text-green' : isUnderstaffed ? 'text-red' : 'text-text-secondary'}`}>
                {staffingGap > 0 ? '+' : ''}{staffingGap}
              </span>
            </div>
            {isUnderstaffed && (
              <p className="text-2xs text-red mt-1">Need {Math.abs(staffingGap)} more for SL target</p>
            )}
          </div>
        </div>
      )}

      {!results.canAchieveTarget && (
        <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg">
          <p className="text-xs text-red">
            Target {inputs.targetSLPercent}/{inputs.thresholdSeconds} unachievable. Review parameters.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Required Agents */}
        <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-3">
          <p className="text-2xs text-text-muted uppercase tracking-widest">Agents</p>
          <p className="text-3xl font-bold text-cyan tabular-nums text-glow-cyan">
            {results.requiredAgents}
          </p>
          <p className="text-2xs text-text-muted">productive</p>
        </div>

        {/* Total FTE */}
        <div className="bg-magenta/5 border border-magenta/20 rounded-lg p-3">
          <p className="text-2xs text-text-muted uppercase tracking-widest">FTE</p>
          <p className="text-3xl font-bold text-magenta tabular-nums">
            {formatNumber(results.totalFTE, 1)}
          </p>
          <p className="text-2xs text-text-muted">+{inputs.shrinkagePercent}% shrinkage</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-2">
        {/* Service Level */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">Service Level</p>
            <p className="text-2xs text-text-muted">Target: {inputs.targetSLPercent}%</p>
          </div>
          <p className={`text-lg font-bold tabular-nums ${getStatusColor(results.serviceLevel, inputs.targetSLPercent)}`}>
            {formatNumber(results.serviceLevel, 1)}%
          </p>
        </div>

        {/* ASA */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">ASA</p>
            <p className="text-2xs text-text-muted">Avg wait time</p>
          </div>
          <p className="text-lg font-bold text-text-primary tabular-nums">
            {formatTime(results.asa)}
          </p>
        </div>

        {/* Occupancy */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">Occupancy</p>
            <p className="text-2xs text-text-muted">Max: {inputs.maxOccupancy}%</p>
          </div>
          <p className={`text-lg font-bold tabular-nums ${getOccupancyColor(results.occupancy)}`}>
            {formatNumber(results.occupancy, 1)}%
          </p>
        </div>

        {/* Traffic */}
        <div className="flex justify-between items-center p-2 bg-bg-elevated border border-border-muted rounded">
          <div>
            <p className="text-xs text-text-primary">Traffic</p>
            <p className="text-2xs text-text-muted">Erlangs</p>
          </div>
          <p className="text-lg font-bold text-text-primary tabular-nums">
            {formatNumber(results.trafficIntensity, 2)}
          </p>
        </div>
      </div>

      {/* Abandonment Metrics */}
      {abandonmentMetrics && (inputs.model === 'erlangA' || inputs.model === 'erlangX') && (
        <div className="mt-4 pt-3 border-t border-border-muted">
          <h3 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
            Abandonment
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-amber/5 border border-amber/20 rounded">
              <div>
                <p className="text-xs text-text-primary">Abandon Rate</p>
                <p className="text-2xs text-text-muted">{formatNumber(abandonmentMetrics.expectedAbandonments, 0)} contacts</p>
              </div>
              <p className="text-lg font-bold text-amber tabular-nums">
                {formatNumber(abandonmentMetrics.abandonmentRate * 100, 1)}%
              </p>
            </div>

            <div className="flex justify-between items-center p-2 bg-green/5 border border-green/20 rounded">
              <div>
                <p className="text-xs text-text-primary">Answered</p>
                <p className="text-2xs text-text-muted">{formatNumber((abandonmentMetrics.answeredContacts / inputs.volume) * 100, 1)}% of total</p>
              </div>
              <p className="text-lg font-bold text-green tabular-nums">
                {formatNumber(abandonmentMetrics.answeredContacts, 0)}
              </p>
            </div>

            {inputs.model === 'erlangX' && abandonmentMetrics.retrialProbability !== undefined && (
              <>
                <div className="flex justify-between items-center p-2 bg-magenta/5 border border-magenta/20 rounded">
                  <div>
                    <p className="text-xs text-text-primary">Retrial Prob</p>
                    <p className="text-2xs text-text-muted">Callbacks</p>
                  </div>
                  <p className="text-lg font-bold text-magenta tabular-nums">
                    {formatNumber(abandonmentMetrics.retrialProbability * 100, 1)}%
                  </p>
                </div>

                {abandonmentMetrics.virtualTraffic !== undefined && (
                  <div className="flex justify-between items-center p-2 bg-blue/5 border border-blue/20 rounded">
                    <div>
                      <p className="text-xs text-text-primary">Virtual Traffic</p>
                      <p className="text-2xs text-text-muted">+retrials</p>
                    </div>
                    <p className="text-lg font-bold text-blue tabular-nums">
                      {formatNumber(abandonmentMetrics.virtualTraffic, 2)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Formula Breakdown */}
      <div className="mt-4 p-3 bg-bg-elevated border border-border-muted rounded-lg">
        <h4 className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Formula</h4>
        <div className="text-2xs text-text-muted space-y-1 font-mono">
          <p>A = ({inputs.volume} x {inputs.aht}) / {inputs.intervalMinutes * 60} = <span className="text-cyan">{formatNumber(results.trafficIntensity, 2)}</span> Erlangs</p>
          <p>{inputs.model.toUpperCase()}({formatNumber(results.trafficIntensity, 2)}, {inputs.targetSLPercent}/{inputs.thresholdSeconds}) = <span className="text-cyan">{results.requiredAgents}</span> agents</p>
          <p>FTE = {results.requiredAgents} / (1 - {inputs.shrinkagePercent/100}) = <span className="text-magenta">{formatNumber(results.totalFTE, 1)}</span></p>
        </div>
      </div>

      {/* Insights */}
      {results.canAchieveTarget && (
        <div className="mt-4 p-3 bg-cyan/5 border border-cyan/20 rounded-lg">
          <h4 className="text-2xs font-semibold text-cyan uppercase tracking-widest mb-1">Insights</h4>
          <ul className="text-2xs text-text-secondary space-y-1">
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
              <li>+ Excellent ASA ({formatTime(results.asa)})</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;

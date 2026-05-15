import { memo } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { formatNumber, formatTime, getStatusColor } from './resultsFormat';

export const KeyMetricsGrid = memo(() => {
  const { results, inputs, achievableMetrics } = useCalculatorStore();
  if (!results) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6" role="status" aria-live="polite" aria-atomic="false">
      {inputs.solveFor === 'sl' && achievableMetrics ? (
        <>
          <div className={`border rounded-xl p-5 ${getStatusColor(achievableMetrics.serviceLevel, inputs.targetSLPercent) === 'text-green' ? 'bg-green/5 border-green/20' : 'bg-amber/5 border-amber/20'}`}>
            <p className="text-sm text-text-muted uppercase tracking-wider">Achieved SL</p>
            <p className={`text-4xl font-bold tabular-nums mt-2 ${getStatusColor(achievableMetrics.serviceLevel, inputs.targetSLPercent)}`}>
              {formatNumber(achievableMetrics.serviceLevel, 1)}%
            </p>
            <p className="text-sm text-text-muted mt-2">Target: {inputs.targetSLPercent}%</p>
          </div>

          <div className="bg-bg-elevated/40 border border-border-muted/30 rounded-xl p-5">
            <p className="text-sm text-text-muted uppercase tracking-wider">Expected ASA</p>
            <p className="text-4xl font-bold text-text-primary tabular-nums mt-2">
              {formatTime(achievableMetrics.asa)}
            </p>
            <p className="text-sm text-text-muted mt-2">Threshold: {inputs.thresholdSeconds}s</p>
          </div>
        </>
      ) : (
        <>
          <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-5">
            <p className="text-sm text-text-muted uppercase tracking-wider">Agents</p>
            <p className="text-4xl font-bold text-cyan tabular-nums text-glow-cyan mt-2">
              {results.requiredAgents}
            </p>
            <p className="text-sm text-text-muted mt-2">productive</p>
          </div>

          <div className="bg-magenta/5 border border-magenta/20 rounded-xl p-5">
            <p className="text-sm text-text-muted uppercase tracking-wider">FTE</p>
            <p className="text-4xl font-bold text-magenta tabular-nums mt-2">
              {formatNumber(results.totalFTE, 1)}
            </p>
            <p className="text-sm text-text-muted mt-2">+{inputs.shrinkagePercent}% shrinkage</p>
          </div>
        </>
      )}
    </div>
  );
});

KeyMetricsGrid.displayName = 'KeyMetricsGrid';

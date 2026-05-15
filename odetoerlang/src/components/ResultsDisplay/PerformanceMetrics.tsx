import { memo } from 'react';
import { useCalculatorStore, calculateProductiveAgents } from '../../store/calculatorStore';
import { formatNumber, formatTime, getStatusColor, getOccupancyColor } from './resultsFormat';

export const PerformanceMetrics = memo(() => {
  const { results, inputs, achievableMetrics, staffingModel } = useCalculatorStore();
  if (!results) return null;

  const { productiveAgents } = calculateProductiveAgents(staffingModel, inputs.shrinkagePercent);
  const occupancyShortfall = achievableMetrics?.requiredAgentsForMaxOccupancy !== undefined
    ? Math.max(0, achievableMetrics.requiredAgentsForMaxOccupancy - (achievableMetrics.actualAgents ?? productiveAgents))
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center p-4 bg-bg-elevated/40 border border-border-muted/30 rounded-lg backdrop-blur-sm">
        <div>
          <p className="text-base text-text-primary font-medium">Service Level</p>
          <p className="text-sm text-text-muted">Target: {inputs.targetSLPercent}%</p>
        </div>
        <div className="text-right min-w-[140px]">
          <p className={`text-2xl font-bold tabular-nums ${getStatusColor(results.serviceLevel, inputs.targetSLPercent)}`}>
            {formatNumber(results.serviceLevel, 1)}%
          </p>
          <div className="w-full bg-bg-surface border border-border-subtle/30 rounded-full h-2.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan transition-all rounded-full"
              style={{ width: `${Math.min(100, (results.serviceLevel / inputs.targetSLPercent) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center p-4 bg-bg-elevated/40 border border-border-muted/30 rounded-lg backdrop-blur-sm">
        <div>
          <p className="text-base text-text-primary font-medium">ASA</p>
          <p className="text-sm text-text-muted">Avg wait time</p>
        </div>
        <div className="text-right min-w-[140px]">
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {formatTime(results.asa)}
          </p>
          <div className="w-full bg-bg-surface border border-border-subtle/30 rounded-full h-2.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-green transition-all rounded-full"
              style={{ width: `${Math.min(100, (inputs.thresholdSeconds / Math.max(inputs.thresholdSeconds, results.asa)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center p-4 bg-bg-elevated/40 border border-border-muted/30 rounded-lg backdrop-blur-sm">
        <div>
          <p className="text-base text-text-primary font-medium">Occupancy</p>
          <p className="text-sm text-text-muted">Max: {inputs.maxOccupancy}%</p>
        </div>
        <div className="text-right min-w-[140px]">
          <p className={`text-2xl font-bold tabular-nums ${getOccupancyColor(results.occupancy, inputs.maxOccupancy)}`}>
            {formatNumber(results.occupancy, 1)}%
          </p>
          <div className="w-full bg-bg-surface border border-border-subtle/30 rounded-full h-2.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-amber transition-all rounded-full"
              style={{ width: `${Math.min(100, (results.occupancy / inputs.maxOccupancy) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
      {achievableMetrics?.occupancyCapApplied && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber/10 border border-amber/30 rounded-lg">
          <span className="text-sm font-semibold text-amber uppercase tracking-wide">Occupancy Cap Hit</span>
          {occupancyShortfall > 0 && (
            <span className="text-sm text-amber">+{occupancyShortfall} agents needed to stay at {inputs.maxOccupancy}%</span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center p-4 bg-bg-elevated/40 border border-border-muted/30 rounded-lg backdrop-blur-sm">
        <div>
          <p className="text-base text-text-primary font-medium">Traffic</p>
          <p className="text-sm text-text-muted">Erlangs</p>
        </div>
        <p className="text-2xl font-bold text-text-primary tabular-nums">
          {formatNumber(results.trafficIntensity, 2)}
        </p>
      </div>
    </div>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';

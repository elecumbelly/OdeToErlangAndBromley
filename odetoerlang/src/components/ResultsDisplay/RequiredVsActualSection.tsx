import { memo } from 'react';
import { useCalculatorStore, calculateProductiveAgents } from '../../store/calculatorStore';
import { formatNumber, formatTime, getStatusColor, getOccupancyColor } from './resultsFormat';

export const RequiredVsActualSection = memo(() => {
  const { results, inputs, staffingModel, achievableMetrics } = useCalculatorStore();
  if (!results || staffingModel.totalHeadcount <= 0) return null;

  const { staffPerShift, productiveAgents } = calculateProductiveAgents(staffingModel, inputs.shrinkagePercent);
  const staffingGap = productiveAgents - results.requiredAgents;
  const isOverstaffed = staffingGap > 0;
  const isUnderstaffed = staffingGap < 0;

  return (
    <div className="mb-6 p-5 bg-bg-elevated/40 border border-border-muted/30 rounded-xl backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
        Required vs Your Staff
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-4">
          <p className="text-sm text-text-muted uppercase tracking-wide">Required</p>
          <p className="text-3xl font-bold text-cyan tabular-nums mt-1">{results.requiredAgents}</p>
          <p className="text-sm text-text-muted mt-1">{formatNumber(results.totalFTE, 1)} FTE</p>
        </div>
        <div className="bg-green/5 border border-green/20 rounded-lg p-4">
          <p className="text-sm text-text-muted uppercase tracking-wide">Your Staff</p>
          <p className="text-3xl font-bold text-green tabular-nums mt-1">{productiveAgents}</p>
          <p className="text-sm text-text-muted mt-1">{staffPerShift} per shift</p>
        </div>
      </div>

      <div className={`mt-4 p-4 rounded-lg ${isOverstaffed ? 'bg-green/5 border border-green/20' : isUnderstaffed ? 'bg-red/5 border border-red/20' : 'bg-bg-elevated/30 border border-border-muted/30'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary uppercase tracking-wide">Gap</span>
          <span className={`text-xl font-bold tabular-nums ${isOverstaffed ? 'text-green' : isUnderstaffed ? 'text-red' : 'text-text-secondary'}`}>
            {staffingGap > 0 ? '+' : ''}{staffingGap}
          </span>
        </div>
        {isUnderstaffed && (
          <p className="text-sm text-red mt-2">Need {Math.abs(staffingGap)} more for SL target</p>
        )}
      </div>

      {achievableMetrics && staffingModel.useAsConstraint && (
        <div className="mt-4 pt-4 border-t border-border-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-amber uppercase tracking-wider">
              With Your {achievableMetrics.actualAgents ?? productiveAgents} Agents
            </h4>
            {achievableMetrics.occupancyCapApplied && (
              <span className="text-xs font-semibold text-amber uppercase bg-amber/10 border border-amber/30 rounded-lg px-3 py-1 flex items-center gap-2">
                <span>Cap Applied</span>
                {achievableMetrics.occupancyPenalty !== undefined && (
                  <span className="text-xs font-normal text-amber/80">
                    ({Math.round((achievableMetrics.occupancyPenalty ?? 1) * 100)}% effective)
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mb-4">
            Effective agents available: <span className="font-semibold text-text-primary">{achievableMetrics.effectiveAgents ?? productiveAgents}</span>
          </p>
          {achievableMetrics.occupancyCapApplied && achievableMetrics.requiredAgentsForMaxOccupancy && (
            <div className="mb-4 p-4 bg-amber/10 border border-amber/30 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-amber mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber">
                <p className="font-semibold uppercase tracking-wide">Occupancy Cap Hit</p>
                <p className="mt-1">
                  Need <span className="font-semibold">{achievableMetrics.requiredAgentsForMaxOccupancy - (achievableMetrics.actualAgents ?? productiveAgents)}</span> more productive agents to stay at {inputs.maxOccupancy}% occupancy. Service level shown below includes this penalty.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-bg-surface/50 border border-amber/20 rounded-lg p-4 text-center">
              <p className="text-sm text-text-muted">SL</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${getStatusColor(achievableMetrics.serviceLevel, inputs.targetSLPercent)}`}>
                {formatNumber(achievableMetrics.serviceLevel, 1)}%
              </p>
            </div>
            <div className="bg-bg-surface/50 border border-amber/20 rounded-lg p-4 text-center">
              <p className="text-sm text-text-muted">ASA</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums mt-1">
                {formatTime(achievableMetrics.asa)}
              </p>
            </div>
            <div className="bg-bg-surface/50 border border-amber/20 rounded-lg p-4 text-center">
              <p className="text-sm text-text-muted">Occ</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${getOccupancyColor(achievableMetrics.occupancy, inputs.maxOccupancy)}`}>
                {formatNumber(achievableMetrics.occupancy, 1)}%
              </p>
            </div>
          </div>
          {achievableMetrics.actualOccupancy !== undefined && (
            <div className="mt-4 p-4 bg-bg-surface/50 border border-border-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted uppercase tracking-wide">Actual Occupancy</p>
                  <p className="text-sm text-text-muted mt-1">If all {achievableMetrics.actualAgents ?? productiveAgents} agents are scheduled</p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${getOccupancyColor(achievableMetrics.actualOccupancy, inputs.maxOccupancy)}`}>
                  {formatNumber(achievableMetrics.actualOccupancy, 1)}%
                </p>
              </div>
              {achievableMetrics.occupancyCapApplied && (
                <p className="text-sm text-amber mt-2">
                  Max occupancy {inputs.maxOccupancy}% limits usable agents to {achievableMetrics.effectiveAgents ?? productiveAgents}.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

RequiredVsActualSection.displayName = 'RequiredVsActualSection';

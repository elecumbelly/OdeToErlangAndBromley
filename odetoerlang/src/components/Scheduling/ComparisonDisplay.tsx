import { memo } from 'react';
import type { ScheduleRun, ScheduleMetric } from '../../lib/database/dataAccess';
import { compareMetric } from './schedulingTypes';

interface ComparisonDisplayProps {
  comparisonGroup: { groupId: string; runs: ScheduleRun[] } | null;
  metricsByRunId: Map<number, ScheduleMetric>;
}

export const ComparisonDisplay = memo(({ comparisonGroup, metricsByRunId }: ComparisonDisplayProps) => {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
        A/B Comparison
      </h3>
      {comparisonGroup ? (() => {
        const runsByLabel = new Map(comparisonGroup.runs.map((run) => [run.label ?? '-', run]));
        const runA = runsByLabel.get('A');
        const runB = runsByLabel.get('B');
        const metricA = runA ? metricsByRunId.get(runA.id) : undefined;
        const metricB = runB ? metricsByRunId.get(runB.id) : undefined;
        const metrics = [
          compareMetric('Coverage', metricA?.coverage_percent, metricB?.coverage_percent, '%'),
          compareMetric('Gap (min)', metricA?.gap_minutes, metricB?.gap_minutes),
          compareMetric('Overstaff (min)', metricA?.overstaff_minutes, metricB?.overstaff_minutes),
          compareMetric('Overtime (min)', metricA?.overtime_minutes, metricB?.overtime_minutes),
          compareMetric('Violations', metricA?.violations_count, metricB?.violations_count),
          compareMetric('Cost', metricA?.cost_estimate, metricB?.cost_estimate),
        ];
        return (
          <div className="space-y-3 text-xs text-text-secondary">
            <div className="grid grid-cols-4 gap-2 text-2xs uppercase tracking-widest text-text-muted">
              <span>Metric</span>
              <span>Method A</span>
              <span>Method B</span>
              <span>Delta</span>
            </div>
            {metrics.map((metric) => (
              <div key={metric.label} className="grid grid-cols-4 gap-2">
                <span>{metric.label}</span>
                <span>{metric.valueA}</span>
                <span>{metric.valueB}</span>
                <span>{metric.delta}</span>
              </div>
            ))}
            {!metricA || !metricB ? (
              <p className="text-2xs text-text-muted">
                Metrics appear once both runs complete.
              </p>
            ) : null}
          </div>
        );
      })() : (
        <p className="text-xs text-text-muted">Run a pair of methods to compare results.</p>
      )}
    </div>
  );
});

ComparisonDisplay.displayName = 'ComparisonDisplay';

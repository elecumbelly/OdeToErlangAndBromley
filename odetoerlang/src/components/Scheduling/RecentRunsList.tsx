import { memo } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import type { ScheduleRun, ScheduleMetric, OptimizationMethod } from '../../lib/database/dataAccess';
import { statusVariant } from './schedulingTypes';

interface RecentRunsListProps {
  runGroups: Array<{ groupId: string; runs: ScheduleRun[] }>;
  metricsByRunId: Map<number, ScheduleMetric>;
  methodLookup: Map<number, OptimizationMethod>;
}

export const RecentRunsList = memo(({ runGroups, metricsByRunId, methodLookup }: RecentRunsListProps) => {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
        Recent Runs
      </h3>
      {runGroups.length === 0 ? (
        <p className="text-xs text-text-muted">No runs yet for this plan.</p>
      ) : (
        <div className="space-y-3">
          {runGroups.map((group) => {
            const runsByLabel = new Map(group.runs.map((run) => [run.label ?? '-', run]));
            const runA = runsByLabel.get('A');
            const runB = runsByLabel.get('B');
            return (
              <div
                key={group.groupId}
                className="border border-border-muted rounded-lg p-3 bg-bg-elevated"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-text-secondary">
                    Group {group.groupId.slice(0, 8)}
                  </p>
                  <p className="text-2xs text-text-muted">
                    {group.runs[0]?.created_at ?? 'Unknown time'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[{ label: 'A', run: runA }, { label: 'B', run: runB }].map(({ label, run }) => (
                    <div
                      key={label}
                      className="border border-border-subtle rounded-md p-3 bg-bg-surface"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-primary">
                          Method {label}
                        </span>
                        <StatusBadge size="sm" variant={statusVariant(run?.status ?? 'Pending')}>
                          {run?.status ?? 'Pending'}
                        </StatusBadge>
                      </div>
                      <p className="text-2xs text-text-secondary">
                        {run ? methodLookup.get(run.method_id)?.method_name ?? 'Unknown method' : 'Not run'}
                      </p>
                      {run && metricsByRunId.get(run.id) ? (
                        <div className="text-2xs text-text-muted mt-2 space-y-1">
                          <p>Coverage: {metricsByRunId.get(run.id)?.coverage_percent}%</p>
                          <p>Gap: {metricsByRunId.get(run.id)?.gap_minutes} min</p>
                          <p>Violations: {metricsByRunId.get(run.id)?.violations_count}</p>
                        </div>
                      ) : (
                        <p className="text-2xs text-text-muted mt-1">
                          Coverage and cost metrics will appear once the run completes.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

RecentRunsList.displayName = 'RecentRunsList';

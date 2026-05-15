import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import type { SchedulePlan } from '../../lib/database/dataAccess';
import type { CoverageSummary } from './schedulingTypes';

interface CoverageRequirementsCardProps {
  selectedPlan: SchedulePlan | null;
  coverageSummary: CoverageSummary | null;
  coverageError: string | null;
  onGenerate: () => void;
}

export function CoverageRequirementsCard({
  selectedPlan,
  coverageSummary,
  coverageError,
  onGenerate,
}: CoverageRequirementsCardProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Coverage Requirements
        </h3>
        <StatusBadge size="sm" variant={coverageSummary?.total ? 'info' : 'neutral'}>
          {coverageSummary?.total ? `${coverageSummary.total} rows` : 'Not generated'}
        </StatusBadge>
      </div>
      {selectedPlan ? (
        <div className="space-y-2 text-xs text-text-secondary">
          {coverageSummary?.total ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-text-muted uppercase tracking-widest text-2xs">Days</p>
                <p>{coverageSummary.dates}</p>
              </div>
              <div>
                <p className="text-text-muted uppercase tracking-widest text-2xs">Skills</p>
                <p>{coverageSummary.skills}</p>
              </div>
              <div>
                <p className="text-text-muted uppercase tracking-widest text-2xs">Intervals</p>
                <p>{coverageSummary.intervals}</p>
              </div>
              <div>
                <p className="text-text-muted uppercase tracking-widest text-2xs">Interval Size</p>
                <p>{selectedPlan.interval_minutes} min</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Generate coverage before running optimization to populate demand by interval and skill.
            </p>
          )}
          {coverageError && (
            <div className="p-2 text-xs text-red border border-red/30 bg-red/10 rounded">
              {coverageError}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={onGenerate}>
              {coverageSummary?.total ? 'Regenerate Coverage' : 'Generate Coverage'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">Select a schedule plan to generate coverage.</p>
      )}
    </div>
  );
}

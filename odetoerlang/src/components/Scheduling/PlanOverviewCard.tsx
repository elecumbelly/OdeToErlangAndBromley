import { memo } from 'react';
import type { SchedulePlan } from '../../lib/database/dataAccess';
import { formatMinutes } from './schedulingTypes';

interface PlanOverviewCardProps {
  selectedPlan: SchedulePlan | null;
}

export const PlanOverviewCard = memo(({ selectedPlan }: PlanOverviewCardProps) => {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
        Plan Overview
      </h3>
      {selectedPlan ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-secondary">
          <div>
            <p className="text-text-muted uppercase tracking-widest text-2xs">Date Range</p>
            <p>{selectedPlan.start_date} to {selectedPlan.end_date}</p>
          </div>
          <div>
            <p className="text-text-muted uppercase tracking-widest text-2xs">Rules</p>
            <p>{selectedPlan.max_weekly_hours} hrs/week, {selectedPlan.min_rest_hours} hrs rest</p>
          </div>
          <div>
            <p className="text-text-muted uppercase tracking-widest text-2xs">Breaks</p>
            <p>{formatMinutes(selectedPlan.break_window_start_min)} to {formatMinutes(selectedPlan.break_window_end_min)}</p>
          </div>
          <div>
            <p className="text-text-muted uppercase tracking-widest text-2xs">Lunch</p>
            <p>{formatMinutes(selectedPlan.lunch_window_start_min)} to {formatMinutes(selectedPlan.lunch_window_end_min)}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">
          Select a schedule plan to see details and run optimization.
        </p>
      )}
    </div>
  );
});

PlanOverviewCard.displayName = 'PlanOverviewCard';

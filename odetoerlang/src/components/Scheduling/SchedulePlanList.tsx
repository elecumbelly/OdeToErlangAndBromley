import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import type { SchedulePlan, Campaign } from '../../lib/database/dataAccess';
import { dateToInput, statusVariant } from './schedulingTypes';

interface SchedulePlanListProps {
  plans: SchedulePlan[];
  selectedPlanId: number | null;
  selectedPlan: SchedulePlan | null;
  selectedCampaign: Campaign | null;
  selectedCampaignId: number | null;
  selectedScenarioId: number | null;
  onSelectPlan: (id: number) => void;
  onCreatePlan: (plan: Omit<SchedulePlan, 'id' | 'created_at' | 'updated_at'>) => number;
  onDeletePlan: (id: number) => void;
}

export function SchedulePlanList({
  plans,
  selectedPlanId,
  selectedPlan,
  selectedCampaign,
  selectedCampaignId,
  selectedScenarioId,
  onSelectPlan,
  onCreatePlan,
  onDeletePlan,
}: SchedulePlanListProps) {
  const handleCreateDemo = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const id = onCreatePlan({
      plan_name: 'Demo Weekly Plan',
      campaign_id: selectedCampaignId || 1,
      scenario_id: selectedScenarioId || null,
      start_date: dateToInput(today),
      end_date: dateToInput(nextWeek),
      interval_minutes: 30,
      max_weekly_hours: 40,
      min_rest_hours: 11,
      allow_skill_switch: true,
      break_window_start_min: 60,
      break_window_end_min: 480,
      lunch_window_start_min: 180,
      lunch_window_end_min: 360,
      status: 'Draft',
      created_by: 'system',
    });
    if (id > 0) onSelectPlan(id);
  };

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Schedule Plans
        </h3>
        <StatusBadge size="sm" variant={selectedCampaignId ? 'info' : 'neutral'}>
          {selectedCampaign?.campaign_name || 'No campaign'}
        </StatusBadge>
      </div>
      {plans.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-border-muted rounded-xl bg-bg-surface/30">
          <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-3 text-text-secondary">
            📅
          </div>
          <p className="text-text-primary font-medium text-sm">No schedule plans</p>
          <p className="text-text-muted text-xs mt-1 mb-4">Create a plan or start with a demo setup.</p>
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={handleCreateDemo}
          >
            Create Demo Plan
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`w-full text-left p-2 rounded-md border transition-all ${
                selectedPlanId === plan.id
                  ? 'border-cyan/40 bg-cyan/5'
                  : 'border-border-muted hover:border-border-subtle hover:bg-bg-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">{plan.plan_name}</span>
                <StatusBadge size="sm" variant={statusVariant(plan.status)}>
                  {plan.status}
                </StatusBadge>
              </div>
              <p className="text-2xs text-text-muted mt-1">
                {plan.start_date} to {plan.end_date}
              </p>
            </button>
          ))}
        </div>
      )}
      {selectedPlan && (
        <div className="mt-3 pt-3 border-t border-border-muted flex justify-between text-2xs text-text-muted">
          <span>Interval: {selectedPlan.interval_minutes} min</span>
          <button
            onClick={() => {
              if (confirm('Delete this schedule plan?')) {
                onDeletePlan(selectedPlan.id);
              }
            }}
            className="text-red hover:text-red/80 transition-colors"
          >
            Delete Plan
          </button>
        </div>
      )}
    </div>
  );
}

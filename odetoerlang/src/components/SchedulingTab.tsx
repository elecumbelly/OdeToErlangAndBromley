import { useEffect, useMemo, useState } from 'react';
import { useDatabaseStore } from '../store/databaseStore';
import { useCalculatorStore } from '../store/calculatorStore';
import { Button } from './ui/Button';
import { generateCoverageRequirements } from '../lib/scheduling/coverageGenerator';
import {
  getCoverageRequirements,
  getScheduleMetricsByRunIds,
  type ScheduleMetric,
  type SchedulePlan,
} from '../lib/database/dataAccess';
import {
  type PlanFormState,
  type CoverageSummary,
  createDefaultPlanState,
  summarizeCoverageRequirements,
} from './Scheduling/schedulingTypes';
import { useEntityForm } from '../hooks/useEntityForm';
import { PlanOverviewCard } from './Scheduling/PlanOverviewCard';
import { ComparisonDisplay } from './Scheduling/ComparisonDisplay';
import { RecentRunsList } from './Scheduling/RecentRunsList';
import { SchedulePlanList } from './Scheduling/SchedulePlanList';
import { PlanFormCard } from './Scheduling/PlanFormCard';
import { CoverageRequirementsCard } from './Scheduling/CoverageRequirementsCard';
import { OptimizationRunner } from './Scheduling/OptimizationRunner';

export default function SchedulingTab() {
  const {
    campaigns,
    scenarios,
    selectedCampaignId,
    selectedScenarioId,
    schedulePlans,
    scheduleRuns,
    shiftTemplates,
    optimizationMethods,
    selectedSchedulePlanId,
    refreshSchedulePlans,
    refreshScheduleRuns,
    refreshShiftTemplates,
    refreshOptimizationMethods,
    selectSchedulePlan,
    addSchedulePlan,
    editSchedulePlan,
    removeSchedulePlan,
    addScheduleRun,
  } = useDatabaseStore();
  const { inputs } = useCalculatorStore();

  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
  const [metricsByRunId, setMetricsByRunId] = useState<Map<number, ScheduleMetric>>(new Map());
  const [comparisonGroupId, setComparisonGroupId] = useState<string | null>(null);

  const selectedPlan = schedulePlans.find((plan) => plan.id === selectedSchedulePlanId) || null;
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || null;
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || null;

  useEffect(() => {
    refreshSchedulePlans();
    refreshShiftTemplates();
    refreshOptimizationMethods();
  }, [refreshSchedulePlans, refreshShiftTemplates, refreshOptimizationMethods]);

  useEffect(() => {
    refreshSchedulePlans();
    selectSchedulePlan(null);
  }, [selectedCampaignId, refreshSchedulePlans, selectSchedulePlan]);

  useEffect(() => {
    refreshScheduleRuns(selectedSchedulePlanId);
  }, [selectedSchedulePlanId, refreshScheduleRuns]);

  useEffect(() => {
    if (!selectedPlan) {
      setCoverageSummary(null);
      return;
    }
    setCoverageSummary(summarizeCoverageRequirements(getCoverageRequirements(selectedPlan.id)));
  }, [selectedPlan, scheduleRuns]);

  useEffect(() => {
    if (scheduleRuns.length === 0) {
      setMetricsByRunId(new Map());
      return;
    }
    const metrics = getScheduleMetricsByRunIds(scheduleRuns.map((run) => run.id));
    setMetricsByRunId(new Map(metrics.map((metric) => [metric.schedule_run_id, metric])));
  }, [scheduleRuns]);

  const runGroups = useMemo(() => {
    const groups = new Map<string, typeof scheduleRuns>();
    scheduleRuns.forEach((run) => {
      const key = run.run_group_id ?? `run-${run.id}`;
      const group = groups.get(key) ?? [];
      group.push(run);
      groups.set(key, group);
    });
    return Array.from(groups.entries())
      .map(([groupId, runs]) => ({
        groupId,
        runs: runs.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
      }))
      .sort((a, b) => {
        const aDate = a.runs[0]?.created_at ?? '';
        const bDate = b.runs[0]?.created_at ?? '';
        return bDate.localeCompare(aDate);
      });
  }, [scheduleRuns]);

  const methodLookup = useMemo(() => {
    return new Map(optimizationMethods.map((method) => [method.id, method]));
  }, [optimizationMethods]);

  const planForm = useEntityForm<SchedulePlan, PlanFormState>({
    defaults: createDefaultPlanState(),
    toFormValues: (plan) => ({
      planName: plan.plan_name,
      startDate: plan.start_date,
      endDate: plan.end_date,
      intervalMinutes: plan.interval_minutes,
      maxWeeklyHours: plan.max_weekly_hours,
      minRestHours: plan.min_rest_hours,
      allowSkillSwitch: Boolean(plan.allow_skill_switch),
      breakWindowStartMin: plan.break_window_start_min,
      breakWindowEndMin: plan.break_window_end_min,
      lunchWindowStartMin: plan.lunch_window_start_min,
      lunchWindowEndMin: plan.lunch_window_end_min,
      status: plan.status,
    }),
    validate: (values) => {
      if (!selectedCampaignId) return 'Select a campaign before creating a plan.';
      if (!values.planName.trim()) return 'Plan name is required.';
      return null;
    },
    createFn: (values) => {
      const id = addSchedulePlan({
        plan_name: values.planName.trim(),
        campaign_id: selectedCampaignId as number,
        scenario_id: selectedScenarioId ?? null,
        start_date: values.startDate,
        end_date: values.endDate,
        interval_minutes: values.intervalMinutes,
        max_weekly_hours: values.maxWeeklyHours,
        min_rest_hours: values.minRestHours,
        allow_skill_switch: values.allowSkillSwitch,
        break_window_start_min: values.breakWindowStartMin,
        break_window_end_min: values.breakWindowEndMin,
        lunch_window_start_min: values.lunchWindowStartMin,
        lunch_window_end_min: values.lunchWindowEndMin,
        status: values.status,
        created_by: 'system',
      });
      if (id > 0) selectSchedulePlan(id);
    },
    updateFn: (id, values) => editSchedulePlan(id, {
      plan_name: values.planName.trim(),
      start_date: values.startDate,
      end_date: values.endDate,
      interval_minutes: values.intervalMinutes,
      max_weekly_hours: values.maxWeeklyHours,
      min_rest_hours: values.minRestHours,
      allow_skill_switch: values.allowSkillSwitch,
      break_window_start_min: values.breakWindowStartMin,
      break_window_end_min: values.breakWindowEndMin,
      lunch_window_start_min: values.lunchWindowStartMin,
      lunch_window_end_min: values.lunchWindowEndMin,
      status: values.status,
    }),
  });

  const openCreatePlan = () => {
    planForm.open();
    planForm.setValues(createDefaultPlanState());
  };

  const openEditPlan = () => {
    if (!selectedPlan) return;
    planForm.open(selectedPlan);
  };

  const handleGenerateCoverage = () => {
    setCoverageError(null);
    if (!selectedPlan) {
      setCoverageError('Select a schedule plan before generating coverage.');
      return;
    }
    try {
      generateCoverageRequirements(selectedPlan.id, inputs);
      setCoverageSummary(summarizeCoverageRequirements(getCoverageRequirements(selectedPlan.id)));
    } catch (error) {
      console.error('Failed to generate coverage requirements:', error);
      setCoverageError('Failed to generate coverage requirements.');
    }
  };

  const comparisonGroup = useMemo(() => {
    if (!runGroups.length) return null;
    if (comparisonGroupId) {
      return runGroups.find((group) => group.groupId === comparisonGroupId) ?? null;
    }
    return runGroups.find((group) => {
      const labels = new Set(group.runs.map((run) => run.label));
      return labels.has('A') && labels.has('B');
    }) ?? null;
  }, [runGroups, comparisonGroupId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Scheduling Planner</h2>
          <p className="text-sm text-text-secondary">
            Build schedule plans and compare optimization methods for coverage and compliance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={openCreatePlan}>
            New Plan
          </Button>
          <Button variant="ghost" size="sm" onClick={openEditPlan} disabled={!selectedPlan}>
            Edit Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <SchedulePlanList
            plans={schedulePlans}
            selectedPlanId={selectedSchedulePlanId}
            selectedPlan={selectedPlan}
            selectedCampaign={selectedCampaign}
            selectedCampaignId={selectedCampaignId}
            selectedScenarioId={selectedScenarioId}
            onSelectPlan={selectSchedulePlan}
            onCreatePlan={addSchedulePlan}
            onDeletePlan={removeSchedulePlan}
          />

          <PlanFormCard planForm={planForm} selectedScenario={selectedScenario} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <PlanOverviewCard selectedPlan={selectedPlan} />

          <CoverageRequirementsCard
            selectedPlan={selectedPlan}
            coverageSummary={coverageSummary}
            coverageError={coverageError}
            onGenerate={handleGenerateCoverage}
          />

          <OptimizationRunner
            selectedPlan={selectedPlan}
            optimizationMethods={optimizationMethods}
            shiftTemplates={shiftTemplates}
            hasComparisonGroup={Boolean(comparisonGroup)}
            onShowComparison={() => comparisonGroup && setComparisonGroupId(comparisonGroup.groupId)}
            addScheduleRun={addScheduleRun}
            refreshScheduleRuns={refreshScheduleRuns}
            onRunStarted={setComparisonGroupId}
          />

          <ComparisonDisplay comparisonGroup={comparisonGroup} metricsByRunId={metricsByRunId} />
          <RecentRunsList runGroups={runGroups} metricsByRunId={metricsByRunId} methodLookup={methodLookup} />
        </div>
      </div>
    </div>
  );
}

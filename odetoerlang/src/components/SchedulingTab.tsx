import { useEffect, useMemo, useState } from 'react';
import { useDatabaseStore } from '../store/databaseStore';
import { useCalculatorStore } from '../store/calculatorStore';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { StatusBadge } from './ui/StatusBadge';
import { generateCoverageRequirements } from '../lib/scheduling/coverageGenerator';
import { runScheduleOptimization } from '../lib/scheduling/schedulerEngine';
import { getCoverageRequirements, getScheduleMetricsByRunIds, type ScheduleMetric } from '../lib/database/dataAccess';

type PlanFormState = {
  planName: string;
  startDate: string;
  endDate: string;
  intervalMinutes: number;
  maxWeeklyHours: number;
  minRestHours: number;
  allowSkillSwitch: boolean;
  breakWindowStartMin: number;
  breakWindowEndMin: number;
  lunchWindowStartMin: number;
  lunchWindowEndMin: number;
  status: string;
};

const dateToInput = (date: Date) => date.toISOString().split('T')[0];

const createDefaultPlanState = (): PlanFormState => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 3);

  return {
    planName: '',
    startDate: dateToInput(today),
    endDate: dateToInput(endDate),
    intervalMinutes: 30,
    maxWeeklyHours: 40,
    minRestHours: 11,
    allowSkillSwitch: true,
    breakWindowStartMin: 60,
    breakWindowEndMin: 480,
    lunchWindowStartMin: 180,
    lunchWindowEndMin: 360,
    status: 'Draft',
  };
};

const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const statusVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'success';
  if (normalized === 'failed' || normalized === 'error') return 'error';
  if (normalized === 'running' || normalized === 'queued' || normalized === 'pending') return 'warning';
  return 'neutral';
};

type CoverageSummary = {
  total: number;
  dates: number;
  intervals: number;
  skills: number;
};

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

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(() => createDefaultPlanState());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [methodAId, setMethodAId] = useState<number | ''>('');
  const [methodBId, setMethodBId] = useState<number | ''>('');
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [runError, setRunError] = useState<string | null>(null);
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
    if (!templateId && shiftTemplates.length > 0) {
      setTemplateId(shiftTemplates[0].id);
    }
  }, [shiftTemplates, templateId]);

  useEffect(() => {
    if (!methodAId && optimizationMethods.length > 0) {
      setMethodAId(optimizationMethods[0].id);
    }
    if (!methodBId && optimizationMethods.length > 1) {
      setMethodBId(optimizationMethods[1].id);
    }
  }, [optimizationMethods, methodAId, methodBId]);

  useEffect(() => {
    if (!selectedPlan) {
      setCoverageSummary(null);
      return;
    }
    const requirements = getCoverageRequirements(selectedPlan.id);
    const dates = new Set(requirements.map((req) => req.requirement_date));
    const intervals = new Set(requirements.map((req) => `${req.requirement_date}-${req.interval_start}`));
    const skills = new Set(requirements.map((req) => req.skill_id));
    setCoverageSummary({
      total: requirements.length,
      dates: dates.size,
      intervals: intervals.size,
      skills: skills.size,
    });
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

  const openCreatePlan = () => {
    setFormError(null);
    setEditingPlanId(null);
    setPlanForm(createDefaultPlanState());
    setFormOpen(true);
  };

  const openEditPlan = () => {
    if (!selectedPlan) return;
    setFormError(null);
    setEditingPlanId(selectedPlan.id);
    setPlanForm({
      planName: selectedPlan.plan_name,
      startDate: selectedPlan.start_date,
      endDate: selectedPlan.end_date,
      intervalMinutes: selectedPlan.interval_minutes,
      maxWeeklyHours: selectedPlan.max_weekly_hours,
      minRestHours: selectedPlan.min_rest_hours,
      allowSkillSwitch: Boolean(selectedPlan.allow_skill_switch),
      breakWindowStartMin: selectedPlan.break_window_start_min,
      breakWindowEndMin: selectedPlan.break_window_end_min,
      lunchWindowStartMin: selectedPlan.lunch_window_start_min,
      lunchWindowEndMin: selectedPlan.lunch_window_end_min,
      status: selectedPlan.status,
    });
    setFormOpen(true);
  };

  const updatePlanForm = (field: keyof PlanFormState, value: string | number | boolean) => {
    setPlanForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePlan = () => {
    if (!selectedCampaignId) {
      setFormError('Select a campaign before creating a plan.');
      return;
    }
    if (!planForm.planName.trim()) {
      setFormError('Plan name is required.');
      return;
    }

    const payload = {
      plan_name: planForm.planName.trim(),
      campaign_id: selectedCampaignId,
      scenario_id: selectedScenarioId ?? null,
      start_date: planForm.startDate,
      end_date: planForm.endDate,
      interval_minutes: planForm.intervalMinutes,
      max_weekly_hours: planForm.maxWeeklyHours,
      min_rest_hours: planForm.minRestHours,
      allow_skill_switch: planForm.allowSkillSwitch,
      break_window_start_min: planForm.breakWindowStartMin,
      break_window_end_min: planForm.breakWindowEndMin,
      lunch_window_start_min: planForm.lunchWindowStartMin,
      lunch_window_end_min: planForm.lunchWindowEndMin,
      status: planForm.status,
      created_by: 'system',
    };

    if (editingPlanId) {
      editSchedulePlan(editingPlanId, payload);
    } else {
      const id = addSchedulePlan(payload);
      if (id > 0) {
        selectSchedulePlan(id);
      }
    }

    setFormOpen(false);
    setEditingPlanId(null);
    setPlanForm(createDefaultPlanState());
  };

  const handleRun = () => {
    setRunError(null);
    if (!selectedPlan) {
      setRunError('Select a schedule plan before running optimization.');
      return;
    }
    const requirements = getCoverageRequirements(selectedPlan.id);
    if (requirements.length === 0) {
      setRunError('Generate coverage requirements before running optimization.');
      return;
    }
    if (!methodAId || !methodBId) {
      setRunError('Choose two optimization methods.');
      return;
    }
    if (methodAId === methodBId) {
      setRunError('Method A and Method B must be different.');
      return;
    }

    const runGroupId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `run_${Date.now()}`;
    const template = shiftTemplates.find((item) => item.id === templateId);
    const templateNotes = template
      ? JSON.stringify({ template_id: template.id, template_name: template.template_name })
      : null;

    const runAId = addScheduleRun({
      schedule_plan_id: selectedPlan.id,
      method_id: methodAId,
      run_group_id: runGroupId,
      label: 'A',
      status: 'Queued',
      started_at: null,
      completed_at: null,
      notes: templateNotes,
      created_by: 'system',
    });

    const runBId = addScheduleRun({
      schedule_plan_id: selectedPlan.id,
      method_id: methodBId,
      run_group_id: runGroupId,
      label: 'B',
      status: 'Queued',
      started_at: null,
      completed_at: null,
      notes: templateNotes,
      created_by: 'system',
    });

    try {
      if (runAId > 0) {
        runScheduleOptimization(runAId);
      }
      if (runBId > 0) {
        runScheduleOptimization(runBId);
      }
      refreshScheduleRuns(selectedPlan.id);
      setComparisonGroupId(runGroupId);
    } catch (error) {
      console.error('Failed to run schedule optimization:', error);
      setRunError('Failed to run schedule optimization. Check console for details.');
    }
  };

  const handleGenerateCoverage = () => {
    setCoverageError(null);
    if (!selectedPlan) {
      setCoverageError('Select a schedule plan before generating coverage.');
      return;
    }
    try {
      generateCoverageRequirements(selectedPlan.id, inputs);
      const requirements = getCoverageRequirements(selectedPlan.id);
      const dates = new Set(requirements.map((req) => req.requirement_date));
      const intervals = new Set(requirements.map((req) => `${req.requirement_date}-${req.interval_start}`));
      const skills = new Set(requirements.map((req) => req.skill_id));
      setCoverageSummary({
        total: requirements.length,
        dates: dates.size,
        intervals: intervals.size,
        skills: skills.size,
      });
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

  const compareMetric = (
    label: string,
    valueA?: number,
    valueB?: number,
    suffix: string = ''
  ) => {
    if (valueA === undefined || valueB === undefined) {
      return { label, valueA: '---', valueB: '---', delta: '---' };
    }
    const delta = valueB - valueA;
    return {
      label,
      valueA: `${valueA}${suffix}`,
      valueB: `${valueB}${suffix}`,
      delta: `${delta >= 0 ? '+' : ''}${delta}${suffix}`,
    };
  };

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
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                Schedule Plans
              </h3>
              <StatusBadge size="sm" variant={selectedCampaignId ? 'info' : 'neutral'}>
                {selectedCampaign?.campaign_name || 'No campaign'}
              </StatusBadge>
            </div>
            {schedulePlans.length === 0 ? (
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
                  onClick={() => {
                    // Logic to create a demo plan
                    const today = new Date();
                    const nextWeek = new Date();
                    nextWeek.setDate(today.getDate() + 7);
                    
                    const id = addSchedulePlan({
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
                    if (id > 0) selectSchedulePlan(id);
                  }}
                >
                  Create Demo Plan
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {schedulePlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => selectSchedulePlan(plan.id)}
                    className={`w-full text-left p-2 rounded-md border transition-all ${
                      selectedSchedulePlanId === plan.id
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
                      removeSchedulePlan(selectedPlan.id);
                    }
                  }}
                  className="text-red hover:text-red/80 transition-colors"
                >
                  Delete Plan
                </button>
              </div>
            )}
          </div>

          {formOpen && (
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                {editingPlanId ? 'Update Plan' : 'Create Plan'}
              </h4>
              {formError && (
                <div className="mb-3 p-2 text-xs text-red border border-red/30 bg-red/10 rounded">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                <FormField
                  label="Plan Name"
                  type="text"
                  value={planForm.planName}
                  onChange={(e) => updatePlanForm('planName', e.target.value)}
                  hint="Example: Q2 Coverage Plan"
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Start Date"
                    type="date"
                    value={planForm.startDate}
                    onChange={(e) => updatePlanForm('startDate', e.target.value)}
                  />
                  <FormField
                    label="End Date"
                    type="date"
                    value={planForm.endDate}
                    onChange={(e) => updatePlanForm('endDate', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Interval (min)"
                    type="number"
                    min="15"
                    step="15"
                    value={planForm.intervalMinutes}
                    onChange={(e) => updatePlanForm('intervalMinutes', Number(e.target.value))}
                  />
                  <FormField
                    label="Max Weekly Hours"
                    type="number"
                    min="1"
                    step="1"
                    value={planForm.maxWeeklyHours}
                    onChange={(e) => updatePlanForm('maxWeeklyHours', Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Min Rest (hrs)"
                    type="number"
                    min="1"
                    step="1"
                    value={planForm.minRestHours}
                    onChange={(e) => updatePlanForm('minRestHours', Number(e.target.value))}
                  />
                  <FormField
                    label="Status"
                    type="text"
                    value={planForm.status}
                    onChange={(e) => updatePlanForm('status', e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-2xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={planForm.allowSkillSwitch}
                    onChange={(e) => updatePlanForm('allowSkillSwitch', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border-subtle bg-bg-surface text-cyan focus:ring-cyan/30 focus:ring-2"
                  />
                  Allow skill switching within shift
                </label>
                <button
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="text-2xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showAdvanced ? 'Hide advanced windows' : 'Show advanced windows'}
                </button>
                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="Break Window Start (min)"
                      type="number"
                      min="0"
                      step="15"
                      value={planForm.breakWindowStartMin}
                      onChange={(e) => updatePlanForm('breakWindowStartMin', Number(e.target.value))}
                    />
                    <FormField
                      label="Break Window End (min)"
                      type="number"
                      min="0"
                      step="15"
                      value={planForm.breakWindowEndMin}
                      onChange={(e) => updatePlanForm('breakWindowEndMin', Number(e.target.value))}
                    />
                    <FormField
                      label="Lunch Window Start (min)"
                      type="number"
                      min="0"
                      step="15"
                      value={planForm.lunchWindowStartMin}
                      onChange={(e) => updatePlanForm('lunchWindowStartMin', Number(e.target.value))}
                    />
                    <FormField
                      label="Lunch Window End (min)"
                      type="number"
                      min="0"
                      step="15"
                      value={planForm.lunchWindowEndMin}
                      onChange={(e) => updatePlanForm('lunchWindowEndMin', Number(e.target.value))}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSavePlan}>
                    {editingPlanId ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
                <p className="text-2xs text-text-muted">
                  {selectedScenario
                    ? `Linked to scenario: ${selectedScenario.scenario_name}`
                    : 'No scenario linked'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
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
                  <Button size="sm" onClick={handleGenerateCoverage}>
                    {coverageSummary?.total ? 'Regenerate Coverage' : 'Generate Coverage'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Select a schedule plan to generate coverage.</p>
            )}
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                A/B Optimization Runner
              </h3>
              <StatusBadge size="sm" variant={selectedPlan ? 'info' : 'neutral'}>
                {selectedPlan ? selectedPlan.plan_name : 'No plan selected'}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest">
                  Method A
                </label>
                <select
                  value={methodAId}
                  onChange={(e) => setMethodAId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan"
                >
                  {optimizationMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.method_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest">
                  Method B
                </label>
                <select
                  value={methodBId}
                  onChange={(e) => setMethodBId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan"
                >
                  {optimizationMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.method_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest">
                  Shift Template
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan"
                >
                  {shiftTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.template_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-2xs text-text-muted border border-border-subtle rounded-md p-3 bg-bg-elevated">
                {shiftTemplates.length > 0 ? (
                  <div>
                    <p className="text-text-secondary font-semibold uppercase tracking-widest text-2xs mb-1">
                      Template Details
                    </p>
                    <p>
                      {shiftTemplates.find((item) => item.id === templateId)?.paid_minutes ?? 0} paid minutes
                    </p>
                    <p>
                      {shiftTemplates.find((item) => item.id === templateId)?.unpaid_minutes ?? 0} unpaid minutes
                    </p>
                    <p>
                      {shiftTemplates.find((item) => item.id === templateId)?.break_count ?? 0} breaks x{' '}
                      {shiftTemplates.find((item) => item.id === templateId)?.break_minutes ?? 0} min
                    </p>
                  </div>
                ) : (
                  <p>No shift templates found.</p>
                )}
              </div>
            </div>
            {runError && (
              <div className="mb-3 p-2 text-xs text-red border border-red/30 bg-red/10 rounded">
                {runError}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleRun} disabled={!selectedPlan}>
                Run A/B
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!comparisonGroup}
                onClick={() => comparisonGroup && setComparisonGroupId(comparisonGroup.groupId)}
              >
                Compare Results
              </Button>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
              A/B Comparison
            </h3>
            {comparisonGroup ? (
              (() => {
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
              })()
            ) : (
              <p className="text-xs text-text-muted">Run a pair of methods to compare results.</p>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
}

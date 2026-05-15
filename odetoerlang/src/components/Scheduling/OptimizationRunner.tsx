import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { runScheduleOptimization } from '../../lib/scheduling/schedulerEngine';
import {
  getCoverageRequirements,
  type SchedulePlan,
  type ShiftTemplate,
  type OptimizationMethod,
  type ScheduleRun,
} from '../../lib/database/dataAccess';

interface OptimizationRunnerProps {
  selectedPlan: SchedulePlan | null;
  optimizationMethods: OptimizationMethod[];
  shiftTemplates: ShiftTemplate[];
  hasComparisonGroup: boolean;
  onShowComparison: () => void;
  addScheduleRun: (run: Omit<ScheduleRun, 'id' | 'created_at'>) => number;
  refreshScheduleRuns: (planId: number | null) => void;
  onRunStarted: (runGroupId: string) => void;
}

export function OptimizationRunner({
  selectedPlan,
  optimizationMethods,
  shiftTemplates,
  hasComparisonGroup,
  onShowComparison,
  addScheduleRun,
  refreshScheduleRuns,
  onRunStarted,
}: OptimizationRunnerProps) {
  const [methodAId, setMethodAId] = useState<number | ''>('');
  const [methodBId, setMethodBId] = useState<number | ''>('');
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [runError, setRunError] = useState<string | null>(null);

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

    const queueRun = (label: 'A' | 'B', methodId: number) =>
      addScheduleRun({
        schedule_plan_id: selectedPlan.id,
        method_id: methodId,
        run_group_id: runGroupId,
        label,
        status: 'Queued',
        started_at: null,
        completed_at: null,
        notes: templateNotes,
        created_by: 'system',
      });

    const runAId = queueRun('A', methodAId);
    const runBId = queueRun('B', methodBId);

    try {
      if (runAId > 0) runScheduleOptimization(runAId);
      if (runBId > 0) runScheduleOptimization(runBId);
      refreshScheduleRuns(selectedPlan.id);
      onRunStarted(runGroupId);
    } catch (error) {
      console.error('Failed to run schedule optimization:', error);
      setRunError('Failed to run schedule optimization. Check console for details.');
    }
  };

  const selectedTemplate = shiftTemplates.find((item) => item.id === templateId);

  return (
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
          <label htmlFor="scheduling-method-a" className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest">
            Method A
          </label>
          <select
            id="scheduling-method-a"
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
          <label htmlFor="scheduling-method-b" className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest">
            Method B
          </label>
          <select
            id="scheduling-method-b"
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
          <label htmlFor="scheduling-shift-template" className="block text-2xs font-semibold text-text-secondary uppercase tracking-widest">
            Shift Template
          </label>
          <select
            id="scheduling-shift-template"
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
              <p>{selectedTemplate?.paid_minutes ?? 0} paid minutes</p>
              <p>{selectedTemplate?.unpaid_minutes ?? 0} unpaid minutes</p>
              <p>
                {selectedTemplate?.break_count ?? 0} breaks x{' '}
                {selectedTemplate?.break_minutes ?? 0} min
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
          disabled={!hasComparisonGroup}
          onClick={onShowComparison}
        >
          Compare Results
        </Button>
      </div>
    </div>
  );
}

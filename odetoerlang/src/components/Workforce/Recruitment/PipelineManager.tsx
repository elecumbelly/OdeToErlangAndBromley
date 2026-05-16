import { useMemo, useState } from 'react';
import { Button } from '../../ui/Button';
import { FormField } from '../../ui/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/Dialog';
import { NumberInput } from '../../ui/NumberInput';
import {
  getRecruitmentStages,
  createRecruitmentStage,
  updateRecruitmentStage,
  deleteRecruitmentStage,
  type RecruitmentStage,
} from '../../../lib/database/dataAccess';
import { useToast } from '../../ui/Toast';
import { useEntityForm } from '../../../hooks/useEntityForm';

interface StageFormValues extends Record<string, unknown> {
  stage_name: string;
  stage_order: number;
  pass_rate: number;
  avg_duration_days: number | null;
}

const STAGE_EMPTY_DEFAULTS: StageFormValues = {
  stage_name: '',
  stage_order: 1,
  pass_rate: 0.7,
  avg_duration_days: 5,
};

export default function PipelineManager() {
  const [deleteTick, setDeleteTick] = useState(0);
  const { addToast } = useToast();

  const form = useEntityForm<RecruitmentStage, StageFormValues>({
    defaults: STAGE_EMPTY_DEFAULTS,
    toFormValues: (stage) => ({
      stage_name: stage.stage_name,
      stage_order: stage.stage_order,
      pass_rate: stage.pass_rate,
      avg_duration_days: stage.avg_duration_days,
    }),
    createFn: (values) => createRecruitmentStage({
      stage_name: values.stage_name,
      stage_order: values.stage_order,
      pass_rate: values.pass_rate,
      avg_duration_days: values.avg_duration_days,
    }),
    updateFn: (id, values) => updateRecruitmentStage(id, {
      stage_name: values.stage_name,
      stage_order: values.stage_order,
      pass_rate: values.pass_rate,
      avg_duration_days: values.avg_duration_days,
    }),
    onSuccess: (mode) => addToast(mode === 'create' ? 'Stage created' : 'Stage updated', 'success'),
    onError: (_mode, err) => {
      console.error(err);
      addToast('Failed to save stage', 'error');
    },
  });

  const stages: RecruitmentStage[] = useMemo(() => {
    void form.refreshKey;
    void deleteTick;
    return getRecruitmentStages();
  }, [form.refreshKey, deleteTick]);

  const openCreate = () => {
    form.open();
    form.setValues({ ...STAGE_EMPTY_DEFAULTS, stage_order: stages.length + 1 });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this pipeline stage?')) {
      try {
        deleteRecruitmentStage(id);
        addToast('Stage deleted', 'success');
        setDeleteTick((k) => k + 1);
      } catch (err) {
        console.error(err);
        addToast('Failed to delete stage', 'error');
      }
    }
  };

  const getCumulativeRate = (index: number): number => {
    let cumulative = 1;
    for (let i = 0; i <= index; i++) {
      cumulative *= stages[i]!.pass_rate;
    }
    return cumulative;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Recruitment Pipeline</h3>
          <p className="text-sm text-text-secondary">Define hiring stages and conversion rates</p>
        </div>
        <Button onClick={openCreate}>+ Add Stage</Button>
      </div>

      {stages.length === 0 ? (
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-8 text-center">
          <p className="text-text-muted mb-4">No pipeline stages defined yet.</p>
          <Button onClick={openCreate}>Create First Stage</Button>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border-subtle bg-bg-elevated">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {stages.map((stage, idx) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 rounded-full bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-xs text-text-primary mt-1 text-center">{stage.stage_name}</span>
                    <span className="text-2xs text-green">{(stage.pass_rate * 100).toFixed(0)}%</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className="w-8 h-0.5 bg-border-subtle mx-1" />
                  )}
                </div>
              ))}
              <div className="flex flex-col items-center min-w-[80px] opacity-60">
                <div className="w-10 h-10 rounded-full bg-green/20 border border-green/40 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-text-secondary mt-1">Hired</span>
                <span className="text-2xs text-green">
                  {(getCumulativeRate(stages.length - 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Pass Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Cumulative</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Avg Days</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {stages.map((stage, idx) => (
                <tr key={stage.id} className="hover:bg-bg-hover">
                  <td className="px-4 py-3 text-sm text-text-secondary">{stage.stage_order}</td>
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">{stage.stage_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan">{(stage.pass_rate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getCumulativeRate(idx) < 0.3 ? 'text-yellow' : 'text-green'}>
                      {(getCumulativeRate(idx) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {stage.avg_duration_days ?? '-'} days
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => form.open(stage)} className="text-cyan hover:text-cyan-dim text-xs">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(stage.id)} className="text-red hover:text-red-400 text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={form.isOpen} onOpenChange={(open) => (open ? form.open(form.editing ?? undefined) : form.close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.editing ? 'Edit Stage' : 'Add Pipeline Stage'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.submit} className="space-y-4">
            <FormField label="Stage Name" id="stageName">
              <input
                id="stageName"
                type="text"
                value={form.values.stage_name}
                onChange={(e) => form.setField('stage_name', e.target.value)}
                placeholder="e.g., Phone Screen, Technical Interview"
                className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Order" id="stageOrder">
                <NumberInput
                  id="stageOrder"
                  min="1"
                  value={form.values.stage_order}
                  onChange={(e) => form.setField('stage_order', parseInt(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Pass Rate" id="passRate">
                <NumberInput
                  id="passRate"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.values.pass_rate}
                  onChange={(e) => form.setField('pass_rate', parseFloat(e.target.value))}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                  required
                />
              </FormField>
              <FormField label="Avg Days" id="avgDays">
                <NumberInput
                  id="avgDays"
                  min="0"
                  value={form.values.avg_duration_days ?? ''}
                  onChange={(e) => form.setField('avg_duration_days', e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md bg-bg-surface border border-border-subtle px-3 py-2 text-sm text-text-primary"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={form.close}>
                Cancel
              </Button>
              <Button type="submit">Save Stage</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

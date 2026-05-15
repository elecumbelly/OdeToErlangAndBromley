import React, { useEffect } from 'react';
import { useDatabaseStore } from '../store/databaseStore';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { toLocalDateString } from '../lib/dateUtils';
import { NumberInput } from './ui/NumberInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/Dialog';
import type { Assumption } from '../lib/database/dataAccess';
import { useEntityForm } from '../hooks/useEntityForm';

const ASSUMPTION_TYPES = ['AHT', 'Shrinkage', 'Occupancy', 'SLA', 'AveragePatience'];
const UNITS = ['seconds', 'percent', 'ratio', 'count'];

interface AssumptionFormValues extends Record<string, unknown> {
  assumption_type: string;
  value: number | '';
  unit: string;
  valid_from: string;
  valid_to: string;
  campaign_id: number | null;
}

const EMPTY_DEFAULTS: AssumptionFormValues = {
  assumption_type: '',
  value: '',
  unit: '',
  valid_from: '',
  valid_to: '',
  campaign_id: null,
};

const AssumptionsPanel: React.FC = () => {
  const { assumptions, campaigns, fetchAssumptions, refreshCampaigns, saveAssumption } = useDatabaseStore();
  const { addToast } = useToast();

  useEffect(() => {
    fetchAssumptions();
    refreshCampaigns();
  }, [fetchAssumptions, refreshCampaigns]);

  const form = useEntityForm<Assumption, AssumptionFormValues>({
    defaults: EMPTY_DEFAULTS,
    toFormValues: (a) => ({
      assumption_type: a.assumption_type,
      value: a.value,
      unit: a.unit ?? '',
      valid_from: a.valid_from,
      valid_to: a.valid_to ?? '',
      campaign_id: a.campaign_id,
    }),
    validate: (v) => {
      if (!v.assumption_type || v.value === '' || !v.valid_from) {
        return 'Please fill all required fields.';
      }
      return null;
    },
    // saveAssumption is an upsert; we call it from both create and update paths.
    createFn: (v) => saveAssumption(
      v.assumption_type,
      Number(v.value),
      v.unit,
      v.valid_from,
      v.campaign_id,
      v.valid_to || null,
    ),
    updateFn: (_id, v) => saveAssumption(
      v.assumption_type,
      Number(v.value),
      v.unit,
      v.valid_from,
      v.campaign_id,
      v.valid_to || null,
    ),
    onSuccess: () => addToast('Assumption saved successfully!', 'success'),
    onError: (_mode, err) => {
      console.error('Failed to save assumption:', err);
      addToast('Failed to save assumption.', 'error');
    },
  });

  const openCreate = () => {
    form.open();
    form.setValues({ ...EMPTY_DEFAULTS, valid_from: toLocalDateString() });
  };

  return (
    <div className="p-4 bg-bg-surface border border-border-subtle rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Assumptions Manager</h2>
        <Button onClick={openCreate} size="sm">
          + Add Assumption
        </Button>
      </div>

      {assumptions.length === 0 ? (
        <p className="text-sm text-text-muted">No assumptions defined yet. Click "Add Assumption" to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-bg-subtle">
              <tr>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Value</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Unit</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Valid From</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Valid To</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Campaign</th>
                <th className="px-3 py-2 text-left text-2xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {assumptions.map((assumption) => (
                <tr key={assumption.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">{assumption.assumption_type}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">{assumption.value}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">{assumption.unit}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">{assumption.valid_from}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">{assumption.valid_to || 'Present'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-text-primary">
                    {campaigns.find(c => c.id === assumption.campaign_id)?.campaign_name || 'Global'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => form.open(assumption)}>Edit</Button>
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
            <DialogTitle>{form.editing ? 'Edit Assumption' : 'Add New Assumption'}</DialogTitle>
            <DialogDescription>
              Define time-bound parameters for your calculations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.submit} className="space-y-4">
            <FormField label="Assumption Type" id="assumption-type">
              <select
                id="assumption-type"
                value={form.values.assumption_type}
                onChange={(e) => form.setField('assumption_type', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
                required
              >
                <option value="">Select Type</option>
                {ASSUMPTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </FormField>
            <FormField label="Value" id="assumption-value">
              <NumberInput
                id="assumption-value"
                value={form.values.value}
                onChange={(e) => form.setField('value', e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
                required
              />
            </FormField>
            <FormField label="Unit" id="assumption-unit">
              <select
                id="assumption-unit"
                value={form.values.unit}
                onChange={(e) => form.setField('unit', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
              >
                <option value="">Select Unit (Optional)</option>
                {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </FormField>
            <FormField label="Valid From" id="valid-from">
              <input
                id="valid-from"
                type="date"
                value={form.values.valid_from}
                onChange={(e) => form.setField('valid_from', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
                required
              />
            </FormField>
            <FormField label="Valid To" id="valid-to">
              <input
                id="valid-to"
                type="date"
                value={form.values.valid_to}
                onChange={(e) => form.setField('valid_to', e.target.value)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
              />
            </FormField>
            <FormField label="Campaign (Optional)" id="campaign-id">
              <select
                id="campaign-id"
                value={form.values.campaign_id ?? ''}
                onChange={(e) => form.setField('campaign_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
              >
                <option value="">Global Assumption</option>
                {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.campaign_name}</option>)}
              </select>
            </FormField>
            {form.error && (
              <p className="text-xs text-red">{form.error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={form.close}>
                Cancel
              </Button>
              <Button type="submit">
                Save Assumption
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssumptionsPanel;

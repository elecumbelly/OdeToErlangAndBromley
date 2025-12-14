import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../store/databaseStore';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/Dialog';
import type { Assumption } from '../lib/database/dataAccess'; // Import Assumption type

const ASSUMPTION_TYPES = ['AHT', 'Shrinkage', 'Occupancy', 'SLA', 'AveragePatience'];
const UNITS = ['seconds', 'percent', 'ratio', 'count'];

const AssumptionsPanel: React.FC = () => {
  const { assumptions, campaigns, fetchAssumptions, refreshCampaigns, saveAssumption } = useDatabaseStore();
  const { addToast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssumption, setEditingAssumption] = useState<Partial<Assumption> | null>(null);

  useEffect(() => {
    fetchAssumptions(); // Fetch all assumptions
    refreshCampaigns();
  }, [fetchAssumptions, refreshCampaigns]);

  const handleSaveAssumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssumption || !editingAssumption.assumption_type || editingAssumption.value === undefined || !editingAssumption.valid_from) {
      addToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      // Use the saveAssumption action from the store
      await saveAssumption(
        editingAssumption.assumption_type,
        editingAssumption.value,
        editingAssumption.unit || '',
        editingAssumption.valid_from,
        editingAssumption.campaign_id || null,
        editingAssumption.valid_to || null
      );
      addToast('Assumption saved successfully!', 'success');
      setIsDialogOpen(false);
      setEditingAssumption(null);
      // fetchAssumptions() is called by saveAssumption in the store, so no need here
    } catch (error) {
      console.error('Failed to save assumption:', error);
      addToast('Failed to save assumption.', 'error');
    }
  };

  const openEditDialog = (assumption?: Assumption) => {
    setEditingAssumption(assumption ? { ...assumption } : { valid_from: new Date().toISOString().split('T')[0] });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4 bg-bg-surface border border-border-subtle rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Assumptions Manager</h2>
        <Button onClick={() => openEditDialog()} size="sm">
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
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(assumption)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAssumption?.id ? 'Edit Assumption' : 'Add New Assumption'}</DialogTitle>
            <DialogDescription>
              Define time-bound parameters for your calculations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssumption} className="space-y-4">
            <FormField label="Assumption Type" id="assumption-type">
              <select
                value={editingAssumption?.assumption_type || ''}
                onChange={(e) => setEditingAssumption({ ...editingAssumption, assumption_type: e.target.value as Assumption['assumption_type'] })}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
                required
              >
                <option value="">Select Type</option>
                {ASSUMPTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </FormField>
            <FormField label="Value" id="assumption-value">
              <input
                type="number"
                value={editingAssumption?.value || ''}
                onChange={(e) => setEditingAssumption({ ...editingAssumption, value: parseFloat(e.target.value) })}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
                required
              />
            </FormField>
            <FormField label="Unit" id="assumption-unit">
              <select
                value={editingAssumption?.unit || ''}
                onChange={(e) => setEditingAssumption({ ...editingAssumption, unit: e.target.value || null })}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
              >
                <option value="">Select Unit (Optional)</option>
                {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </FormField>
            <FormField label="Valid From" id="valid-from">
              <input
                type="date"
                value={editingAssumption?.valid_from || ''}
                onChange={(e) => setEditingAssumption({ ...editingAssumption, valid_from: e.target.value })}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
                required
              />
            </FormField>
            <FormField label="Valid To" id="valid-to">
              <input
                type="date"
                value={editingAssumption?.valid_to || ''}
                onChange={(e) => setEditingAssumption({ ...editingAssumption, valid_to: e.target.value || null })}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
              />
            </FormField>
            <FormField label="Campaign (Optional)" id="campaign-id">
              <select
                value={editingAssumption?.campaign_id || ''}
                onChange={(e) => setEditingAssumption({ ...editingAssumption, campaign_id: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2"
              >
                <option value="">Global Assumption</option>
                {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.campaign_name}</option>)}
              </select>
            </FormField>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
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

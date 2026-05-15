import { useState } from 'react';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import type { SchedulePlan, Scenario } from '../../lib/database/dataAccess';
import type { UseEntityFormResult } from '../../hooks/useEntityForm';
import type { PlanFormState } from './schedulingTypes';

interface PlanFormCardProps {
  planForm: UseEntityFormResult<SchedulePlan, PlanFormState>;
  selectedScenario: Scenario | null;
}

export function PlanFormCard({ planForm, selectedScenario }: PlanFormCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!planForm.isOpen) return null;

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <h4 className="text-sm font-semibold text-text-primary mb-3">
        {planForm.editing ? 'Update Plan' : 'Create Plan'}
      </h4>
      {planForm.error && (
        <div className="mb-3 p-2 text-xs text-red border border-red/30 bg-red/10 rounded">
          {planForm.error}
        </div>
      )}
      <div className="space-y-4">
        <FormField
          label="Plan Name"
          type="text"
          value={planForm.values.planName}
          onChange={(e) => planForm.setField('planName', e.target.value)}
          hint="Example: Q2 Coverage Plan"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Start Date"
            type="date"
            value={planForm.values.startDate}
            onChange={(e) => planForm.setField('startDate', e.target.value)}
          />
          <FormField
            label="End Date"
            type="date"
            value={planForm.values.endDate}
            onChange={(e) => planForm.setField('endDate', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Interval (min)"
            type="number"
            min="15"
            step="15"
            value={planForm.values.intervalMinutes}
            onChange={(e) => planForm.setField('intervalMinutes', Number(e.target.value))}
          />
          <FormField
            label="Max Weekly Hours"
            type="number"
            min="1"
            step="1"
            value={planForm.values.maxWeeklyHours}
            onChange={(e) => planForm.setField('maxWeeklyHours', Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Min Rest (hrs)"
            type="number"
            min="1"
            step="1"
            value={planForm.values.minRestHours}
            onChange={(e) => planForm.setField('minRestHours', Number(e.target.value))}
          />
          <FormField
            label="Status"
            type="text"
            value={planForm.values.status}
            onChange={(e) => planForm.setField('status', e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-2xs text-text-secondary">
          <input
            type="checkbox"
            checked={planForm.values.allowSkillSwitch}
            onChange={(e) => planForm.setField('allowSkillSwitch', e.target.checked)}
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
              value={planForm.values.breakWindowStartMin}
              onChange={(e) => planForm.setField('breakWindowStartMin', Number(e.target.value))}
            />
            <FormField
              label="Break Window End (min)"
              type="number"
              min="0"
              step="15"
              value={planForm.values.breakWindowEndMin}
              onChange={(e) => planForm.setField('breakWindowEndMin', Number(e.target.value))}
            />
            <FormField
              label="Lunch Window Start (min)"
              type="number"
              min="0"
              step="15"
              value={planForm.values.lunchWindowStartMin}
              onChange={(e) => planForm.setField('lunchWindowStartMin', Number(e.target.value))}
            />
            <FormField
              label="Lunch Window End (min)"
              type="number"
              min="0"
              step="15"
              value={planForm.values.lunchWindowEndMin}
              onChange={(e) => planForm.setField('lunchWindowEndMin', Number(e.target.value))}
            />
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={planForm.close}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => planForm.submit()}>
            {planForm.editing ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
        <p className="text-2xs text-text-muted">
          {selectedScenario
            ? `Linked to scenario: ${selectedScenario.scenario_name}`
            : 'No scenario linked'}
        </p>
      </div>
    </div>
  );
}

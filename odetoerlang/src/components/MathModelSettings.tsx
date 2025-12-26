import { useMemo, useState } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { validateCalculationInputs, getFieldError } from '../lib/validation/inputValidation';
import type { CalculationInputs, ErlangVariant } from '../types';
import { Button } from './ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/Dialog';
import { FormField } from './ui/FormField';

const selectClass =
  'mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan/30 focus:border-cyan';
const labelClass = 'block text-2xs font-semibold text-text-secondary uppercase tracking-widest';

export default function MathModelSettings() {
  const {
    inputs,
    setInput,
    date,
    setDate,
    useAssumptions,
    setUseAssumptions,
  } = useCalculatorStore();
  const [open, setOpen] = useState(false);

  const validation = useMemo(() => validateCalculationInputs(inputs), [inputs]);
  const getError = (field: keyof CalculationInputs) => getFieldError(validation, field);

  const updateInput = (key: keyof CalculationInputs, rawValue: string) => {
    if (key === 'model') {
      setInput(key, rawValue as ErlangVariant);
      return;
    }

    const value = parseFloat(rawValue);
    if (!Number.isNaN(value)) {
      setInput(key, value as CalculationInputs[typeof key]);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Math Model
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Math Model Settings</DialogTitle>
            <DialogDescription>
              Shared calculation inputs for every view. Changes apply globally.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-md border border-border-muted bg-bg-elevated p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="math-assumptions-date" className={labelClass}>
                    Assumptions As Of
                  </label>
                  <input
                    id="math-assumptions-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={selectClass}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-2xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={useAssumptions}
                      onChange={(e) => setUseAssumptions(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border-subtle bg-bg-surface text-cyan focus:ring-cyan/30 focus:ring-2"
                    />
                    Sync with assumptions
                  </label>
                </div>
              </div>
              <p className="mt-2 text-2xs text-text-muted">
                {useAssumptions
                  ? 'Campaign defaults can update these values based on date.'
                  : 'Manual values stay fixed until you change them.'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3">
                Core Inputs
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Volume / Interval"
                  type="number"
                  min="0"
                  step="1"
                  value={inputs.volume}
                  onChange={(e) => updateInput('volume', e.target.value)}
                  error={getError('volume')}
                />
                <FormField
                  label="AHT (sec)"
                  type="number"
                  min="0"
                  step="1"
                  value={inputs.aht}
                  onChange={(e) => updateInput('aht', e.target.value)}
                  error={getError('aht')}
                />
                <div>
                  <label className={labelClass}>Interval (min)</label>
                  <select
                    value={inputs.intervalMinutes}
                    onChange={(e) => updateInput('intervalMinutes', e.target.value)}
                    className={selectClass}
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <select
                    value={inputs.model}
                    onChange={(e) => updateInput('model', e.target.value)}
                    className={selectClass}
                  >
                    <option value="B">Erlang B</option>
                    <option value="C">Erlang C</option>
                    <option value="A">Erlang A</option>
                  </select>
                </div>
                <FormField
                  label="SL Target (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={inputs.targetSLPercent}
                  onChange={(e) => updateInput('targetSLPercent', e.target.value)}
                  error={getError('targetSLPercent')}
                />
                <FormField
                  label="Threshold (sec)"
                  type="number"
                  min="0"
                  step="1"
                  value={inputs.thresholdSeconds}
                  onChange={(e) => updateInput('thresholdSeconds', e.target.value)}
                  error={getError('thresholdSeconds')}
                />
                <FormField
                  label="Shrinkage (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={inputs.shrinkagePercent}
                  onChange={(e) => updateInput('shrinkagePercent', e.target.value)}
                  error={getError('shrinkagePercent')}
                />
                <FormField
                  label="Max Occupancy (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={inputs.maxOccupancy}
                  onChange={(e) => updateInput('maxOccupancy', e.target.value)}
                  error={getError('maxOccupancy')}
                />
                {inputs.model === 'A' && (
                  <FormField
                    label="Average Patience (sec)"
                    type="number"
                    min="0"
                    step="1"
                    value={inputs.averagePatience}
                    onChange={(e) => updateInput('averagePatience', e.target.value)}
                    error={getError('averagePatience')}
                  />
                )}
                <FormField
                  label="Concurrency"
                  type="number"
                  min="1"
                  step="1"
                  value={inputs.concurrency}
                  onChange={(e) => updateInput('concurrency', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

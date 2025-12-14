import React from 'react';
import { useCalculatorStore, calculateProductiveAgents } from '../store/calculatorStore';

const StaffingModelPanel: React.FC = () => {
  const { staffingModel, setStaffingModel, inputs } = useCalculatorStore();

  // Calculate derived values
  const { staffPerShift, productiveAgents, shiftsToFillDay } = calculateProductiveAgents(
    staffingModel,
    inputs.shrinkagePercent
  );

  const handleNumberChange = (key: keyof typeof staffingModel) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setStaffingModel(key, 0 as never);
      return;
    }
    const value = parseFloat(rawValue);
    if (!isNaN(value)) {
      setStaffingModel(key, value as never);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffingModel('useAsConstraint', e.target.checked);
  };

  const inputClass = "mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all duration-fast";
  const labelClass = "block text-2xs font-semibold text-text-secondary uppercase tracking-widest";
  const hintClass = "mt-1 text-2xs text-text-muted";

  return (
    <div className="bg-bg-surface border border-green/20 rounded-lg p-4">
      <div className="mb-4 pb-3 border-b border-border-muted">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Staffing Model
        </h2>
        <p className="text-2xs text-text-muted mt-1">
          Your contact center capacity
        </p>
      </div>

      <div className="space-y-4">
        {/* Total Headcount */}
        <div>
          <label htmlFor="totalHeadcount" className={labelClass}>
            Total Headcount
          </label>
          <input
            id="totalHeadcount"
            type="number"
            min="0"
            step="1"
            value={staffingModel.totalHeadcount || ''}
            onChange={handleNumberChange('totalHeadcount')}
            className={inputClass}
            placeholder="150"
          />
          <p className={hintClass}>Total staff on books</p>
        </div>

        {/* Operating Hours Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="operatingHours" className={labelClass}>
              Hours/Day
            </label>
            <input
              id="operatingHours"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={staffingModel.operatingHoursPerDay || ''}
              onChange={handleNumberChange('operatingHoursPerDay')}
              className={inputClass}
              placeholder="12"
            />
            <p className={hintClass}>e.g., 8am-8pm = 12</p>
          </div>
          <div>
            <label htmlFor="daysOpen" className={labelClass}>
              Days/Week
            </label>
            <input
              id="daysOpen"
              type="number"
              min="1"
              max="7"
              step="1"
              value={staffingModel.daysOpenPerWeek || ''}
              onChange={handleNumberChange('daysOpenPerWeek')}
              className={inputClass}
              placeholder="5"
            />
            <p className={hintClass}>Mon-Fri = 5</p>
          </div>
        </div>

        {/* Shift Length */}
        <div>
          <label htmlFor="shiftLength" className={labelClass}>
            Shift Length
            <span className="text-text-muted ml-1 lowercase font-normal">hours</span>
          </label>
          <input
            id="shiftLength"
            type="number"
            min="1"
            max="12"
            step="0.5"
            value={staffingModel.shiftLengthHours || ''}
            onChange={handleNumberChange('shiftLengthHours')}
            className={inputClass}
            placeholder="8"
          />
          <p className={hintClass}>Standard shift duration</p>
        </div>

        {/* Calculated Values */}
        {staffingModel.totalHeadcount > 0 && (
          <div className="p-3 bg-bg-elevated border border-border-muted rounded-lg space-y-3">
            <p className="text-2xs text-text-muted uppercase tracking-widest font-semibold">Calculated Capacity</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-surface border border-border-subtle rounded p-2">
                <p className="text-2xs text-text-muted">Shifts/Day</p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {shiftsToFillDay.toFixed(1)}
                </p>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded p-2">
                <p className="text-2xs text-text-muted">Staff/Shift</p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {staffPerShift}
                </p>
              </div>
            </div>

            <div className="bg-bg-surface border border-cyan/20 rounded p-2">
              <p className="text-2xs text-text-muted">Productive Agents</p>
              <p className="text-xl font-bold text-cyan tabular-nums">
                {productiveAgents}
              </p>
              <p className="text-2xs text-text-muted mt-1">
                {staffPerShift} staff × {(100 - inputs.shrinkagePercent).toFixed(0)}% available
              </p>
            </div>
          </div>
        )}

        {/* Use as Constraint */}
        <div className="pt-3 border-t border-border-muted">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={staffingModel.useAsConstraint}
              onChange={handleCheckboxChange}
              className="mt-0.5 h-4 w-4 bg-bg-surface border-border-subtle rounded text-cyan focus:ring-cyan/30 focus:ring-2"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-text-primary group-hover:text-cyan transition-colors">
                Use as constraint
              </span>
              <p className="text-2xs text-text-muted mt-0.5">
                Calculate achievable SL with this staffing
              </p>
            </div>
          </label>
        </div>

        {/* Status indicator */}
        {staffingModel.totalHeadcount > 0 && (
          <div className={`p-2 rounded-md text-2xs ${
            staffingModel.useAsConstraint
              ? 'bg-green/5 border border-green/20'
              : 'bg-bg-elevated border border-border-muted'
          }`}>
            {staffingModel.useAsConstraint ? (
              <p>
                <span className="text-green font-medium">ACTIVE:</span>
                <span className="text-text-secondary ml-1">Using {productiveAgents} productive agents</span>
              </p>
            ) : (
              <p className="text-text-muted">
                INFO ONLY: Optimal staffing calculated independently
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-border-muted">
          <button
            onClick={() => {
              setStaffingModel('totalHeadcount', 0);
              setStaffingModel('useAsConstraint', false);
            }}
            className="w-full px-3 py-2 text-2xs bg-bg-hover hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle rounded-md transition-all uppercase tracking-wide"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffingModelPanel;

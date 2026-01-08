import React from 'react';
import { useCalculatorStore, calculateProductiveAgents } from '../store/calculatorStore';

const StaffingModelPanel: React.FC = () => {
  const { staffingModel, setStaffingModel, setShiftType, inputs } = useCalculatorStore();

  // Calculate derived values
  const { staffPerShift, productiveAgents, shiftsToFillDay, shiftBreakdown } = calculateProductiveAgents(
    staffingModel,
    inputs.shrinkagePercent
  );

  const updateModel = (key: keyof typeof staffingModel, rawValue: string) => {
    if (rawValue === '') {
      setStaffingModel(key, 0 as never);
      return;
    }
    const value = parseFloat(rawValue);
    if (!isNaN(value)) {
      setStaffingModel(key, value as never);
    }
  };

  const handleConstraintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffingModel('useAsConstraint', e.target.checked);
  };

  const handleShiftToggle = (hours: number) => {
    const shift = staffingModel.shiftTypes.find(s => s.hours === hours);
    if (shift) {
      setShiftType(hours, { enabled: !shift.enabled });
    }
  };

  const handleProportionChange = (hours: number, rawValue: string) => {
    const value = parseInt(rawValue, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setShiftType(hours, { proportion: value });
    }
  };

  const inputClass = "mt-2 block w-full rounded-lg bg-bg-elevated/50 border border-border-subtle/50 text-text-primary text-base px-4 py-3 focus:outline-none focus:border-green focus:ring-2 focus:ring-green/20 transition-all duration-200 hover:border-border-subtle backdrop-blur-sm";
  const labelClass = "block text-sm font-semibold text-text-secondary uppercase tracking-wider";
  const hintClass = "mt-2 text-sm text-text-muted leading-relaxed";

  const enabledShiftCount = staffingModel.shiftTypes.filter(s => s.enabled).length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-green/20 bg-gradient-to-b from-bg-surface to-bg-base">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green/[0.02] to-transparent pointer-events-none" />

      <div className="relative p-6">
        <div className="mb-6 pb-4 border-b border-border-muted/50">
          <h2 className="text-lg font-bold text-text-primary tracking-wide">
            Staffing Model
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Your contact centre capacity
          </p>
        </div>

        <div className="space-y-6">
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
              onChange={(e) => updateModel('totalHeadcount', e.target.value)}
              className={inputClass}
              placeholder="150"
            />
            <p className={hintClass}>Total staff on books</p>
          </div>

          {/* Operating Hours Grid */}
          <div className="grid grid-cols-2 gap-4">
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
                onChange={(e) => updateModel('operatingHoursPerDay', e.target.value)}
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
                onChange={(e) => updateModel('daysOpenPerWeek', e.target.value)}
                className={inputClass}
                placeholder="5"
              />
              <p className={hintClass}>Mon-Fri = 5</p>
            </div>
          </div>

          {/* Shift Types */}
          <div className="pt-4 border-t border-border-muted/30">
            <p className={labelClass}>Shift Types</p>
            <p className={hintClass + ' mb-4'}>Select shifts and set staff % per type</p>
            <div className="space-y-3">
              {staffingModel.shiftTypes.map((shift) => (
                <div
                  key={shift.hours}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                    shift.enabled
                      ? 'bg-green/5 border-green/30 shadow-sm'
                      : 'bg-bg-elevated/30 border-border-muted/30 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={shift.enabled}
                    onChange={() => handleShiftToggle(shift.hours)}
                    className="h-5 w-5 bg-bg-surface border-border-subtle rounded text-green focus:ring-green/30 focus:ring-2 cursor-pointer"
                  />
                  <span className={`text-base font-semibold min-w-[4rem] ${shift.enabled ? 'text-text-primary' : 'text-text-muted'}`}>
                    {shift.hours}h shift
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={shift.proportion}
                      onChange={(e) => handleProportionChange(shift.hours, e.target.value)}
                      disabled={!shift.enabled}
                      className={`w-20 rounded-lg bg-bg-surface border text-base px-3 py-2 text-center tabular-nums transition-all ${
                        shift.enabled
                          ? 'border-border-subtle text-text-primary focus:outline-none focus:border-green focus:ring-1 focus:ring-green/20'
                          : 'border-border-muted text-text-muted cursor-not-allowed'
                      }`}
                    />
                    <span className="text-sm text-text-muted">%</span>
                  </div>
                </div>
              ))}
            </div>
            {enabledShiftCount === 0 && (
              <p className="mt-3 text-sm text-red font-medium">Select at least one shift type</p>
            )}
          </div>

          {/* Calculated Values */}
          {staffingModel.totalHeadcount > 0 && enabledShiftCount > 0 && (
            <div className="p-5 bg-bg-elevated/40 border border-border-muted/30 rounded-xl space-y-4 backdrop-blur-sm">
              <p className="text-sm text-text-muted uppercase tracking-wider font-semibold">Calculated Capacity</p>

              {/* Shift Breakdown */}
              {shiftBreakdown.length > 0 && (
                <div className="space-y-2">
                  {shiftBreakdown.map((b) => (
                    <div key={b.hours} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{b.hours}h shifts:</span>
                      <span className="text-text-primary tabular-nums font-medium">
                        {b.staff} staff ({b.shifts.toFixed(1)} shifts/day)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-muted/30">
                <div className="bg-bg-surface/50 border border-border-subtle/30 rounded-lg p-4">
                  <p className="text-sm text-text-muted">Avg Shifts/Day</p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums mt-1">
                    {shiftsToFillDay.toFixed(1)}
                  </p>
                </div>
                <div className="bg-bg-surface/50 border border-border-subtle/30 rounded-lg p-4">
                  <p className="text-sm text-text-muted">Staff/Shift</p>
                  <p className="text-2xl font-bold text-text-primary tabular-nums mt-1">
                    {staffPerShift}
                  </p>
                </div>
              </div>

              <div className="bg-green/5 border border-green/20 rounded-lg p-4">
                <p className="text-sm text-text-muted">Productive Agents</p>
                <p className="text-3xl font-bold text-green tabular-nums mt-1">
                  {productiveAgents}
                </p>
                <p className="text-sm text-text-muted mt-2">
                  {staffPerShift} staff x {(100 - inputs.shrinkagePercent).toFixed(0)}% available
                </p>
              </div>
            </div>
          )}

          {/* Use as Constraint */}
          <div className="pt-4 border-t border-border-muted/30">
            <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-lg hover:bg-bg-elevated/30 transition-colors">
              <input
                type="checkbox"
                checked={staffingModel.useAsConstraint}
                onChange={handleConstraintChange}
                className="mt-0.5 h-5 w-5 bg-bg-surface border-border-subtle rounded text-green focus:ring-green/30 focus:ring-2 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-base font-medium text-text-primary group-hover:text-green transition-colors">
                  Use as constraint
                </span>
                <p className="text-sm text-text-muted mt-1">
                  Calculate achievable SL with this staffing
                </p>
              </div>
            </label>
          </div>

          {/* Status indicator */}
          {staffingModel.totalHeadcount > 0 && enabledShiftCount > 0 && (
            <div className={`p-4 rounded-lg text-sm ${
              staffingModel.useAsConstraint
                ? 'bg-green/5 border border-green/20'
                : 'bg-bg-elevated/30 border border-border-muted/30'
            }`}>
              {staffingModel.useAsConstraint ? (
                <p>
                  <span className="text-green font-semibold">ACTIVE:</span>
                  <span className="text-text-secondary ml-2">Using {productiveAgents} productive agents</span>
                </p>
              ) : (
                <p className="text-text-muted">
                  INFO ONLY: Optimal staffing calculated independently
                </p>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-border-muted/30">
            <button
              onClick={() => {
                setStaffingModel('totalHeadcount', 0);
                setStaffingModel('useAsConstraint', false);
              }}
              className="w-full px-4 py-3 text-sm bg-bg-elevated/30 hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-subtle/30 rounded-lg transition-all font-medium tracking-wide hover:border-border-subtle"
            >
              Clear Staffing Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffingModelPanel;

import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore';

const ActualStaffPanel: React.FC = () => {
  const { actualStaff, setActualStaff } = useCalculatorStore();

  const handleChange = (key: keyof typeof actualStaff) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value) || 0;
    setActualStaff(key, value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualStaff('useAsConstraint', e.target.checked);
  };

  const inputClass = "mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all duration-fast";
  const labelClass = "block text-2xs font-semibold text-text-secondary uppercase tracking-widest";
  const hintClass = "mt-1 text-2xs text-text-muted";

  return (
    <div className="bg-bg-surface border border-green/20 rounded-lg p-4">
      <div className="mb-4 pb-3 border-b border-border-muted">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Actual Staff
        </h2>
        <p className="text-2xs text-text-muted mt-1">
          Current staffing on books
        </p>
      </div>

      <div className="space-y-4">
        {/* Total FTE */}
        <div>
          <label htmlFor="actualFTE" className={labelClass}>
            Total FTE
          </label>
          <input
            id="actualFTE"
            type="number"
            min="0"
            step="0.1"
            value={actualStaff.totalFTE}
            onChange={handleChange('totalFTE')}
            className={inputClass}
            placeholder="150.0"
          />
          <p className={hintClass}>Including shrinkage</p>
        </div>

        {/* Productive Agents */}
        <div>
          <label htmlFor="actualAgents" className={labelClass}>
            Productive Agents
          </label>
          <input
            id="actualAgents"
            type="number"
            min="0"
            step="1"
            value={actualStaff.productiveAgents}
            onChange={handleChange('productiveAgents')}
            className={inputClass}
            placeholder="120"
          />
          <p className={hintClass}>Available for contacts</p>
        </div>

        {/* Shrinkage % (informational) */}
        {actualStaff.totalFTE > 0 && actualStaff.productiveAgents > 0 && (
          <div className="p-3 bg-blue/5 border border-blue/20 rounded-lg">
            <p className="text-2xs text-text-muted uppercase tracking-widest">Calc Shrinkage</p>
            <p className="text-xl font-bold text-blue tabular-nums">
              {((1 - actualStaff.productiveAgents / actualStaff.totalFTE) * 100).toFixed(1)}%
            </p>
            <p className="text-2xs text-text-muted mt-1">
              {actualStaff.totalFTE} FTE / {actualStaff.productiveAgents} agents
            </p>
          </div>
        )}

        {/* Use as Constraint */}
        <div className="pt-3 border-t border-border-muted">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={actualStaff.useAsConstraint}
              onChange={handleCheckboxChange}
              className="mt-0.5 h-4 w-4 bg-bg-surface border-border-subtle rounded text-cyan focus:ring-cyan/30 focus:ring-2"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-text-primary group-hover:text-cyan transition-colors">
                Use as constraint
              </span>
              <p className="text-2xs text-text-muted mt-0.5">
                Calculate SL with current staff
              </p>
            </div>
          </label>
        </div>

        {/* Status indicator */}
        {actualStaff.totalFTE > 0 && (
          <div className={`p-2 rounded-md text-2xs ${
            actualStaff.useAsConstraint
              ? 'bg-green/5 border border-green/20'
              : 'bg-bg-elevated border border-border-muted'
          }`}>
            {actualStaff.useAsConstraint ? (
              <p>
                <span className="text-green font-medium">ACTIVE:</span>
                <span className="text-text-secondary ml-1">Using {actualStaff.productiveAgents} agents</span>
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
              setActualStaff('totalFTE', 0);
              setActualStaff('productiveAgents', 0);
              setActualStaff('useAsConstraint', false);
            }}
            className="w-full px-3 py-2 text-2xs bg-bg-hover hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-subtle rounded-md transition-all uppercase tracking-wide"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActualStaffPanel;

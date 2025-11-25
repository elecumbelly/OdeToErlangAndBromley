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

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="text-green-600 mr-2">👥</span>
          Actual Staff
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your current staffing levels on the books
        </p>
      </div>

      <div className="space-y-6">
        {/* Total FTE */}
        <div>
          <label htmlFor="actualFTE" className={labelClass}>
            Total FTE on Books
            <span className="text-gray-500 text-xs ml-2">(full-time equivalents)</span>
          </label>
          <input
            id="actualFTE"
            type="number"
            min="0"
            step="0.1"
            value={actualStaff.totalFTE}
            onChange={handleChange('totalFTE')}
            className={inputClass}
            placeholder="e.g., 150.0"
          />
          <p className="mt-1 text-xs text-gray-500">
            Total full-time equivalents including shrinkage
          </p>
        </div>

        {/* Productive Agents */}
        <div>
          <label htmlFor="actualAgents" className={labelClass}>
            Productive Agents Available
            <span className="text-gray-500 text-xs ml-2">(agents on phones)</span>
          </label>
          <input
            id="actualAgents"
            type="number"
            min="0"
            step="1"
            value={actualStaff.productiveAgents}
            onChange={handleChange('productiveAgents')}
            className={inputClass}
            placeholder="e.g., 120"
          />
          <p className="mt-1 text-xs text-gray-500">
            Agents actually available to handle contacts (after shrinkage)
          </p>
        </div>

        {/* Shrinkage % (informational) */}
        {actualStaff.totalFTE > 0 && actualStaff.productiveAgents > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Calculated Shrinkage</p>
            <p className="text-2xl font-bold text-blue-600">
              {((1 - actualStaff.productiveAgents / actualStaff.totalFTE) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Based on {actualStaff.totalFTE} FTE and {actualStaff.productiveAgents} productive agents
            </p>
          </div>
        )}

        {/* Use as Constraint */}
        <div className="border-t pt-6 mt-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={actualStaff.useAsConstraint}
              onChange={handleCheckboxChange}
              className="mt-0.5 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">
                Use as staffing constraint
              </span>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, calculations will consider your actual staffing levels
                and show what service level you can achieve with current staff
              </p>
            </div>
          </label>
        </div>

        {/* Status indicator */}
        {actualStaff.totalFTE > 0 && (
          <div className={`p-3 rounded-md ${actualStaff.useAsConstraint ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-xs font-medium">
              {actualStaff.useAsConstraint ? (
                <>
                  <span className="text-green-600">✓ Constraint Active:</span>
                  <span className="text-gray-700"> Calculations will use your actual staff of {actualStaff.productiveAgents} agents</span>
                </>
              ) : (
                <>
                  <span className="text-gray-600">○ Informational Only:</span>
                  <span className="text-gray-600"> Calculations will determine optimal staffing independently</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Quick Actions</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActualStaff('totalFTE', 0);
                setActualStaff('productiveAgents', 0);
                setActualStaff('useAsConstraint', false);
              }}
              className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActualStaffPanel;

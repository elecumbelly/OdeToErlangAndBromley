import { useState } from 'react';
import { calculateStaffingMetrics } from '../lib/calculations/erlangC';
import type { StaffingMetrics } from '../lib/calculations/erlangC';
import type { CalculationInputs } from '../types';

interface Scenario {
  id: string;
  name: string;
  inputs: CalculationInputs;
  results: StaffingMetrics | null;
}

export default function ScenarioComparison() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: '1',
      name: 'Current State',
      inputs: {
        volume: 100,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        shrinkagePercent: 25,
        maxOccupancy: 90,
        model: 'erlangC',
        averagePatience: 120
      },
      results: null
    },
    {
      id: '2',
      name: 'Higher SL Target',
      inputs: {
        volume: 100,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 90,
        thresholdSeconds: 20,
        shrinkagePercent: 25,
        maxOccupancy: 90,
        model: 'erlangC',
        averagePatience: 120
      },
      results: null
    },
    {
      id: '3',
      name: 'Volume +20%',
      inputs: {
        volume: 120,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        shrinkagePercent: 25,
        maxOccupancy: 90,
        model: 'erlangC',
        averagePatience: 120
      },
      results: null
    }
  ]);

  const calculateAll = () => {
    const updated = scenarios.map(scenario => ({
      ...scenario,
      results: calculateStaffingMetrics({
        volume: scenario.inputs.volume,
        aht: scenario.inputs.aht,
        intervalSeconds: scenario.inputs.intervalMinutes * 60,
        targetSL: scenario.inputs.targetSLPercent / 100,
        thresholdSeconds: scenario.inputs.thresholdSeconds,
        shrinkagePercent: scenario.inputs.shrinkagePercent / 100,
        maxOccupancy: scenario.inputs.maxOccupancy / 100
      })
    }));
    setScenarios(updated);
  };

  const addScenario = () => {
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: `Scenario ${scenarios.length + 1}`,
      inputs: {
        volume: 100,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        shrinkagePercent: 25,
        maxOccupancy: 90,
        model: 'erlangC',
        averagePatience: 120
      },
      results: null
    };
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, ...updates, results: null } : s));
  };

  const updateInput = (id: string, field: keyof CalculationInputs, value: number) => {
    setScenarios(scenarios.map(s =>
      s.id === id
        ? { ...s, inputs: { ...s.inputs, [field]: value }, results: null }
        : s
    ));
  };

  // Calculate baseline (first scenario) for comparisons
  const baseline = scenarios[0]?.results;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">What-If Scenario Analysis</h3>
            <p className="text-sm text-gray-600">
              Compare different scenarios side-by-side to understand impact of changes
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={addScenario}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              + Add Scenario
            </button>
            <button
              onClick={calculateAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Calculate All
            </button>
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario, idx) => (
            <div key={scenario.id} className="border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                  className="font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none"
                />
                {idx > 0 && (
                  <button
                    onClick={() => removeScenario(scenario.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Volume</label>
                    <input
                      type="number"
                      value={scenario.inputs.volume}
                      onChange={(e) => updateInput(scenario.id, 'volume', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">AHT (s)</label>
                    <input
                      type="number"
                      value={scenario.inputs.aht}
                      onChange={(e) => updateInput(scenario.id, 'aht', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Target SL %</label>
                    <input
                      type="number"
                      value={scenario.inputs.targetSLPercent}
                      onChange={(e) => updateInput(scenario.id, 'targetSLPercent', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Threshold (s)</label>
                    <input
                      type="number"
                      value={scenario.inputs.thresholdSeconds}
                      onChange={(e) => updateInput(scenario.id, 'thresholdSeconds', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Shrinkage %</label>
                    <input
                      type="number"
                      value={scenario.inputs.shrinkagePercent}
                      onChange={(e) => updateInput(scenario.id, 'shrinkagePercent', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Max Occ %</label>
                    <input
                      type="number"
                      value={scenario.inputs.maxOccupancy}
                      onChange={(e) => updateInput(scenario.id, 'maxOccupancy', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>

                {scenario.results && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Required Agents:</span>
                      <span className="text-xs font-semibold">{scenario.results.requiredAgents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Total FTE:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-semibold">{scenario.results.totalFTE.toFixed(1)}</span>
                        {baseline && idx > 0 && (
                          <span className={`text-xs ${scenario.results.totalFTE > baseline.totalFTE ? 'text-red-600' : 'text-green-600'}`}>
                            ({scenario.results.totalFTE > baseline.totalFTE ? '+' : ''}
                            {(scenario.results.totalFTE - baseline.totalFTE).toFixed(1)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Service Level:</span>
                      <span className={`text-xs font-semibold ${scenario.results.serviceLevel >= scenario.inputs.targetSLPercent / 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {(scenario.results.serviceLevel * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">ASA:</span>
                      <span className="text-xs font-semibold">{scenario.results.asa.toFixed(0)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Occupancy:</span>
                      <span className="text-xs font-semibold">{(scenario.results.occupancy * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Summary */}
      {scenarios.every(s => s.results) && scenarios.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparison Summary</h4>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-white">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Metric</th>
                  {scenarios.map(scenario => (
                    <th key={scenario.id} className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                      {scenario.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Range</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">Total FTE</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="px-4 py-2 text-sm font-semibold">
                      {scenario.results?.totalFTE.toFixed(1)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {(Math.max(...scenarios.map(s => s.results?.totalFTE || 0)) -
                      Math.min(...scenarios.map(s => s.results?.totalFTE || 0))).toFixed(1)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">Service Level</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="px-4 py-2 text-sm font-semibold">
                      {((scenario.results?.serviceLevel || 0) * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {((Math.max(...scenarios.map(s => (s.results?.serviceLevel || 0) * 100)) -
                      Math.min(...scenarios.map(s => (s.results?.serviceLevel || 0) * 100)))).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">ASA (seconds)</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="px-4 py-2 text-sm font-semibold">
                      {scenario.results?.asa.toFixed(0)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {(Math.max(...scenarios.map(s => s.results?.asa || 0)) -
                      Math.min(...scenarios.map(s => s.results?.asa || 0))).toFixed(0)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">Occupancy</td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="px-4 py-2 text-sm font-semibold">
                      {((scenario.results?.occupancy || 0) * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {((Math.max(...scenarios.map(s => (s.results?.occupancy || 0) * 100)) -
                      Math.min(...scenarios.map(s => (s.results?.occupancy || 0) * 100)))).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg">
            <h5 className="font-semibold text-sm text-gray-900 mb-2">Key Insights</h5>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>
                • FTE range: {Math.min(...scenarios.map(s => s.results?.totalFTE || 0)).toFixed(1)} to{' '}
                {Math.max(...scenarios.map(s => s.results?.totalFTE || 0)).toFixed(1)}
                ({((Math.max(...scenarios.map(s => s.results?.totalFTE || 0)) /
                  Math.min(...scenarios.map(s => s.results?.totalFTE || 1)) - 1) * 100).toFixed(1)}% variation)
              </li>
              <li>
                • Best service level: {(Math.max(...scenarios.map(s => (s.results?.serviceLevel || 0) * 100))).toFixed(1)}%
              </li>
              <li>
                • Lowest ASA: {Math.min(...scenarios.map(s => s.results?.asa || Infinity)).toFixed(0)}s
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

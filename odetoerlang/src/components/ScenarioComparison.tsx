import { useEffect, useState } from 'react';
import { calculateStaffingMetrics } from '../lib/calculations/erlangC';
import { useCalculatorStore } from '../store/calculatorStore';
import type { StaffingMetrics } from '../lib/calculations/erlangC';
import type { CalculationInputs } from '../types';
import { MetricCard } from './ui/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Scenario {
  id: string;
  name: string;
  inputs: CalculationInputs;
  results: StaffingMetrics | null;
}

const CHART_THEME = {
  bg: 'transparent',
  grid: 'rgba(255,255,255,0.1)',
  text: '#94a3b8',
  tooltipBg: '#0f172a',
  tooltipBorder: '#1e293b',
  colors: ['#06b6d4', '#a855f7', '#f59e0b', '#22c55e']
};

export default function ScenarioComparison() {
  const { inputs: currentInputs, setInput } = useCalculatorStore();

  const [scenarios, setScenarios] = useState<Scenario[]>(() => [
    {
      id: '1',
      name: 'Current State',
      inputs: { ...currentInputs },
      results: null
    },
    {
      id: '2',
      name: 'High Volume (+20%)',
      inputs: {
        ...currentInputs,
        volume: Math.round(currentInputs.volume * 1.2)
      },
      results: null
    },
    {
      id: '3',
      name: 'Strict SL (90%)',
      inputs: {
        ...currentInputs,
        targetSLPercent: Math.min(95, currentInputs.targetSLPercent + 10)
      },
      results: null
    }
  ]);

  useEffect(() => {
    setScenarios((prev) => {
      if (prev.length === 0) return prev;
      const [baseline, ...rest] = prev;
      const nextInputs = { ...currentInputs };
      const keys = Object.keys(nextInputs) as Array<keyof CalculationInputs>;
      const hasChanges = keys.some((key) => baseline.inputs[key] !== nextInputs[key]);

      if (!hasChanges) return prev;

      return [{ ...baseline, inputs: nextInputs, results: null }, ...rest];
    });
  }, [currentInputs]);

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
      inputs: { ...currentInputs },
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
    const baselineId = scenarios[0]?.id;
    setScenarios(scenarios.map(s =>
      s.id === id
        ? { ...s, inputs: { ...s.inputs, [field]: value }, results: null }
        : s
    ));

    if (id === baselineId) {
      setInput(field, value as CalculationInputs[typeof field]);
    }
  };

  // Prepare chart data
  const chartData = scenarios
    .filter(s => s.results)
    .map(s => ({
      name: s.name,
      FTE: s.results?.totalFTE || 0,
      'SL %': (s.results?.serviceLevel || 0) * 100,
      'ASA (s)': s.results?.asa || 0
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Container */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle/30 bg-gradient-to-b from-bg-surface to-bg-base p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple/[0.02] to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">What-If Scenarios</h2>
            <p className="text-sm text-text-secondary mt-1">
              Compare staffing requirements across different assumptions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addScenario}
              className="px-4 py-2 bg-bg-elevated border border-border-subtle text-text-primary hover:border-purple/50 rounded-lg text-sm font-medium transition-all"
            >
              + Add Scenario
            </button>
            <button
              onClick={calculateAll}
              className="px-4 py-2 bg-purple text-bg-base rounded-lg text-sm font-medium hover:bg-purple/90 shadow-glow-purple"
            >
              Run Comparison
            </button>
          </div>
        </div>

        {/* Sandbox Warning */}
        <div className="mb-6 p-4 bg-amber/10 border border-amber/30 rounded-lg flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber uppercase tracking-wide">Sandbox Mode</p>
            <p className="text-xs text-amber/80 mt-1">
              These scenarios are temporary. To save permanent forecasts, use the Import/Historical tab.
            </p>
          </div>
        </div>

        {/* Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario, idx) => (
            <div key={scenario.id} className="group bg-bg-elevated/50 border border-border-subtle rounded-xl p-4 transition-all hover:border-purple/30 hover:shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-border-muted pb-2">
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                  className="bg-transparent font-semibold text-text-primary border-b border-transparent focus:border-purple outline-none w-full mr-2"
                />
                {idx > 0 && (
                  <button
                    onClick={() => removeScenario(scenario.id)}
                    className="text-text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs text-text-muted uppercase">Volume</label>
                    <input
                      type="number"
                      value={scenario.inputs.volume}
                      onChange={(e) => updateInput(scenario.id, 'volume', Number(e.target.value))}
                      className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1 text-sm text-text-primary focus:border-purple outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase">AHT (s)</label>
                    <input
                      type="number"
                      value={scenario.inputs.aht}
                      onChange={(e) => updateInput(scenario.id, 'aht', Number(e.target.value))}
                      className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1 text-sm text-text-primary focus:border-purple outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase">Target SL %</label>
                    <input
                      type="number"
                      value={scenario.inputs.targetSLPercent}
                      onChange={(e) => updateInput(scenario.id, 'targetSLPercent', Number(e.target.value))}
                      className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1 text-sm text-text-primary focus:border-purple outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase">Occ %</label>
                    <input
                      type="number"
                      value={scenario.inputs.maxOccupancy}
                      onChange={(e) => updateInput(scenario.id, 'maxOccupancy', Number(e.target.value))}
                      className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1 text-sm text-text-primary focus:border-purple outline-none"
                    />
                  </div>
                </div>

                {scenario.results ? (
                  <div className="mt-4 pt-3 border-t border-border-muted space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-secondary">Total FTE</span>
                      <span className="text-lg font-bold text-purple">{scenario.results.totalFTE.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">Agents</span>
                      <span className="text-text-primary font-medium">{scenario.results.requiredAgents}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted">SL Achieved</span>
                      <span className={`font-medium ${scenario.results.serviceLevel >= scenario.inputs.targetSLPercent / 100 ? 'text-green' : 'text-amber'}`}>
                        {(scenario.results.serviceLevel * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 text-center text-xs text-text-muted italic">
                    Press 'Run Comparison' to calculate
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Comparison */}
        {scenarios.every(s => s.results) && scenarios.length > 1 && (
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="bg-bg-elevated/30 border border-border-subtle rounded-xl p-5">
              <h3 className="text-base font-bold text-text-primary mb-4">FTE Requirements</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis dataKey="name" stroke={CHART_THEME.text} fontSize={11} />
                    <YAxis stroke={CHART_THEME.text} fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, borderColor: CHART_THEME.tooltipBorder, borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="FTE" fill={CHART_THEME.colors[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-bg-elevated/30 border border-border-subtle rounded-xl p-5">
              <h3 className="text-base font-bold text-text-primary mb-4">Service Level Impact</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis dataKey="name" stroke={CHART_THEME.text} fontSize={11} />
                    <YAxis stroke={CHART_THEME.text} fontSize={11} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: CHART_THEME.tooltipBg, borderColor: CHART_THEME.tooltipBorder, borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="SL %" fill={CHART_THEME.colors[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

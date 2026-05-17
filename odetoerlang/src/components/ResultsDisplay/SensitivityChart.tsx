import { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCalculatorStore } from '../../store/calculatorStore';
import { calculateAchievableMetrics } from '../../lib/calculations/erlangEngine';

export const SensitivityChart = memo(() => {
  const { results, inputs } = useCalculatorStore();

  const sensitivityData = useMemo(() => {
    const data: Array<{ agents: number; sl: number }> = [];
    if (!results) return data;
    const start = Math.max(1, results.requiredAgents - 5);
    const end = results.requiredAgents + 5;
    for (let agents = start; agents <= end; agents++) {
      const achievable = calculateAchievableMetrics({
        model: inputs.model,
        fixedAgents: agents,
        workload: {
          volume: inputs.volume,
          aht: inputs.aht,
          intervalMinutes: inputs.intervalMinutes,
        },
        constraints: {
          thresholdSeconds: inputs.thresholdSeconds,
          maxOccupancy: inputs.maxOccupancy,
        },
        behavior: {
          shrinkagePercent: inputs.shrinkagePercent,
          averagePatience: inputs.averagePatience,
          concurrency: inputs.concurrency,
        },
      });
      if (achievable?.serviceLevel !== undefined) {
        data.push({ agents, sl: parseFloat(achievable.serviceLevel.toFixed(1)) });
      }
    }
    return data;
  }, [results, inputs]);

  if (!results || sensitivityData.length === 0) return null;

  return (
    <div className="mt-6 p-5 bg-bg-surface/50 border border-border-subtle/30 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Sensitivity: Agents vs SL</h4>
        <p className="text-sm text-text-muted">Centered on required agents</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={sensitivityData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis dataKey="agents" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ fontSize: '12px', background: '#0b1322', border: '1px solid #1f2937', borderRadius: '8px' }}
              labelFormatter={(label) => `Agents: ${label}`}
              formatter={(value) => [`${value}%`, 'SL']}
            />
            <ReferenceLine x={results.requiredAgents} stroke="#06b6d4" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="sl" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

SensitivityChart.displayName = 'SensitivityChart';

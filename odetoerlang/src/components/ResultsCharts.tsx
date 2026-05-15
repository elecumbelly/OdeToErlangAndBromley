import { useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { calculateServiceLevel, calculateOccupancy } from '../lib/calculations/erlangC';
import { calculateServiceLevelWithAbandonment } from '../lib/calculations/erlangA';
import { useChartTheme } from '../hooks/useChartTheme';

const ResultsCharts: React.FC = () => {
  const { inputs, results } = useCalculatorStore();
  const theme = useChartTheme();

  const slVolumeData = useMemo(() => {
    if (!results) return null;
    const baseVol = inputs.volume;
    const steps = [-0.2, -0.1, 0, 0.1, 0.2];
    const labels: string[] = [];
    const data: number[] = [];
    steps.forEach((s) => {
      const v = Math.max(1, Math.round(baseVol * (1 + s)));
      const traffic = (v * inputs.aht) / (inputs.intervalMinutes * 60);
      let sl = 0;
      if (inputs.model === 'A') {
        sl = calculateServiceLevelWithAbandonment(
          results.requiredAgents,
          traffic,
          inputs.aht,
          inputs.thresholdSeconds,
          inputs.averagePatience
        ) * 100;
      } else {
        sl = calculateServiceLevel(
          results.requiredAgents,
          traffic,
          inputs.aht,
          inputs.thresholdSeconds
        ) * 100;
      }
      labels.push(`${v}`);
      data.push(Number(sl.toFixed(1)));
    });
    return { labels, data };
  }, [inputs, results]);

  const occupancyAgentsData = useMemo(() => {
    if (!results) return null;
    const baseAgents = results.requiredAgents;
    const steps = [-2, -1, 0, 1, 2].map((delta) => Math.max(1, baseAgents + delta));
    const labels: string[] = [];
    const data: number[] = [];
    steps.forEach((agents) => {
      const occ = calculateOccupancy(results.trafficIntensity, agents) * 100;
      labels.push(`${agents}`);
      data.push(Number(occ.toFixed(1)));
    });
    return { labels, data };
  }, [results]);

  if (!results) return null;

  const renderSpark = (labels: string[], data: number[], color: string, yLabel: string, target?: number) => {
    if (labels.length === 0) return null;

    const W = 280;
    const H = 140;
    const PAD = 10;

    const minY = Math.min(...data, target ?? data[0]!);
    const maxY = Math.max(...data, target ?? data[0]!);
    const range = maxY - minY || 1;
    const lastIndex = Math.max(1, data.length - 1);

    const xAt = (i: number) => PAD + (i / lastIndex) * (W - 2 * PAD);
    const yAt = (v: number) => H - PAD - ((v - minY) / range) * (H - 2 * PAD);

    const points = data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
    const targetY = target !== undefined ? yAt(target) : null;

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {targetY !== null && (
          <line x1={PAD} x2={W - PAD} y1={targetY} y2={targetY} stroke={theme.target} strokeDasharray="6,6" strokeWidth={1} />
        )}
        <polyline
          fill={`url(#grad-${color})`}
          stroke="none"
          points={`${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={2}
          points={points}
        />
        {data.map((v, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(v)} r={3} fill={color} />
        ))}
        <text x={PAD} y={PAD + 4} fontSize="10" fill={theme.text}>{yLabel}</text>
        <text x={W - PAD} y={H - PAD / 2} fontSize="10" fill={theme.textMuted} textAnchor="end">
          {labels.join('  ')}
        </text>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {slVolumeData && (
        <div className="p-4 bg-bg-surface border border-border-subtle rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text-primary">Service Level vs Volume</p>
            <p className="text-xs text-text-secondary">Current volume: {inputs.volume}</p>
          </div>
          {renderSpark(slVolumeData.labels, slVolumeData.data, theme.primary, 'SL %', inputs.targetSLPercent)}
        </div>
      )}

      {occupancyAgentsData && (
        <div className="p-4 bg-bg-surface border border-border-subtle rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text-primary">Occupancy vs Agents</p>
            <p className="text-xs text-text-secondary">Current agents: {results.requiredAgents}</p>
          </div>
          {renderSpark(occupancyAgentsData.labels, occupancyAgentsData.data, theme.info, 'Occupancy %', inputs.maxOccupancy)}
        </div>
      )}
    </div>
  );
};

export default ResultsCharts;

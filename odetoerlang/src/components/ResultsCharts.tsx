import { useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { calculateServiceLevel, calculateOccupancy } from '../lib/calculations/erlangC';
import { calculateServiceLevelWithAbandonment } from '../lib/calculations/erlangA';

const ResultsCharts: React.FC = () => {
  const { inputs, results } = useCalculatorStore();

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
    const w = 280;
    const h = 140;
    const minY = Math.min(...data, target ?? data[0]);
    const maxY = Math.max(...data, target ?? data[0]);
    const pad = 10;
    const norm = (v: number) =>
      h - pad - ((v - minY) / (maxY - minY || 1)) * (h - 2 * pad);
    const points = data
      .map((v, i) => {
        const x = pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad);
        const y = norm(v);
        return `${x},${y}`;
      })
      .join(' ');
    const targetY = target !== undefined ? norm(target) : null;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {targetY !== null && (
          <line x1={pad} x2={w - pad} y1={targetY} y2={targetY} stroke="#16a34a" strokeDasharray="6,6" strokeWidth={1} />
        )}
        <polyline
          fill={`url(#grad-${color})`}
          stroke="none"
          points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={2}
          points={points}
        />
        {data.map((v, i) => {
          const x = pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad);
          const y = norm(v);
          return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
        <text x={pad} y={pad + 4} fontSize="10" fill="#4b5563">{yLabel}</text>
        <text x={w - pad} y={h - pad / 2} fontSize="10" fill="#6b7280" textAnchor="end">
          {labels.join('  ')}
        </text>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {slVolumeData && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Service Level vs Volume</p>
            <p className="text-xs text-gray-500">Current volume: {inputs.volume}</p>
          </div>
          {renderSpark(slVolumeData.labels, slVolumeData.data, '#2563eb', 'SL %', inputs.targetSLPercent)}
        </div>
      )}

      {occupancyAgentsData && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Occupancy vs Agents</p>
            <p className="text-xs text-gray-500">Current agents: {results.requiredAgents}</p>
          </div>
          {renderSpark(occupancyAgentsData.labels, occupancyAgentsData.data, '#0ea5e9', 'Occupancy %', inputs.maxOccupancy)}
        </div>
      )}
    </div>
  );
};

export default ResultsCharts;

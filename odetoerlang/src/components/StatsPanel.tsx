/**
 * Statistics display panel with time series chart
 */

import { type Snapshot } from '../simulation/types';

interface StatsPanelProps {
  snapshot: Snapshot;
}

export default function StatsPanel({ snapshot }: StatsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Simulation Time"
            value={snapshot.now.toFixed(2)}
            unit="units"
            color="blue"
          />
          <MetricCard
            label="Queue Length"
            value={snapshot.queueLength}
            unit="customers"
            color="purple"
          />
          <MetricCard
            label="In Service"
            value={snapshot.inService}
            unit="customers"
            color="green"
          />
          <MetricCard
            label="Completed"
            value={snapshot.servicedCount}
            unit="total"
            color="gray"
          />
          <MetricCard
            label="Avg Wait Time"
            value={snapshot.avgWaitTime.toFixed(2)}
            unit="units"
            color="orange"
          />
          <MetricCard
            label="Max Queue"
            value={snapshot.maxQueueLength}
            unit="peak"
            color="red"
          />
        </div>
      </div>

      {/* Time Series Chart */}
      <TimeSeriesChart timeSeries={snapshot.timeSeries} />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: 'blue' | 'purple' | 'green' | 'gray' | 'orange' | 'red';
}

function MetricCard({ label, value, unit, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-xs font-medium opacity-75 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75 mt-1">{unit}</div>
    </div>
  );
}

interface TimeSeriesChartProps {
  timeSeries: Array<{ time: number; queueLength: number; inService: number }>;
}

function TimeSeriesChart({ timeSeries }: TimeSeriesChartProps) {
  if (timeSeries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Length Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm italic">
          No data yet - start the simulation to see the chart
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxTime = Math.max(...timeSeries.map(d => d.time));
  const maxQueue = Math.max(...timeSeries.map(d => d.queueLength), 1);
  const maxInService = Math.max(...timeSeries.map(d => d.inService), 1);
  const maxY = Math.max(maxQueue, maxInService);

  const xScale = (time: number) => padding.left + (time / maxTime) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - (value / maxY) * chartHeight;

  // Generate path data for queue length
  const queuePath = timeSeries
    .map((d, i) => {
      const x = xScale(d.time);
      const y = yScale(d.queueLength);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate path data for in-service
  const inServicePath = timeSeries
    .map((d, i) => {
      const x = xScale(d.time);
      const y = yScale(d.inService);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Y-axis ticks
  const yTicks = Array.from({ length: 6 }, (_, i) => (i * maxY) / 5);

  // X-axis ticks
  const xTicks = Array.from({ length: 6 }, (_, i) => (i * maxTime) / 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Length Over Time</h3>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Y-axis grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={padding.left + chartWidth}
                y2={yScale(tick)}
                stroke="#e5e7eb"
                strokeDasharray="3,3"
              />
              <text
                x={padding.left - 10}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-gray-600"
              >
                {tick.toFixed(0)}
              </text>
            </g>
          ))}

          {/* X-axis grid lines */}
          {xTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={xScale(tick)}
                y1={padding.top}
                x2={xScale(tick)}
                y2={padding.top + chartHeight}
                stroke="#e5e7eb"
                strokeDasharray="3,3"
              />
              <text
                x={xScale(tick)}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="#374151"
            strokeWidth={2}
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#374151"
            strokeWidth={2}
          />

          {/* In Service line (behind) */}
          <path
            d={inServicePath}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            opacity={0.6}
          />

          {/* Queue Length line (in front) */}
          <path
            d={queuePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth={3}
          />

          {/* Axis labels */}
          <text
            x={padding.left + chartWidth / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
          >
            Simulation Time
          </text>
          <text
            x={15}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
            className="text-sm fill-gray-700 font-medium"
          >
            Number of Customers
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-0.5 bg-indigo-500"></div>
          <span className="text-sm text-gray-700">Queue Length</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-0.5 bg-green-500 opacity-60"></div>
          <span className="text-sm text-gray-700">In Service</span>
        </div>
      </div>
    </div>
  );
}

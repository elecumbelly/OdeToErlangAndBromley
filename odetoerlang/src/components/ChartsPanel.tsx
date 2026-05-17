import { useMemo, memo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCalculatorStore } from '../store/calculatorStore';
import { calculateServiceLevel, calculateOccupancy, calculateASA } from '../lib/calculations/erlangC';
import { useChartTheme } from '../hooks/useChartTheme';

interface ServiceLevelDataPoint {
  agents: number;
  serviceLevel: number;
  occupancy: number;
  asa: number;
  fte: number;
}

interface CostDataPoint {
  agents: number;
  serviceLevel: number;
  cost: number;
  costPerContact: number;
}

interface IntervalDataPoint {
  time: string;
  volume: number;
  requiredAgents: number;
  fte: number;
  trafficIntensity: number;
}

// Defaults for the cost projection chart. 25 GBP/hr × 2080 hrs/year is a
// rough US-loaded agent annual cost; tweak with care — these are visualised,
// not solved against.
const HOURLY_RATE = 25;
const ANNUAL_PAID_HOURS = 2080;
const INTRADAY_VOLUME_PATTERN = [0.7, 1.0, 1.2, 1.1, 0.8, 0.7, 0.9, 1.0, 0.8, 0.6];
const INTRADAY_LABELS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function trafficIntensityOf(volume: number, aht: number, intervalMinutes: number): number {
  return (volume * aht) / (intervalMinutes * 60);
}

function agentRange(trafficIntensity: number): { min: number; max: number } {
  return {
    min: Math.ceil(trafficIntensity),
    max: Math.ceil(trafficIntensity * 1.5),
  };
}

function fteFromAgents(agents: number, shrinkagePercent: number): number {
  return agents / (1 - shrinkagePercent / 100);
}

export default memo(function ChartsPanel() {
  const { inputs } = useCalculatorStore();
  const theme = useChartTheme();

  const tooltipStyle = {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    color: theme.text,
  };

  const serviceLevelData = useMemo(() => {
    const trafficIntensity = trafficIntensityOf(inputs.volume, inputs.aht, inputs.intervalMinutes);
    const { min, max } = agentRange(trafficIntensity);
    const data: ServiceLevelDataPoint[] = [];

    for (let agents = min; agents <= max; agents++) {
      const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
      const occupancy = calculateOccupancy(trafficIntensity, agents);
      const asa = calculateASA(agents, trafficIntensity, inputs.aht);
      const fte = fteFromAgents(agents, inputs.shrinkagePercent);

      data.push({
        agents,
        serviceLevel: sl * 100,
        occupancy: occupancy * 100,
        asa,
        fte: Number(fte.toFixed(1)),
      });
    }
    return data;
  }, [inputs]);

  const costData = useMemo(() => {
    const trafficIntensity = trafficIntensityOf(inputs.volume, inputs.aht, inputs.intervalMinutes);
    const { min, max } = agentRange(trafficIntensity);
    const data: CostDataPoint[] = [];

    for (let agents = min; agents <= max; agents++) {
      const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
      const fte = fteFromAgents(agents, inputs.shrinkagePercent);
      const annualCost = fte * HOURLY_RATE * ANNUAL_PAID_HOURS;

      data.push({
        agents,
        serviceLevel: sl * 100,
        cost: Math.round(annualCost / 1000),
        costPerContact: Number((annualCost / (inputs.volume * 48 * 5 * 52)).toFixed(2)),
      });
    }
    return data;
  }, [inputs]);

  const intervalData = useMemo(() => {
    const data: IntervalDataPoint[] = [];
    const targetSL = inputs.targetSLPercent / 100;

    INTRADAY_LABELS.forEach((time, idx) => {
      const volume = Math.round(inputs.volume * INTRADAY_VOLUME_PATTERN[idx]!);
      const trafficIntensity = trafficIntensityOf(volume, inputs.aht, inputs.intervalMinutes);
      const minAgents = Math.ceil(trafficIntensity);

      let requiredAgents = minAgents;
      for (let agents = minAgents; agents <= minAgents + 20; agents++) {
        const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
        if (sl >= targetSL) {
          requiredAgents = agents;
          break;
        }
      }

      const fte = fteFromAgents(requiredAgents, inputs.shrinkagePercent);

      data.push({
        time,
        volume,
        requiredAgents,
        fte: Number(fte.toFixed(1)),
        trafficIntensity: Number(trafficIntensity.toFixed(2)),
      });
    });

    return data;
  }, [inputs]);

  return (
    <div className="space-y-8">
      <div className="bg-bg-surface border border-border-subtle rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Service Level vs Staffing</h3>
        <p className="text-sm text-text-secondary mb-4">
          Shows how service level improves with additional agents. The dashed line marks your target {inputs.targetSLPercent}%.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={serviceLevelData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey="agents" stroke={theme.axis} label={{ value: 'Number of Agents', position: 'insideBottom', offset: -5, fill: theme.axis }} />
            <YAxis stroke={theme.axis} label={{ value: 'Service Level (%)', angle: -90, position: 'insideLeft', fill: theme.axis }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              labelFormatter={(label) => `${label} agents`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="serviceLevel"
              stroke={theme.primary}
              fill={theme.primaryFill}
              name="Service Level"
            />
            <Line
              type="monotone"
              dataKey={() => inputs.targetSLPercent}
              stroke={theme.target}
              strokeDasharray="5 5"
              name="Target SL"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-surface border border-border-subtle rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Occupancy vs Agents</h3>
          <p className="text-sm text-text-secondary mb-4">
            Agent occupancy decreases with more staff. Target: 85-90% for voice.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={serviceLevelData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="agents" stroke={theme.axis} />
              <YAxis stroke={theme.axis} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value).toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="occupancy" stroke={theme.success} strokeWidth={2} name="Occupancy %" />
              <Line
                type="monotone"
                dataKey={() => 90}
                stroke={theme.warn}
                strokeDasharray="5 5"
                name="Max Target"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Average Speed of Answer</h3>
          <p className="text-sm text-text-secondary mb-4">
            ASA decreases significantly with additional agents.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serviceLevelData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="agents" stroke={theme.axis} />
              <YAxis stroke={theme.axis} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value).toFixed(0)}s`} />
              <Legend />
              <Bar dataKey="asa" fill={theme.secondary} name="ASA (seconds)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Cost vs Service Level Trade-off</h3>
        <p className="text-sm text-text-secondary mb-4">
          Annual staffing cost increases with service level. Find the optimal balance for your business.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey="serviceLevel" stroke={theme.axis} label={{ value: 'Service Level (%)', position: 'insideBottom', offset: -5, fill: theme.axis }} />
            <YAxis
              yAxisId="left"
              stroke={theme.axis}
              label={{ value: 'Annual Cost ($K)', angle: -90, position: 'insideLeft', fill: theme.axis }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={theme.axis}
              label={{ value: 'Cost per Contact ($)', angle: 90, position: 'insideRight', fill: theme.axis }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cost"
              stroke={theme.danger}
              strokeWidth={2}
              name="Annual Cost ($K)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="costPerContact"
              stroke={theme.success}
              strokeWidth={2}
              name="Cost per Contact ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Intraday Forecast (Typical Pattern)</h3>
        <p className="text-sm text-text-secondary mb-4">
          Simulated staffing requirements throughout the day based on typical volume patterns.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={intervalData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey="time" stroke={theme.axis} />
            <YAxis yAxisId="left" stroke={theme.axis} />
            <YAxis yAxisId="right" orientation="right" stroke={theme.axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="volume"
              stroke={theme.info}
              fill={theme.infoFill}
              name="Volume"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="fte"
              stroke={theme.danger}
              strokeWidth={2}
              name="Required FTE"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

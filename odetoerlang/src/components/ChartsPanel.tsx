import { useMemo, memo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCalculatorStore } from '../store/calculatorStore';
import { calculateServiceLevel, calculateOccupancy, calculateASA } from '../lib/calculations/erlangC';

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

export default memo(function ChartsPanel() {
  const { inputs } = useCalculatorStore();

  // Generate service level curve data (varying agent count)
  const serviceLevelData = useMemo(() => {
    const data: ServiceLevelDataPoint[] = [];
    const trafficIntensity = (inputs.volume * inputs.aht) / (inputs.intervalMinutes * 60);
    const minAgents = Math.ceil(trafficIntensity);
    const maxAgents = Math.ceil(trafficIntensity * 1.5);

    for (let agents = minAgents; agents <= maxAgents; agents++) {
      const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
      const occupancy = calculateOccupancy(trafficIntensity, agents);
      const asa = calculateASA(agents, trafficIntensity, inputs.aht);
      const fte = agents / (1 - inputs.shrinkagePercent / 100);

      data.push({
        agents,
        serviceLevel: sl * 100,
        occupancy: occupancy * 100,
        asa,
        fte: Number(fte.toFixed(1))
      });
    }
    return data;
  }, [inputs]);

  // Generate cost analysis data
  const costData = useMemo(() => {
    const data: CostDataPoint[] = [];
    const trafficIntensity = (inputs.volume * inputs.aht) / (inputs.intervalMinutes * 60);
    const minAgents = Math.ceil(trafficIntensity);
    const maxAgents = Math.ceil(trafficIntensity * 1.5);
    const hourlyRate = 25; // Default hourly cost

    for (let agents = minAgents; agents <= maxAgents; agents++) {
      const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
      const fte = agents / (1 - inputs.shrinkagePercent / 100);
      const annualCost = fte * hourlyRate * 2080; // 2080 work hours per year

      data.push({
        agents,
        serviceLevel: sl * 100,
        cost: Math.round(annualCost / 1000), // In thousands
        costPerContact: Number((annualCost / (inputs.volume * 48 * 5 * 52)).toFixed(2)) // Weekly volume * 52 weeks
      });
    }
    return data;
  }, [inputs]);

  // Generate interval forecast data (simulating a day)
  const intervalData = useMemo(() => {
    const data: IntervalDataPoint[] = [];
    const intervals = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    // Simulate typical call volume pattern (morning peak, lunch dip, afternoon peak)
    const volumePattern = [0.7, 1.0, 1.2, 1.1, 0.8, 0.7, 0.9, 1.0, 0.8, 0.6];

    intervals.forEach((time, idx) => {
      const volume = Math.round(inputs.volume * volumePattern[idx]);
      const trafficIntensity = (volume * inputs.aht) / (inputs.intervalMinutes * 60);
      const minAgents = Math.ceil(trafficIntensity);

      // Find agents needed for target SL
      let requiredAgents = minAgents;
      for (let agents = minAgents; agents <= minAgents + 20; agents++) {
        const sl = calculateServiceLevel(agents, trafficIntensity, inputs.aht, inputs.thresholdSeconds);
        if (sl >= inputs.targetSLPercent / 100) {
          requiredAgents = agents;
          break;
        }
      }

      const fte = requiredAgents / (1 - inputs.shrinkagePercent / 100);

      data.push({
        time,
        volume,
        requiredAgents,
        fte: Number(fte.toFixed(1)),
        trafficIntensity: Number(trafficIntensity.toFixed(2))
      });
    });

    return data;
  }, [inputs]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Level vs Staffing</h3>
        <p className="text-sm text-gray-600 mb-4">
          Shows how service level improves with additional agents. The red line marks your target {inputs.targetSLPercent}%.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={serviceLevelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="agents" label={{ value: 'Number of Agents', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Service Level (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}%`}
              labelFormatter={(label) => `${label} agents`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="serviceLevel"
              stroke="#3b82f6"
              fill="#93c5fd"
              name="Service Level"
            />
            <Line
              type="monotone"
              dataKey={inputs.targetSLPercent}
              stroke="#ef4444"
              strokeDasharray="5 5"
              name="Target SL"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy vs Agents</h3>
          <p className="text-sm text-gray-600 mb-4">
            Agent occupancy decreases with more staff. Target: 85-90% for voice.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={serviceLevelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agents" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={2} name="Occupancy %" />
              <Line
                type="monotone"
                dataKey={() => 90}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                name="Max Target"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Speed of Answer</h3>
          <p className="text-sm text-gray-600 mb-4">
            ASA decreases significantly with additional agents.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serviceLevelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agents" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toFixed(0)}s`} />
              <Legend />
              <Bar dataKey="asa" fill="#8b5cf6" name="ASA (seconds)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost vs Service Level Trade-off</h3>
        <p className="text-sm text-gray-600 mb-4">
          Annual staffing cost increases with service level. Find the optimal balance for your business.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="serviceLevel" label={{ value: 'Service Level (%)', position: 'insideBottom', offset: -5 }} />
            <YAxis
              yAxisId="left"
              label={{ value: 'Annual Cost ($K)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Cost per Contact ($)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cost"
              stroke="#ef4444"
              strokeWidth={2}
              name="Annual Cost ($K)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="costPerContact"
              stroke="#10b981"
              strokeWidth={2}
              name="Cost per Contact ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intraday Forecast (Typical Pattern)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Simulated staffing requirements throughout the day based on typical volume patterns.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={intervalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="volume"
              stroke="#6366f1"
              fill="#a5b4fc"
              name="Volume"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="fte"
              stroke="#dc2626"
              strokeWidth={2}
              name="Required FTE"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

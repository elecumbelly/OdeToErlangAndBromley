import { useState, useMemo } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { calculateServiceLevel, calculateASA, calculateOccupancy, calculateTrafficIntensity } from '../lib/calculations/erlangC';
import { calculateServiceLevelWithAbandonment, calculateASAWithAbandonment, calculateAbandonmentProbability } from '../lib/calculations/erlangA';
import type { ErlangVariant } from '../types';

export default function ReverseCalculator() {
  const { inputs } = useCalculatorStore();

  const [availableAgents, setAvailableAgents] = useState(10);
  const [availableSeats, setAvailableSeats] = useState(12);
  const [model, setModel] = useState<ErlangVariant>('C');

  const results = useMemo(() => {
    const intervalSeconds = inputs.intervalMinutes * 60;
    const trafficIntensity = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);

    let serviceLevel = 0;
    let asa = 0;
    let abandonmentRate: number | undefined;
    let expectedAbandonments: number | undefined;

    if (model === 'C') {
      serviceLevel = calculateServiceLevel(
        availableAgents,
        trafficIntensity,
        inputs.aht,
        inputs.thresholdSeconds
      );
      asa = calculateASA(availableAgents, trafficIntensity, inputs.aht);
    } else if (model === 'A') { // Now covers both Erlang A and former X
      serviceLevel = calculateServiceLevelWithAbandonment(
        availableAgents,
        trafficIntensity,
        inputs.aht,
        inputs.thresholdSeconds,
        inputs.averagePatience
      );
      asa = calculateASAWithAbandonment(
        availableAgents,
        trafficIntensity,
        inputs.aht,
        inputs.averagePatience
      );
      const theta = inputs.averagePatience / inputs.aht;
      abandonmentRate = calculateAbandonmentProbability(availableAgents, trafficIntensity, theta);
      expectedAbandonments = inputs.volume * abandonmentRate;
    }

    const occupancy = calculateOccupancy(trafficIntensity, availableAgents);
    const utilization = (availableAgents / availableSeats) * 100;

    // Calculate how many agents we'd actually need for the target SL
    const targetAgents = Math.ceil(trafficIntensity / (inputs.maxOccupancy / 100));
    const surplusDeficit = availableAgents - targetAgents;

    return {
      serviceLevel: serviceLevel * 100,
      asa,
      occupancy: occupancy * 100,
      utilization,
      trafficIntensity,
      surplusDeficit,
      abandonmentRate,
      expectedAbandonments
    };
  }, [availableAgents, availableSeats, model, inputs]);

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === Infinity) return '∞';
    if (isNaN(num)) return '-';
    return num.toFixed(decimals);
  };

  const formatTime = (seconds: number): string => {
    if (seconds === Infinity) return '∞';
    if (isNaN(seconds)) return '-';
    if (seconds < 60) return `${formatNumber(seconds, 0)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (value: number, target: number, higher: boolean = true): string => {
    if (higher) {
      if (value >= target) return 'text-green-600';
      if (value >= target * 0.9) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value <= target) return 'text-green-600';
      if (value <= target * 1.1) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Capacity Planning (Reverse Calculator)</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your available staffing resources to see what service level you can achieve.
          Useful for capacity planning and "what-if" scenarios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Available Agents */}
          <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
            <label htmlFor="availableAgents" className={labelClass + " text-blue-900"}>
              Available Agents (Productive)
            </label>
            <input
              id="availableAgents"
              type="number"
              min="1"
              step="1"
              value={availableAgents}
              onChange={(e) => setAvailableAgents(parseInt(e.target.value) || 1)}
              className={inputClass + " text-2xl font-bold text-blue-900"}
            />
            <p className="mt-2 text-xs text-blue-700">
              Number of agents ready to take calls
            </p>
          </div>

          {/* Available Seats */}
          <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
            <label htmlFor="availableSeats" className={labelClass + " text-purple-900"}>
              Available Seats (Total Capacity)
            </label>
            <input
              id="availableSeats"
              type="number"
              min="1"
              step="1"
              value={availableSeats}
              onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
              className={inputClass + " text-2xl font-bold text-purple-900"}
            />
            <p className="mt-2 text-xs text-purple-700">
              Total workstations/licenses available
            </p>
          </div>

          {/* Model Selection */}
          <div className="border-2 border-gray-200 bg-gray-50 p-4 rounded-lg">
            <label htmlFor="model" className={labelClass}>
              Mathematical Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value as ErlangVariant)}
              className={inputClass}
            >
              <option value="C">Erlang C</option>
              <option value="A">Erlang A</option>
            </select>
            <p className="mt-2 text-xs text-gray-600">
              {model === 'C' && 'Infinite patience (classic)'}
              {model === 'A' && 'With abandonment (includes retrials)'}
            </p>
          </div>
        </div>

        {/* Workload Context */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-700">
            <strong>Workload:</strong> {inputs.volume} calls/interval, {inputs.aht}s AHT
            ({inputs.intervalMinutes} min intervals) = {results ? formatNumber(results.trafficIntensity, 2) : '-'} Erlangs
          </p>
          <p className="text-xs text-gray-700 mt-1">
            <strong>Target:</strong> {inputs.targetSLPercent}% in {inputs.thresholdSeconds}s
          </p>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Capacity Analysis Results</h3>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Service Level Achievement */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border-2 border-green-200">
              <p className="text-sm text-green-700 font-medium mb-1">Service Level Achieved</p>
              <p className={`text-4xl font-bold ${getStatusColor(results.serviceLevel, inputs.targetSLPercent)}`}>
                {formatNumber(results.serviceLevel, 1)}%
              </p>
              <p className="text-xs text-green-600 mt-2">
                Target: {inputs.targetSLPercent}% •
                {results.serviceLevel >= inputs.targetSLPercent ? ' ✓ MEETING TARGET' : ' ✗ BELOW TARGET'}
              </p>
            </div>

            {/* Agent Utilization */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border-2 border-purple-200">
              <p className="text-sm text-purple-700 font-medium mb-1">Seat Utilization</p>
              <p className="text-4xl font-bold text-purple-900">
                {formatNumber(results.utilization, 1)}%
              </p>
              <p className="text-xs text-purple-600 mt-2">
                {availableAgents} agents / {availableSeats} seats
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Average Speed of Answer (ASA)</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatTime(results.asa)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Agent Occupancy</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getStatusColor(results.occupancy, inputs.maxOccupancy, false)}`}>
                  {formatNumber(results.occupancy, 1)}%
                </p>
                <p className="text-xs text-gray-500">Max: {inputs.maxOccupancy}%</p>
              </div>
            </div>

            {/* Abandonment Metrics (for Erlang A/X) */}
            {results.abandonmentRate !== undefined && (
              <>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Abandonment Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatNumber(results.abandonmentRate * 100, 1)}%
                    </p>
                    <p className="text-xs text-orange-600">
                      {formatNumber(results.expectedAbandonments || 0, 0)} calls lost
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Capacity Analysis */}
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Capacity Status</p>
                <p className="text-xs text-gray-500">Agents vs. optimal for workload</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${results.surplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {results.surplusDeficit >= 0 ? '+' : ''}{results.surplusDeficit}
                </p>
                <p className="text-xs text-gray-600">
                  {results.surplusDeficit >= 0 ? 'agents surplus' : 'agents shortage'}
                </p>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Capacity Insights</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              {results.serviceLevel < inputs.targetSLPercent && (
                <li>
                  ⚠️ <strong>Understaffed:</strong> Service level is{' '}
                  {formatNumber(inputs.targetSLPercent - results.serviceLevel, 1)}% below target.
                  Consider adding {Math.abs(results.surplusDeficit)} more agents.
                </li>
              )}
              {results.serviceLevel > inputs.targetSLPercent * 1.1 && (
                <li>
                  ✓ <strong>Overstaffed:</strong> Service level exceeds target by{' '}
                  {formatNumber(results.serviceLevel - inputs.targetSLPercent, 1)}%.
                  You could reduce staffing by ~{results.surplusDeficit} agents.
                </li>
              )}
              {results.occupancy > inputs.maxOccupancy && (
                <li>
                  ⚠️ <strong>High Occupancy:</strong> At {formatNumber(results.occupancy, 1)}%,
                  agents will be overworked. Target is {inputs.maxOccupancy}%.
                </li>
              )}
              {results.utilization < 80 && (
                <li>
                  💺 <strong>Seat Capacity:</strong> Only using {formatNumber(results.utilization, 0)}% of seats.
                  You have {availableSeats - availableAgents} unused workstations.
                </li>
              )}
              {results.utilization > 95 && (
                <li>
                  ⚠️ <strong>Seat Constraint:</strong> Using {formatNumber(results.utilization, 0)}% of seats.
                  Consider adding more workstations/licenses.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

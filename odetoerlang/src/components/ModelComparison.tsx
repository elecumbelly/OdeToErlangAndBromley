import { useMemo } from 'react';
import { calculateStaffingMetrics, calculateTrafficIntensity, calculateFTE, calculateOccupancy } from '../lib/calculations/erlangC';
import { calculateErlangAMetrics } from '../lib/calculations/erlangA';
import { calculateErlangB, calculateRequiredLinesB } from '../lib/calculations/erlangB';
import { useCalculatorStore } from '../store/calculatorStore';
import type { CalculationInputs } from '../types';

interface ModelResults {
  modelName: string;
  requiredAgents: number;
  totalFTE: number;
  serviceLevel: number;
  asa: number;
  occupancy: number;
  abandonmentRate?: number;
  expectedAbandonments?: number;
}

export default function ModelComparison() {
  const { inputs, setInput } = useCalculatorStore();

  const results = useMemo(() => {
    const intervalSeconds = inputs.intervalMinutes * 60;
    const comparisonResults: ModelResults[] = [];

    // Erlang C
    const erlangC = calculateStaffingMetrics({
      volume: inputs.volume,
      aht: inputs.aht,
      intervalSeconds,
      targetSL: inputs.targetSLPercent / 100,
      thresholdSeconds: inputs.thresholdSeconds,
      shrinkagePercent: inputs.shrinkagePercent / 100,
      maxOccupancy: inputs.maxOccupancy / 100
    });

    comparisonResults.push({
      modelName: 'Erlang C',
      requiredAgents: erlangC.requiredAgents,
      totalFTE: erlangC.totalFTE,
      serviceLevel: erlangC.serviceLevel * 100,
      asa: erlangC.asa,
      occupancy: erlangC.occupancy * 100
    });

    // Erlang A
    const erlangA = calculateErlangAMetrics({
      volume: inputs.volume,
      aht: inputs.aht,
      intervalMinutes: inputs.intervalMinutes,
      targetSLPercent: inputs.targetSLPercent,
      thresholdSeconds: inputs.thresholdSeconds,
      shrinkagePercent: inputs.shrinkagePercent,
      maxOccupancy: inputs.maxOccupancy,
      averagePatience: inputs.averagePatience
    });

    if (erlangA) {
      const traffic = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);
      const fteA = calculateFTE(erlangA.requiredAgents, inputs.shrinkagePercent / 100);
      const occA = calculateOccupancy(traffic, erlangA.requiredAgents);

      comparisonResults.push({
        modelName: 'Erlang A',
        requiredAgents: erlangA.requiredAgents,
        totalFTE: fteA,
        serviceLevel: erlangA.serviceLevel * 100,
        asa: erlangA.asa,
        occupancy: occA * 100,
        abandonmentRate: erlangA.abandonmentProbability,
        expectedAbandonments: erlangA.expectedAbandonments
      });
    }

    // Erlang B (blocking/loss model - no queue)
    const traffic = calculateTrafficIntensity(inputs.volume, inputs.aht, intervalSeconds);
    const targetBlocking = 1 - (inputs.targetSLPercent / 100); // Convert SL target to blocking target
    const requiredLinesB = calculateRequiredLinesB(traffic, targetBlocking);
    const actualBlocking = calculateErlangB(traffic, requiredLinesB);
    const carriedTraffic = traffic * (1 - actualBlocking);
    const occupancyB = requiredLinesB > 0 ? (carriedTraffic / requiredLinesB) * 100 : 0;
    const fteB = calculateFTE(requiredLinesB, inputs.shrinkagePercent / 100);

    comparisonResults.push({
      modelName: 'Erlang B',
      requiredAgents: requiredLinesB,
      totalFTE: fteB,
      serviceLevel: (1 - actualBlocking) * 100, // Success rate
      asa: 0, // No queue in Erlang B
      occupancy: occupancyB
    });

    return comparisonResults;
  }, [inputs]);

  const handleInputChange = (key: keyof CalculationInputs, value: number) => {
    setInput(key, value);
  };

  const formatNumber = (num: number | undefined, decimals: number = 2): string => {
    if (num === undefined || num === null) return '-';
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

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Model Comparison: Erlang B vs C vs A</h2>
        <p className="text-sm text-gray-600 mb-6">
          Compare staffing requirements across the three Erlang models: B (blocking/loss),
          C (infinite patience queue), and A (queue with abandonment).
        </p>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className={labelClass}>Volume</label>
            <input
              type="number"
              value={inputs.volume}
              onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>AHT (sec)</label>
            <input
              type="number"
              value={inputs.aht}
              onChange={(e) => handleInputChange('aht', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>SL Target %</label>
            <input
              type="number"
              value={inputs.targetSLPercent}
              onChange={(e) => handleInputChange('targetSLPercent', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Threshold (sec)</label>
            <input
              type="number"
              value={inputs.thresholdSeconds}
              onChange={(e) => handleInputChange('thresholdSeconds', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Shrinkage %</label>
            <input
              type="number"
              value={inputs.shrinkagePercent}
              onChange={(e) => handleInputChange('shrinkagePercent', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max Occupancy %</label>
            <input
              type="number"
              value={inputs.maxOccupancy}
              onChange={(e) => handleInputChange('maxOccupancy', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Patience (sec)</label>
            <input
              type="number"
              value={inputs.averagePatience}
              onChange={(e) => handleInputChange('averagePatience', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Interval (min)</label>
            <select
              value={inputs.intervalMinutes}
              onChange={(e) => handleInputChange('intervalMinutes', parseFloat(e.target.value))}
              className={inputClass}
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                {results.map((result) => (
                  <th key={result.modelName} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {result.modelName}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Required Agents */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Required Agents
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 font-semibold">
                    {result.requiredAgents}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                  {results.length > 0 && formatNumber(Math.max(...results.map(r => r.requiredAgents)) - Math.min(...results.map(r => r.requiredAgents)), 0)}
                </td>
              </tr>

              {/* Total FTE */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total FTE
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 font-semibold">
                    {formatNumber(result.totalFTE, 1)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                  {results.length > 0 && formatNumber(Math.max(...results.map(r => r.totalFTE)) - Math.min(...results.map(r => r.totalFTE)), 1)}
                </td>
              </tr>

              {/* Service Level */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Service Level
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                    {formatNumber(result.serviceLevel, 1)}%
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  -
                </td>
              </tr>

              {/* ASA */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ASA
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                    {formatTime(result.asa)}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  -
                </td>
              </tr>

              {/* Occupancy */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Occupancy
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                    {formatNumber(result.occupancy, 1)}%
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  -
                </td>
              </tr>

              {/* Abandonment Rate */}
              <tr className="hover:bg-gray-50 bg-orange-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Abandonment Rate
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-semibold">
                    {result.abandonmentRate !== undefined
                      ? `${formatNumber(result.abandonmentRate * 100, 1)}%`
                      : 'N/A (assumes 0%)'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  -
                </td>
              </tr>

              {/* Expected Abandonments */}
              <tr className="hover:bg-gray-50 bg-orange-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Expected Abandonments
                </td>
                {results.map((result) => (
                  <td key={result.modelName} className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600">
                    {result.expectedAbandonments !== undefined
                      ? formatNumber(result.expectedAbandonments, 0)
                      : 'N/A'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  -
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      {results.length === 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Insights</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <strong>Erlang B (Loss):</strong> No queue - callers blocked if all lines busy.
              Best for trunk/line capacity planning. Shows {results.find(r => r.modelName === 'Erlang B')?.requiredAgents} lines needed.
            </li>
            <li>
              <strong>Erlang C (Queue):</strong> Assumes infinite patience - all callers wait.
              Tends to overestimate staffing needs. Shows {results.find(r => r.modelName === 'Erlang C')?.requiredAgents} agents needed.
            </li>
            <li>
              <strong>Erlang A (Abandonment):</strong> Most realistic - models customer patience.
              Predicts {formatNumber((results.find(r => r.modelName === 'Erlang A')?.abandonmentRate || 0) * 100, 1)}% abandonment rate.
            </li>
            <li className="mt-3 pt-3 border-t border-blue-300">
              <strong>Recommendation:</strong> Use <span className="font-bold">Erlang A</span> for contact centre staffing
              (accounts for real customer behavior). Use <span className="font-bold">Erlang B</span> for trunk/line planning.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

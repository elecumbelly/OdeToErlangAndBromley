import React from 'react';
import { useCalculatorStore } from '../store/calculatorStore';

const ResultsDisplay: React.FC = () => {
  const { results, inputs } = useCalculatorStore();

  if (!results) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Results</h2>
        <p className="text-gray-500">Enter parameters to see results...</p>
      </div>
    );
  }

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

  const getStatusColor = (value: number, target: number, isPercentage: boolean = true): string => {
    const actualValue = isPercentage ? value : value;
    const targetValue = isPercentage ? target : target;

    if (actualValue >= targetValue) return 'text-green-600';
    if (actualValue >= targetValue * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyColor = (occupancy: number): string => {
    if (occupancy > inputs.maxOccupancy) return 'text-red-600';
    if (occupancy > inputs.maxOccupancy * 0.95) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Results</h2>

      {!results.canAchieveTarget && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>⚠️ Cannot achieve target service level</strong>
            <br />
            The target {inputs.targetSLPercent}/{inputs.thresholdSeconds} cannot be achieved with reasonable staffing levels.
            Consider adjusting your service level target or reviewing your assumptions.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Required Agents */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-5 rounded-lg border border-primary-200">
          <p className="text-sm text-primary-700 font-medium mb-1">Required Agents (Productive)</p>
          <p className="text-4xl font-bold text-primary-900">
            {results.requiredAgents}
          </p>
          <p className="text-xs text-primary-600 mt-2">
            Minimum agents needed on the phones
          </p>
        </div>

        {/* Total FTE */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-1">Total FTE Required</p>
          <p className="text-4xl font-bold text-blue-900">
            {formatNumber(results.totalFTE, 1)}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Including {inputs.shrinkagePercent}% shrinkage
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>

        {/* Service Level */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Service Level</p>
            <p className="text-xs text-gray-500">Target: {inputs.targetSLPercent}%</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getStatusColor(results.serviceLevel, inputs.targetSLPercent)}`}>
              {formatNumber(results.serviceLevel, 1)}%
            </p>
            <p className="text-xs text-gray-500">
              {formatNumber(results.serviceLevel, 1)}% answered in {inputs.thresholdSeconds}s
            </p>
          </div>
        </div>

        {/* ASA */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Average Speed of Answer (ASA)</p>
            <p className="text-xs text-gray-500">Mean wait time for answered contacts</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(results.asa)}
            </p>
          </div>
        </div>

        {/* Occupancy */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Agent Occupancy</p>
            <p className="text-xs text-gray-500">Max: {inputs.maxOccupancy}%</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getOccupancyColor(results.occupancy)}`}>
              {formatNumber(results.occupancy, 1)}%
            </p>
            <p className="text-xs text-gray-500">
              Time agents spend handling contacts
            </p>
          </div>
        </div>

        {/* Traffic Intensity */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Traffic Intensity</p>
            <p className="text-xs text-gray-500">Workload in Erlangs</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(results.trafficIntensity, 2)}
            </p>
            <p className="text-xs text-gray-500">
              Erlangs
            </p>
          </div>
        </div>
      </div>

      {/* Calculation Formula Breakdown */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">📐 Calculation Breakdown</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <strong>1. Traffic Intensity:</strong> A = (Volume × AHT) / Interval
          </p>
          <p className="ml-4 text-gray-500">
            = ({inputs.volume} × {inputs.aht}s) / {inputs.intervalMinutes * 60}s = {formatNumber(results.trafficIntensity, 2)} Erlangs
          </p>
          <p className="mt-2">
            <strong>2. Erlang C Formula:</strong> Calculate minimum agents for target SL
          </p>
          <p className="ml-4 text-gray-500">
            For {inputs.targetSLPercent}/{inputs.thresholdSeconds} target = {results.requiredAgents} agents
          </p>
          <p className="mt-2">
            <strong>3. Apply Shrinkage:</strong> Total FTE = Productive / (1 - Shrinkage%)
          </p>
          <p className="ml-4 text-gray-500">
            = {results.requiredAgents} / (1 - {inputs.shrinkagePercent/100}) = {formatNumber(results.totalFTE, 1)} FTE
          </p>
        </div>
      </div>

      {/* Insights */}
      {results.canAchieveTarget && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            {results.occupancy < inputs.maxOccupancy * 0.7 && (
              <li>• Occupancy is low ({formatNumber(results.occupancy, 1)}%) - agents may have idle time</li>
            )}
            {results.occupancy > inputs.maxOccupancy * 0.95 && (
              <li>• Occupancy is near maximum - agents will be very busy</li>
            )}
            {results.serviceLevel > inputs.targetSLPercent * 1.1 && (
              <li>• Service level exceeds target by {formatNumber(results.serviceLevel - inputs.targetSLPercent, 1)}% - consider reducing staffing</li>
            )}
            {results.asa < inputs.thresholdSeconds / 2 && (
              <li>• Excellent ASA ({formatTime(results.asa)}) - customers wait very little</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;

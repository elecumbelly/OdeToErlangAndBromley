/**
 * HistoricalAnalysis Component
 *
 * Displays analysis of imported historical data including:
 * - Volume trends and patterns
 * - Day-of-week analysis
 * - Monthly seasonality
 * - Statistical summaries
 * - Volume forecasting with multiple algorithms
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from './ui/Toast';
import {
  getHistoricalData,
  getHistoricalDateRange,
  type HistoricalData
} from '../lib/database/dataAccess';
import {
  analyzeHistoricalData,
  type HistoricalInsights,
  type TrendAnalysis
} from '../lib/forecasting/historicalAnalysis';
import {
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  forecastWithRegression,
  autoSelectMethod,
  type ForecastResult
} from '../lib/forecasting/advancedForecasting';
import { useDatabaseStore } from '../store/databaseStore';

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function TrendBadge({ trend }: { trend: TrendAnalysis }) {
  const colors = {
    increasing: 'text-green bg-green/10 border-green/30',
    decreasing: 'text-red bg-red/10 border-red/30',
    stable: 'text-text-secondary bg-bg-elevated border-border-subtle'
  };

  const arrows = {
    increasing: '\u2191',
    decreasing: '\u2193',
    stable: '\u2194'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${colors[trend.direction]}`}>
      <span>{arrows[trend.direction]}</span>
      <span>{trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}</span>
      <span>({trend.percentChange > 0 ? '+' : ''}{trend.percentChange.toFixed(1)}%)</span>
    </span>
  );
}

function StatCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
      <div className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</div>
      <div className="text-lg font-semibold text-text-primary">{value}</div>
      {subValue && <div className="text-xs text-text-secondary mt-0.5">{subValue}</div>}
    </div>
  );
}

function DayOfWeekChart({ patterns }: { patterns: HistoricalInsights['dayOfWeekPatterns'] }) {
  const maxVolume = Math.max(...patterns.map(p => p.avgVolume));

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-text-primary">Day of Week Patterns</h4>
      <div className="grid grid-cols-7 gap-1">
        {patterns.map(p => (
          <div key={p.dayOfWeek} className="text-center">
            <div className="text-2xs text-text-muted mb-1">{p.dayName.slice(0, 3)}</div>
            <div
              className="bg-cyan/20 border border-cyan/30 rounded-sm mx-auto w-full"
              style={{ height: `${(p.avgVolume / maxVolume) * 60 + 10}px` }}
              title={`${Math.round(p.avgVolume).toLocaleString()} avg volume`}
            />
            <div className="text-2xs text-text-secondary mt-1">
              {p.avgVolume > 1000 ? `${(p.avgVolume / 1000).toFixed(1)}k` : Math.round(p.avgVolume)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyChart({ patterns }: { patterns: HistoricalInsights['monthlyPatterns'] }) {
  const validPatterns = patterns.filter(p => p.sampleSize > 0);
  if (validPatterns.length === 0) {
    return (
      <div className="text-sm text-text-muted">
        Not enough data for monthly analysis
      </div>
    );
  }

  const maxVolume = Math.max(...validPatterns.map(p => p.avgVolume));

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-text-primary">Monthly Patterns</h4>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {patterns.map(p => (
          <div key={p.month} className="text-center flex-shrink-0 w-12">
            <div className="text-2xs text-text-muted mb-1">{p.monthName.slice(0, 3)}</div>
            {p.sampleSize > 0 ? (
              <>
                <div
                  className="bg-purple/20 border border-purple/30 rounded-sm mx-auto"
                  style={{
                    height: `${(p.avgVolume / maxVolume) * 50 + 10}px`,
                    width: '24px'
                  }}
                  title={`${Math.round(p.avgVolume).toLocaleString()} avg volume (${p.sampleSize} days)`}
                />
                <div className="text-2xs text-text-secondary mt-1">
                  {p.avgVolume > 1000 ? `${(p.avgVolume / 1000).toFixed(1)}k` : Math.round(p.avgVolume)}
                </div>
              </>
            ) : (
              <div className="h-[60px] flex items-center justify-center text-2xs text-text-muted">
                --
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastDisplay({ forecast }: { forecast: ForecastResult }) {
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-primary">{forecast.method}</h4>
        {forecast.accuracy && (
          <div className="text-xs text-text-muted">
            MAPE: {forecast.accuracy.mape.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        {forecast.forecasts.slice(0, 7).map(point => (
          <div key={point.date} className="flex items-center gap-3 text-sm">
            <span className="text-text-secondary w-24">{point.date}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="bg-cyan/20 rounded h-4" style={{ width: `${Math.min(100, point.value / 10)}%` }} />
              <span className="text-text-primary font-medium">{point.value.toLocaleString()}</span>
            </div>
            {point.lower !== undefined && point.upper !== undefined && (
              <span className="text-xs text-text-muted">
                [{point.lower.toLocaleString()} - {point.upper.toLocaleString()}]
              </span>
            )}
          </div>
        ))}
      </div>

      {forecast.forecasts.length > 7 && (
        <div className="text-xs text-text-muted mt-2">
          +{forecast.forecasts.length - 7} more days...
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HistoricalAnalysis() {
  const { addToast } = useToast();
  const campaigns = useDatabaseStore(state => state.campaigns);
  const refreshCampaigns = useDatabaseStore(state => state.refreshCampaigns);

  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'forecast'>('analysis');
  const [forecastDays, setForecastDays] = useState(14);

  // Fetch campaigns on mount
  useEffect(() => {
    refreshCampaigns();
  }, [refreshCampaigns]);

  // Check for data availability when campaign changes
  useEffect(() => {
    if (selectedCampaign === null && campaigns.length > 0) {
      return;
    }

    const range = getHistoricalDateRange(selectedCampaign);
    if (range.minDate && range.maxDate) {
      setDateRange({ start: range.minDate, end: range.maxDate });
    } else {
      setDateRange(null);
    }
  }, [selectedCampaign, campaigns]);

  // Load historical data
  const loadData = () => {
    if (!dateRange) return;

    setLoading(true);
    try {
      const data = getHistoricalData(selectedCampaign, dateRange.start, dateRange.end);
      setHistoricalData(data);
      if (data.length === 0) {
        addToast('No historical data found for selected range', 'info');
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
      addToast('Failed to load historical data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Analyze data
  const insights = useMemo(() => {
    if (historicalData.length === 0) return null;
    return analyzeHistoricalData(historicalData);
  }, [historicalData]);

  // Generate forecasts
  const forecasts = useMemo(() => {
    if (!insights || insights.dailyAggregates.length < 7) return null;

    const values = insights.dailyAggregates.map(d => d.totalVolume);
    const dates = insights.dailyAggregates.map(d => d.date);

    const recommended = autoSelectMethod(values);

    const results: ForecastResult[] = [];

    // Add recommended method first
    switch (recommended) {
      case 'wma':
        results.push(forecastWithMovingAverage(values, dates, forecastDays, 7, true));
        break;
      case 'sma':
        results.push(forecastWithMovingAverage(values, dates, forecastDays, 7, false));
        break;
      case 'des':
        results.push(forecastWithExponentialSmoothing(values, dates, forecastDays, 7, 'double'));
        break;
      case 'tes':
        results.push(forecastWithExponentialSmoothing(values, dates, forecastDays, 7, 'triple'));
        break;
      case 'regression':
        results.push(forecastWithRegression(values, dates, forecastDays));
        break;
      default:
        results.push(forecastWithMovingAverage(values, dates, forecastDays, 7, true));
    }

    // Add comparison methods
    if (recommended !== 'regression') {
      results.push(forecastWithRegression(values, dates, forecastDays));
    }
    if (recommended !== 'des') {
      results.push(forecastWithExponentialSmoothing(values, dates, forecastDays, 7, 'double'));
    }

    return results;
  }, [insights, forecastDays]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Historical Analysis</h2>
          <p className="text-sm text-text-secondary mt-1">
            Analyze imported data and generate volume forecasts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCampaign ?? ''}
            onChange={e => setSelectedCampaign(e.target.value ? Number(e.target.value) : null)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.campaign_name}</option>
            ))}
          </select>

          <button
            onClick={loadData}
            disabled={!dateRange || loading}
            className="px-4 py-2 bg-cyan text-bg-base rounded-lg text-sm font-medium hover:bg-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>
      </div>

      {/* Date Range Info */}
      {dateRange && (
        <div className="text-sm text-text-secondary">
          Data available: {dateRange.start} to {dateRange.end}
        </div>
      )}

      {!dateRange && (
        <div className="bg-bg-surface border border-border-muted rounded-lg p-8 text-center">
          <div className="text-text-muted mb-2">No historical data imported yet</div>
          <div className="text-sm text-text-secondary">
            Use the Import tab to upload historical data CSV files
          </div>
        </div>
      )}

      {/* Tabs */}
      {insights && (
        <>
          <div className="flex gap-2 border-b border-border-muted">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'analysis'
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'forecast'
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Forecast
            </button>
          </div>

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Records"
                  value={insights.totalRecords.toLocaleString()}
                  subValue={`${insights.dailyAggregates.length} days`}
                />
                <StatCard
                  label="Avg Daily Volume"
                  value={Math.round(insights.volumeStats.mean).toLocaleString()}
                  subValue={`Median: ${Math.round(insights.volumeStats.median).toLocaleString()}`}
                />
                <StatCard
                  label="Avg AHT"
                  value={`${Math.round(insights.ahtStats.mean)}s`}
                  subValue={`${(insights.ahtStats.mean / 60).toFixed(1)} min`}
                />
                <StatCard
                  label="Avg SLA"
                  value={`${(insights.slaStats.mean * 100).toFixed(1)}%`}
                  subValue={`P90: ${(insights.slaStats.p90 * 100).toFixed(1)}%`}
                />
              </div>

              {/* Trends */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-bg-surface border border-border-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-text-primary">Volume Trend</h4>
                    <TrendBadge trend={insights.volumeTrend} />
                  </div>
                  <div className="text-sm text-text-secondary">
                    R-squared: {(insights.volumeTrend.rSquared * 100).toFixed(1)}% fit
                  </div>
                </div>

                <div className="bg-bg-surface border border-border-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-text-primary">AHT Trend</h4>
                    <TrendBadge trend={insights.ahtTrend} />
                  </div>
                  <div className="text-sm text-text-secondary">
                    R-squared: {(insights.ahtTrend.rSquared * 100).toFixed(1)}% fit
                  </div>
                </div>
              </div>

              {/* Patterns */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-bg-surface border border-border-muted rounded-lg p-4">
                  <DayOfWeekChart patterns={insights.dayOfWeekPatterns} />
                </div>

                <div className="bg-bg-surface border border-border-muted rounded-lg p-4">
                  <MonthlyChart patterns={insights.monthlyPatterns} />
                </div>
              </div>

              {/* Statistical Summary */}
              <div className="bg-bg-surface border border-border-muted rounded-lg p-4">
                <h4 className="text-sm font-medium text-text-primary mb-3">Volume Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-text-muted">Min</div>
                    <div className="font-medium">{Math.round(insights.volumeStats.min).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">P25</div>
                    <div className="font-medium">{Math.round(insights.volumeStats.p25).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">P50 (Median)</div>
                    <div className="font-medium">{Math.round(insights.volumeStats.median).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">P75</div>
                    <div className="font-medium">{Math.round(insights.volumeStats.p75).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">Max</div>
                    <div className="font-medium">{Math.round(insights.volumeStats.max).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forecast' && forecasts && (
            <div className="space-y-6">
              {/* Forecast Settings */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-text-secondary">Forecast Horizon:</label>
                <select
                  value={forecastDays}
                  onChange={e => setForecastDays(Number(e.target.value))}
                  className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              {/* Forecasts */}
              <div className="space-y-4">
                {forecasts.map((forecast, i) => (
                  <ForecastDisplay key={i} forecast={forecast} />
                ))}
              </div>

              {/* Legend */}
              <div className="bg-bg-surface border border-border-muted rounded-lg p-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">Forecast Methods</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li><strong>Moving Average</strong> - Smooths recent data, good for stable patterns</li>
                  <li><strong>Exponential Smoothing</strong> - Weights recent data more, adapts to changes</li>
                  <li><strong>Linear Regression</strong> - Projects trend line, best for clear trends</li>
                  <li><strong>Holt-Winters</strong> - Captures trend + seasonality</li>
                </ul>
                <p className="text-xs text-text-muted mt-3">
                  MAPE = Mean Absolute Percentage Error. Lower is better.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
  type HistoricalInsights
} from '../lib/forecasting/historicalAnalysis';
import {
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  forecastWithRegression,
  autoSelectMethod,
  type ForecastResult
} from '../lib/forecasting/advancedForecasting';
import { useDatabaseStore } from '../store/databaseStore';
import { MetricCard } from './ui/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';

// ============================================================================
// HELPERS
// ============================================================================

const CHART_THEME = {
  bg: 'transparent',
  grid: 'rgba(255,255,255,0.1)',
  text: '#94a3b8',
  tooltipBg: '#0f172a',
  tooltipBorder: '#1e293b',
  colors: {
    cyan: '#06b6d4',
    purple: '#a855f7',
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 shadow-xl">
        <p className="text-sm font-semibold text-text-primary mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HistoricalAnalysis() {
  const { addToast } = useToast();
  const campaigns = useDatabaseStore(state => state.campaigns);
  const refreshCampaigns = useDatabaseStore(state => state.refreshCampaigns);

  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [dbDateRange, setDbDateRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeFilter, setRangeFilter] = useState<number>(30); // Days to look back, 0 = All
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
    if (selectedCampaign === null) return;

    const range = getHistoricalDateRange(selectedCampaign);
    if (range.minDate && range.maxDate) {
      setDbDateRange({ start: range.minDate, end: range.maxDate });
      
      // Auto-load data based on filter
      loadData(selectedCampaign, range.minDate, range.maxDate, rangeFilter);
    } else {
      setDbDateRange(null);
      setHistoricalData([]);
    }
  }, [selectedCampaign, rangeFilter]);

  // Load historical data
  const loadData = (campaignId: number, minDate: string, maxDate: string, filterDays: number) => {
    setLoading(true);
    try {
      let start = minDate;
      const end = maxDate;

      if (filterDays > 0) {
        const endDate = new Date(maxDate);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - filterDays);
        const isoStart = startDate.toISOString().split('T')[0];
        // Ensure we don't go before available data
        start = isoStart > minDate ? isoStart : minDate;
      }

      setDateRange({ start, end });
      const data = getHistoricalData(campaignId, start, end);
      setHistoricalData(data);
      
      if (data.length === 0) {
        // Only toast if it's a manual action or unexpected empty state
        // addToast('No data found for this range', 'info'); 
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

    // Add methods based on suitability
    results.push(forecastWithMovingAverage(values, dates, forecastDays, 7, true));
    if (recommended !== 'wma') {
      if (recommended === 'regression') results.unshift(forecastWithRegression(values, dates, forecastDays));
      else results.push(forecastWithRegression(values, dates, forecastDays));
    }
    
    // Add Exponential Smoothing if enough data
    if (values.length > 14) {
      results.push(forecastWithExponentialSmoothing(values, dates, forecastDays, 7, 'double'));
    }

    return results;
  }, [insights, forecastDays]);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setSelectedCampaign(val);
  };

  if (campaigns.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted bg-bg-surface border border-border-muted rounded-xl">
        No campaigns available. Please create a campaign first.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="relative overflow-hidden rounded-xl border border-border-subtle/30 bg-gradient-to-b from-bg-surface to-bg-base p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">Historical Analysis</h2>
            <p className="text-sm text-text-secondary mt-1">
              {dbDateRange 
                ? `Analyzing ${historicalData.length} records from ${dbDateRange.start} to ${dbDateRange.end}`
                : 'Select a campaign to begin analysis'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-semibold text-text-secondary uppercase tracking-widest">Campaign</label>
              <select
                value={selectedCampaign ?? ''}
                onChange={handleCampaignChange}
                className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-cyan/20 focus:border-cyan outline-none min-w-[200px]"
              >
                <option value="">Select Campaign...</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.campaign_name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-2xs font-semibold text-text-secondary uppercase tracking-widest">Range</label>
              <select
                value={rangeFilter}
                onChange={e => setRangeFilter(Number(e.target.value))}
                disabled={!selectedCampaign}
                className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-cyan/20 focus:border-cyan outline-none"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={0}>All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {insights && (
          <div className="flex gap-2 mt-6 border-b border-border-muted/30">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'analysis'
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Trends & Patterns
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'forecast'
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Volume Forecasting
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center text-text-muted animate-pulse">
          Loading analysis data...
        </div>
      )}

      {!selectedCampaign && !loading && (
        <div className="p-12 text-center border-2 border-dashed border-border-muted rounded-xl bg-bg-surface/30">
          <p className="text-text-secondary font-medium">No campaign selected</p>
          <p className="text-sm text-text-muted mt-2">Choose a campaign above to view historical insights</p>
        </div>
      )}

      {selectedCampaign && !loading && historicalData.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-border-muted rounded-xl bg-bg-surface/30">
          <p className="text-text-secondary font-medium">No data found</p>
          <p className="text-sm text-text-muted mt-2">Try adjusting the date range or import new data</p>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      {insights && !loading && activeTab === 'analysis' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Level Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Volume"
              value={insights.totalRecords}
              unit="calls"
              decimals={0}
              status="info"
              glow
            />
            <MetricCard
              label="Avg Daily Volume"
              value={insights.volumeStats.mean}
              decimals={0}
              trend={insights.volumeTrend.direction === 'increasing' ? 'up' : insights.volumeTrend.direction === 'decreasing' ? 'down' : 'neutral'}
              description={`Trending ${insights.volumeTrend.direction}`}
            />
            <MetricCard
              label="Avg AHT"
              value={insights.ahtStats.mean}
              unit="sec"
              decimals={0}
              status="neutral"
            />
            <MetricCard
              label="Avg Service Level"
              value={insights.slaStats.mean * 100}
              unit="%"
              decimals={1}
              status={insights.slaStats.mean >= 0.8 ? 'success' : 'warning'}
            />
          </div>

          {/* Volume Trend Chart */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4">Volume History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.dailyAggregates}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_THEME.colors.cyan} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_THEME.colors.cyan} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke={CHART_THEME.text} 
                    fontSize={11} 
                    tickFormatter={(val) => val.slice(5)} // Show MM-DD
                  />
                  <YAxis stroke={CHART_THEME.text} fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="totalVolume" 
                    name="Volume"
                    stroke={CHART_THEME.colors.cyan} 
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Day of Week Pattern */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-text-primary mb-4">Weekly Volume Pattern</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.dayOfWeekPatterns}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis dataKey="dayName" stroke={CHART_THEME.text} fontSize={11} tickFormatter={(val) => val.slice(0, 3)} />
                    <YAxis stroke={CHART_THEME.text} fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgVolume" name="Avg Volume" fill={CHART_THEME.colors.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AHT Trend */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-text-primary mb-4">AHT Distribution (Daily)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={insights.dailyAggregates}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={CHART_THEME.text} fontSize={11} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke={CHART_THEME.text} fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="avgAht" name="AHT (s)" stroke={CHART_THEME.colors.amber} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORECAST CONTENT */}
      {insights && !loading && activeTab === 'forecast' && forecasts && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface border border-border-subtle rounded-xl p-4">
            <h3 className="text-base font-bold text-text-primary">Forecast Comparison</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-text-secondary">Horizon:</label>
              <select
                value={forecastDays}
                onChange={e => setForecastDays(Number(e.target.value))}
                className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-cyan"
              >
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
              </select>
            </div>
          </div>

          {forecasts.map((forecast, index) => (
            <div key={index} className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-text-primary">{forecast.method}</h4>
                  <p className="text-xs text-text-muted mt-1">
                    MAPE: <span className={forecast.accuracy.mape < 10 ? 'text-green' : 'text-amber'}>{forecast.accuracy.mape.toFixed(1)}%</span>
                  </p>
                </div>
                {index === 0 && (
                  <span className="text-xs font-bold text-cyan bg-cyan/10 border border-cyan/30 rounded px-2 py-1 uppercase tracking-wide">
                    Recommended
                  </span>
                )}
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast.forecasts}>
                    <defs>
                      <linearGradient id={`colorForecast${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={index === 0 ? CHART_THEME.colors.green : CHART_THEME.colors.cyan} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={index === 0 ? CHART_THEME.colors.green : CHART_THEME.colors.cyan} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={CHART_THEME.text} fontSize={11} tickFormatter={(val) => val.slice(5)} />
                    <YAxis stroke={CHART_THEME.text} fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="Forecast Volume" 
                      stroke={index === 0 ? CHART_THEME.colors.green : CHART_THEME.colors.cyan} 
                      fill={`url(#colorForecast${index})`} 
                    />
                    {forecast.forecasts[0].lower !== undefined && (
                      <Area 
                        type="monotone" 
                        dataKey="lower" 
                        stackId="1" 
                        stroke="none" 
                        fill="transparent" 
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

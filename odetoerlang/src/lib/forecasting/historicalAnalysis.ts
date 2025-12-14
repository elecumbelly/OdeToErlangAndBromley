/**
 * Historical Data Analysis Module
 *
 * Provides statistical analysis of historical contact center data:
 * - Trend analysis (volume patterns over time)
 * - Seasonality detection (day-of-week, monthly patterns)
 * - Variance and percentile calculations
 * - Performance metrics aggregation
 */

import type { HistoricalData } from '../database/dataAccess';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyAggregate {
  date: string;
  totalVolume: number;
  avgAht: number;
  avgSla: number;
  avgAsa: number;
  totalAbandons: number;
  abandonRate: number;
  recordCount: number;
}

export interface DayOfWeekPattern {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  avgVolume: number;
  avgAht: number;
  avgSla: number;
  sampleSize: number;
}

export interface MonthlyPattern {
  month: number; // 1-12
  monthName: string;
  avgVolume: number;
  avgAht: number;
  avgSla: number;
  sampleSize: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  startValue: number;
  endValue: number;
  rSquared: number; // Goodness of fit
  slope: number;
  intercept: number;
}

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface HistoricalInsights {
  dateRange: { start: string; end: string };
  totalRecords: number;
  dailyAggregates: DailyAggregate[];
  volumeTrend: TrendAnalysis;
  ahtTrend: TrendAnalysis;
  dayOfWeekPatterns: DayOfWeekPattern[];
  monthlyPatterns: MonthlyPattern[];
  volumeStats: StatisticalSummary;
  ahtStats: StatisticalSummary;
  slaStats: StatisticalSummary;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Calculate basic statistics for an array of numbers
 */
export function calculateStats(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return {
      count: 0, mean: 0, median: 0, stdDev: 0,
      min: 0, max: 0, p25: 0, p75: 0, p90: 0, p95: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Standard deviation
  const squaredDiffs = sorted.map(v => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Percentile helper
  const percentile = (p: number): number => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - idx) + sorted[upper] * (idx - lower);
  };

  return {
    count: n,
    mean,
    median: percentile(50),
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
    p25: percentile(25),
    p75: percentile(75),
    p90: percentile(90),
    p95: percentile(95)
  };
}

/**
 * Linear regression using least squares
 */
export function linearRegression(xValues: number[], yValues: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = xValues.length;
  if (n < 2) return { slope: 0, intercept: yValues[0] || 0, rSquared: 0 };

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
  const sumXX = xValues.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared calculation
  const yMean = sumY / n;
  const ssTot = yValues.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const ssRes = yValues.reduce((acc, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return acc + (y - predicted) ** 2;
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared: Math.max(0, Math.min(1, rSquared)) };
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Aggregate historical data by day
 */
export function aggregateByDay(data: HistoricalData[]): DailyAggregate[] {
  const byDate = new Map<string, HistoricalData[]>();

  data.forEach(record => {
    const existing = byDate.get(record.date) || [];
    existing.push(record);
    byDate.set(record.date, existing);
  });

  const aggregates: DailyAggregate[] = [];

  byDate.forEach((records, date) => {
    const totalVolume = records.reduce((sum, r) => sum + r.volume, 0);
    const totalAbandons = records.reduce((sum, r) => sum + (r.abandons || 0), 0);

    const ahtValues = records.filter(r => r.aht !== undefined).map(r => r.aht!);
    const slaValues = records.filter(r => r.sla_achieved !== undefined).map(r => r.sla_achieved!);
    const asaValues = records.filter(r => r.asa !== undefined).map(r => r.asa!);

    aggregates.push({
      date,
      totalVolume,
      avgAht: ahtValues.length > 0 ? ahtValues.reduce((a, b) => a + b, 0) / ahtValues.length : 0,
      avgSla: slaValues.length > 0 ? slaValues.reduce((a, b) => a + b, 0) / slaValues.length : 0,
      avgAsa: asaValues.length > 0 ? asaValues.reduce((a, b) => a + b, 0) / asaValues.length : 0,
      totalAbandons,
      abandonRate: totalVolume > 0 ? totalAbandons / totalVolume : 0,
      recordCount: records.length
    });
  });

  return aggregates.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Analyze day-of-week patterns
 */
export function analyzeDayOfWeek(dailyAggregates: DailyAggregate[]): DayOfWeekPattern[] {
  const byDayOfWeek = new Map<number, DailyAggregate[]>();

  dailyAggregates.forEach(agg => {
    const dow = new Date(agg.date).getDay();
    const existing = byDayOfWeek.get(dow) || [];
    existing.push(agg);
    byDayOfWeek.set(dow, existing);
  });

  const patterns: DayOfWeekPattern[] = [];

  for (let dow = 0; dow < 7; dow++) {
    const records = byDayOfWeek.get(dow) || [];
    if (records.length === 0) {
      patterns.push({
        dayOfWeek: dow,
        dayName: DAY_NAMES[dow],
        avgVolume: 0,
        avgAht: 0,
        avgSla: 0,
        sampleSize: 0
      });
      continue;
    }

    patterns.push({
      dayOfWeek: dow,
      dayName: DAY_NAMES[dow],
      avgVolume: records.reduce((sum, r) => sum + r.totalVolume, 0) / records.length,
      avgAht: records.reduce((sum, r) => sum + r.avgAht, 0) / records.length,
      avgSla: records.reduce((sum, r) => sum + r.avgSla, 0) / records.length,
      sampleSize: records.length
    });
  }

  return patterns;
}

/**
 * Analyze monthly patterns
 */
export function analyzeMonthly(dailyAggregates: DailyAggregate[]): MonthlyPattern[] {
  const byMonth = new Map<number, DailyAggregate[]>();

  dailyAggregates.forEach(agg => {
    const month = new Date(agg.date).getMonth() + 1;
    const existing = byMonth.get(month) || [];
    existing.push(agg);
    byMonth.set(month, existing);
  });

  const patterns: MonthlyPattern[] = [];

  for (let month = 1; month <= 12; month++) {
    const records = byMonth.get(month) || [];
    if (records.length === 0) {
      patterns.push({
        month,
        monthName: MONTH_NAMES[month - 1],
        avgVolume: 0,
        avgAht: 0,
        avgSla: 0,
        sampleSize: 0
      });
      continue;
    }

    patterns.push({
      month,
      monthName: MONTH_NAMES[month - 1],
      avgVolume: records.reduce((sum, r) => sum + r.totalVolume, 0) / records.length,
      avgAht: records.reduce((sum, r) => sum + r.avgAht, 0) / records.length,
      avgSla: records.reduce((sum, r) => sum + r.avgSla, 0) / records.length,
      sampleSize: records.length
    });
  }

  return patterns;
}

/**
 * Analyze trend direction and strength
 */
export function analyzeTrend(values: number[]): TrendAnalysis {
  if (values.length < 2) {
    return {
      direction: 'stable',
      percentChange: 0,
      startValue: values[0] || 0,
      endValue: values[0] || 0,
      rSquared: 0,
      slope: 0,
      intercept: values[0] || 0
    };
  }

  const xValues = values.map((_, i) => i);
  const { slope, intercept, rSquared } = linearRegression(xValues, values);

  const startValue = values[0];
  const endValue = values[values.length - 1];
  const percentChange = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  // Determine direction based on slope significance
  const threshold = 0.01; // 1% of mean as significance threshold
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const significantSlope = Math.abs(slope) > mean * threshold;

  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (significantSlope && rSquared > 0.3) {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  }

  return {
    direction,
    percentChange,
    startValue,
    endValue,
    rSquared,
    slope,
    intercept
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Generate comprehensive insights from historical data
 */
export function analyzeHistoricalData(data: HistoricalData[]): HistoricalInsights | null {
  if (data.length === 0) {
    return null;
  }

  // Sort by date
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  // Date range
  const dateRange = {
    start: sorted[0].date,
    end: sorted[sorted.length - 1].date
  };

  // Daily aggregates
  const dailyAggregates = aggregateByDay(sorted);

  // Extract time series for trends
  const dailyVolumes = dailyAggregates.map(d => d.totalVolume);
  const dailyAhts = dailyAggregates.filter(d => d.avgAht > 0).map(d => d.avgAht);

  // Volume statistics
  const volumeStats = calculateStats(sorted.map(r => r.volume));

  // AHT statistics (only where defined)
  const ahtValues = sorted.filter(r => r.aht !== undefined).map(r => r.aht!);
  const ahtStats = calculateStats(ahtValues);

  // SLA statistics (only where defined)
  const slaValues = sorted.filter(r => r.sla_achieved !== undefined).map(r => r.sla_achieved!);
  const slaStats = calculateStats(slaValues);

  return {
    dateRange,
    totalRecords: data.length,
    dailyAggregates,
    volumeTrend: analyzeTrend(dailyVolumes),
    ahtTrend: analyzeTrend(dailyAhts),
    dayOfWeekPatterns: analyzeDayOfWeek(dailyAggregates),
    monthlyPatterns: analyzeMonthly(dailyAggregates),
    volumeStats,
    ahtStats,
    slaStats
  };
}

/**
 * Get volume forecast using historical patterns
 */
export function getForecastFromPatterns(
  insights: HistoricalInsights,
  targetDate: string,
  applyTrend: boolean = true
): number {
  const target = new Date(targetDate);
  const dow = target.getDay();
  const month = target.getMonth() + 1;

  // Get base volume from day-of-week pattern
  const dowPattern = insights.dayOfWeekPatterns.find(p => p.dayOfWeek === dow);
  let baseVolume = dowPattern?.avgVolume || insights.volumeStats.mean;

  // Apply monthly adjustment
  const monthlyPattern = insights.monthlyPatterns.find(p => p.month === month);
  const overallMonthlyAvg = insights.monthlyPatterns
    .filter(p => p.sampleSize > 0)
    .reduce((sum, p) => sum + p.avgVolume, 0) /
    insights.monthlyPatterns.filter(p => p.sampleSize > 0).length;

  if (monthlyPattern && monthlyPattern.sampleSize > 0 && overallMonthlyAvg > 0) {
    const monthlyFactor = monthlyPattern.avgVolume / overallMonthlyAvg;
    baseVolume *= monthlyFactor;
  }

  // Apply trend adjustment if requested
  if (applyTrend && insights.volumeTrend.rSquared > 0.5) {
    // Calculate days from start of data
    const startDate = new Date(insights.dateRange.start);
    const daysSinceStart = Math.floor((target.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trendAdjustment = 1 + (insights.volumeTrend.percentChange / 100) *
      (daysSinceStart / insights.dailyAggregates.length);
    baseVolume *= trendAdjustment;
  }

  return Math.round(baseVolume);
}

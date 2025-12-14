/**
 * Advanced Forecasting Algorithms
 *
 * Implements time-series forecasting methods for contact center volume prediction:
 * - Simple Moving Average (SMA)
 * - Weighted Moving Average (WMA)
 * - Exponential Smoothing (Single, Double, Triple/Holt-Winters)
 * - Seasonal decomposition
 * - Linear regression with trend
 */

import { linearRegression, calculateStats } from './historicalAnalysis';

// ============================================================================
// TYPES
// ============================================================================

export interface ForecastPoint {
  date: string;
  value: number;
  lower?: number; // Confidence interval lower bound
  upper?: number; // Confidence interval upper bound
}

export interface ForecastResult {
  method: string;
  forecasts: ForecastPoint[];
  accuracy?: {
    mae: number;  // Mean Absolute Error
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  };
  parameters: Record<string, number>;
}

export interface SeasonalDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  seasonalIndices: number[]; // For each period in the cycle
}

// ============================================================================
// MOVING AVERAGE METHODS
// ============================================================================

/**
 * Simple Moving Average (SMA)
 * Best for: Smoothing out noise, short-term forecasts
 */
export function simpleMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  if (values.length < windowSize) {
    return values.map(() => values.reduce((a, b) => a + b, 0) / values.length);
  }

  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      // Not enough data yet, use available average
      const slice = values.slice(0, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    } else {
      const slice = values.slice(i - windowSize + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / windowSize);
    }
  }
  return result;
}

/**
 * Weighted Moving Average (WMA)
 * More recent values get higher weights
 */
export function weightedMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  if (values.length < windowSize) {
    return simpleMovingAverage(values, values.length);
  }

  // Generate linearly increasing weights
  const weights: number[] = [];
  for (let i = 1; i <= windowSize; i++) {
    weights.push(i);
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      const slice = values.slice(0, i + 1);
      const w = weights.slice(windowSize - i - 1);
      const ws = w.reduce((a, b) => a + b, 0);
      const weighted = slice.reduce((sum, v, j) => sum + v * w[j], 0);
      result.push(weighted / ws);
    } else {
      const slice = values.slice(i - windowSize + 1, i + 1);
      const weighted = slice.reduce((sum, v, j) => sum + v * weights[j], 0);
      result.push(weighted / weightSum);
    }
  }
  return result;
}

// ============================================================================
// EXPONENTIAL SMOOTHING
// ============================================================================

/**
 * Simple Exponential Smoothing (SES)
 * Best for: Data without trend or seasonality
 * @param alpha Smoothing factor (0-1), higher = more weight on recent values
 */
export function simpleExponentialSmoothing(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];

  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    const smoothed = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }
  return result;
}

/**
 * Double Exponential Smoothing (Holt's Linear Trend)
 * Best for: Data with trend but no seasonality
 * @param alpha Level smoothing (0-1)
 * @param beta Trend smoothing (0-1)
 */
export function doubleExponentialSmoothing(
  values: number[],
  alpha: number = 0.3,
  beta: number = 0.1
): { level: number[]; trend: number[]; fitted: number[] } {
  if (values.length < 2) {
    return {
      level: [...values],
      trend: values.map(() => 0),
      fitted: [...values]
    };
  }

  // Initialize
  const level: number[] = [values[0]];
  const trend: number[] = [values[1] - values[0]];
  const fitted: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const prevLevel = level[i - 1];
    const prevTrend = trend[i - 1];

    // Update level
    const newLevel = alpha * values[i] + (1 - alpha) * (prevLevel + prevTrend);
    level.push(newLevel);

    // Update trend
    const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;
    trend.push(newTrend);

    // Fitted value
    fitted.push(newLevel + newTrend);
  }

  return { level, trend, fitted };
}

/**
 * Triple Exponential Smoothing (Holt-Winters)
 * Best for: Data with both trend and seasonality
 * @param alpha Level smoothing (0-1)
 * @param beta Trend smoothing (0-1)
 * @param gamma Seasonal smoothing (0-1)
 * @param seasonLength Period length (e.g., 7 for weekly, 12 for monthly)
 * @param additive Use additive (true) or multiplicative (false) seasonality
 */
export function tripleExponentialSmoothing(
  values: number[],
  seasonLength: number,
  alpha: number = 0.3,
  beta: number = 0.1,
  gamma: number = 0.1,
  additive: boolean = true
): { level: number[]; trend: number[]; seasonal: number[]; fitted: number[] } {
  if (values.length < seasonLength * 2) {
    // Not enough data for seasonal model, fall back to double ES
    const des = doubleExponentialSmoothing(values, alpha, beta);
    return {
      ...des,
      seasonal: values.map(() => additive ? 0 : 1)
    };
  }

  // Initialize seasonal indices from first season
  const firstSeasonAvg = values.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;
  const initialSeasonal: number[] = [];
  for (let i = 0; i < seasonLength; i++) {
    if (additive) {
      initialSeasonal.push(values[i] - firstSeasonAvg);
    } else {
      initialSeasonal.push(values[i] / firstSeasonAvg);
    }
  }

  // Initialize level and trend
  const level: number[] = [firstSeasonAvg];
  const trend: number[] = [(values[seasonLength] - values[0]) / seasonLength];
  const seasonal: number[] = [...initialSeasonal];
  const fitted: number[] = [];

  // First season uses initial values
  for (let i = 0; i < seasonLength; i++) {
    if (additive) {
      fitted.push(level[0] + trend[0] * i + seasonal[i]);
    } else {
      fitted.push((level[0] + trend[0] * i) * seasonal[i]);
    }
  }

  // Process remaining values
  for (let i = seasonLength; i < values.length; i++) {
    const prevLevel = level[level.length - 1];
    const prevTrend = trend[trend.length - 1];
    const seasonIdx = i % seasonLength;
    const prevSeasonal = seasonal[seasonal.length - seasonLength + seasonIdx] ||
                         initialSeasonal[seasonIdx];

    let newLevel: number;
    let newSeasonal: number;

    if (additive) {
      newLevel = alpha * (values[i] - prevSeasonal) + (1 - alpha) * (prevLevel + prevTrend);
      newSeasonal = gamma * (values[i] - newLevel) + (1 - gamma) * prevSeasonal;
    } else {
      newLevel = alpha * (values[i] / prevSeasonal) + (1 - alpha) * (prevLevel + prevTrend);
      newSeasonal = gamma * (values[i] / newLevel) + (1 - gamma) * prevSeasonal;
    }

    const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;

    level.push(newLevel);
    trend.push(newTrend);
    seasonal.push(newSeasonal);

    if (additive) {
      fitted.push(newLevel + newTrend + newSeasonal);
    } else {
      fitted.push((newLevel + newTrend) * newSeasonal);
    }
  }

  return { level, trend, seasonal, fitted };
}

// ============================================================================
// SEASONAL DECOMPOSITION
// ============================================================================

/**
 * Classical seasonal decomposition
 * Separates time series into trend, seasonal, and residual components
 */
export function decomposeSeasonality(
  values: number[],
  seasonLength: number,
  additive: boolean = true
): SeasonalDecomposition {
  const n = values.length;

  // Step 1: Estimate trend using centered moving average
  const trend = simpleMovingAverage(values, seasonLength);

  // Step 2: Remove trend to get seasonal + residual
  const detrended: number[] = values.map((v, i) => {
    if (additive) {
      return v - trend[i];
    } else {
      return trend[i] !== 0 ? v / trend[i] : 1;
    }
  });

  // Step 3: Calculate seasonal indices
  const seasonalSums: number[] = new Array(seasonLength).fill(0);
  const seasonalCounts: number[] = new Array(seasonLength).fill(0);

  for (let i = 0; i < n; i++) {
    const idx = i % seasonLength;
    seasonalSums[idx] += detrended[i];
    seasonalCounts[idx]++;
  }

  const seasonalIndices = seasonalSums.map((sum, i) =>
    seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : (additive ? 0 : 1)
  );

  // Normalize seasonal indices (for additive: sum to 0, for multiplicative: average to 1)
  if (additive) {
    const seasonalMean = seasonalIndices.reduce((a, b) => a + b, 0) / seasonLength;
    for (let i = 0; i < seasonLength; i++) {
      seasonalIndices[i] -= seasonalMean;
    }
  } else {
    const seasonalMean = seasonalIndices.reduce((a, b) => a + b, 0) / seasonLength;
    for (let i = 0; i < seasonLength; i++) {
      seasonalIndices[i] /= seasonalMean;
    }
  }

  // Step 4: Apply seasonal pattern to all observations
  const seasonal: number[] = values.map((_, i) => seasonalIndices[i % seasonLength]);

  // Step 5: Calculate residuals
  const residual: number[] = values.map((v, i) => {
    if (additive) {
      return v - trend[i] - seasonal[i];
    } else {
      return trend[i] * seasonal[i] !== 0 ? v / (trend[i] * seasonal[i]) : 1;
    }
  });

  return { trend, seasonal, residual, seasonalIndices };
}

// ============================================================================
// FORECAST GENERATION
// ============================================================================

/**
 * Generate forecasts using moving average
 */
export function forecastWithMovingAverage(
  values: number[],
  dates: string[],
  horizonDays: number,
  windowSize: number = 7,
  weighted: boolean = false
): ForecastResult {
  const smoothed = weighted
    ? weightedMovingAverage(values, windowSize)
    : simpleMovingAverage(values, windowSize);

  // Last smoothed value is our base forecast
  const baseValue = smoothed[smoothed.length - 1];
  const stats = calculateStats(values.slice(-windowSize * 2));
  const margin = stats.stdDev * 1.96; // 95% confidence

  // Generate future dates
  const lastDate = new Date(dates[dates.length - 1]);
  const forecasts: ForecastPoint[] = [];

  for (let i = 1; i <= horizonDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(baseValue),
      lower: Math.round(Math.max(0, baseValue - margin)),
      upper: Math.round(baseValue + margin)
    });
  }

  // Calculate accuracy on historical data
  const accuracy = calculateAccuracy(values, smoothed);

  return {
    method: weighted ? 'Weighted Moving Average' : 'Simple Moving Average',
    forecasts,
    accuracy,
    parameters: { windowSize }
  };
}

/**
 * Generate forecasts using exponential smoothing
 */
export function forecastWithExponentialSmoothing(
  values: number[],
  dates: string[],
  horizonDays: number,
  seasonLength: number = 7,
  method: 'single' | 'double' | 'triple' = 'double'
): ForecastResult {
  let fitted: number[];
  let lastLevel: number;
  let lastTrend: number = 0;
  let seasonalIndices: number[] = [];

  if (method === 'single') {
    fitted = simpleExponentialSmoothing(values, 0.3);
    lastLevel = fitted[fitted.length - 1];
  } else if (method === 'double') {
    const des = doubleExponentialSmoothing(values, 0.3, 0.1);
    fitted = des.fitted;
    lastLevel = des.level[des.level.length - 1];
    lastTrend = des.trend[des.trend.length - 1];
  } else {
    const tes = tripleExponentialSmoothing(values, seasonLength, 0.3, 0.1, 0.1);
    fitted = tes.fitted;
    lastLevel = tes.level[tes.level.length - 1];
    lastTrend = tes.trend[tes.trend.length - 1];
    seasonalIndices = tes.seasonal.slice(-seasonLength);
  }

  const stats = calculateStats(values.slice(-14));
  const margin = stats.stdDev * 1.96;

  const lastDate = new Date(dates[dates.length - 1]);
  const forecasts: ForecastPoint[] = [];

  for (let i = 1; i <= horizonDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);

    let forecast = lastLevel + lastTrend * i;

    if (method === 'triple' && seasonalIndices.length > 0) {
      const seasonIdx = (values.length + i - 1) % seasonLength;
      forecast += seasonalIndices[seasonIdx];
    }

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(Math.max(0, forecast)),
      lower: Math.round(Math.max(0, forecast - margin * Math.sqrt(i))),
      upper: Math.round(forecast + margin * Math.sqrt(i))
    });
  }

  const accuracy = calculateAccuracy(values, fitted);

  const methodNames = {
    single: 'Simple Exponential Smoothing',
    double: 'Double Exponential Smoothing (Holt)',
    triple: 'Triple Exponential Smoothing (Holt-Winters)'
  };

  return {
    method: methodNames[method],
    forecasts,
    accuracy,
    parameters: {
      alpha: 0.3,
      beta: method !== 'single' ? 0.1 : 0,
      gamma: method === 'triple' ? 0.1 : 0,
      seasonLength: method === 'triple' ? seasonLength : 0
    }
  };
}

/**
 * Generate forecasts using linear regression with trend
 */
export function forecastWithRegression(
  values: number[],
  dates: string[],
  horizonDays: number
): ForecastResult {
  const xValues = values.map((_, i) => i);
  const { slope, intercept, rSquared } = linearRegression(xValues, values);

  const fitted = xValues.map(x => slope * x + intercept);
  const stats = calculateStats(values.map((v, i) => v - fitted[i]));
  const margin = stats.stdDev * 1.96;

  const lastDate = new Date(dates[dates.length - 1]);
  const forecasts: ForecastPoint[] = [];
  const n = values.length;

  for (let i = 1; i <= horizonDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    const forecast = slope * (n + i - 1) + intercept;

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(Math.max(0, forecast)),
      lower: Math.round(Math.max(0, forecast - margin)),
      upper: Math.round(forecast + margin)
    });
  }

  const accuracy = calculateAccuracy(values, fitted);

  return {
    method: 'Linear Regression',
    forecasts,
    accuracy,
    parameters: { slope, intercept, rSquared }
  };
}

// ============================================================================
// ACCURACY METRICS
// ============================================================================

/**
 * Calculate forecast accuracy metrics
 */
export function calculateAccuracy(
  actual: number[],
  predicted: number[]
): { mae: number; mape: number; rmse: number } {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return { mae: 0, mape: 0, rmse: 0 };

  let sumAbsError = 0;
  let sumAbsPercentError = 0;
  let sumSquaredError = 0;
  let countMape = 0;

  for (let i = 0; i < n; i++) {
    const error = actual[i] - predicted[i];
    sumAbsError += Math.abs(error);
    sumSquaredError += error * error;

    if (actual[i] !== 0) {
      sumAbsPercentError += Math.abs(error / actual[i]);
      countMape++;
    }
  }

  return {
    mae: sumAbsError / n,
    mape: countMape > 0 ? (sumAbsPercentError / countMape) * 100 : 0,
    rmse: Math.sqrt(sumSquaredError / n)
  };
}

/**
 * Auto-select best forecasting method based on data characteristics
 */
export function autoSelectMethod(
  values: number[],
  seasonLength: number = 7
): 'sma' | 'wma' | 'ses' | 'des' | 'tes' | 'regression' {
  const n = values.length;

  // Check for trend
  const xValues = values.map((_, i) => i);
  const { rSquared: trendR2 } = linearRegression(xValues, values);
  const hasTrend = trendR2 > 0.3;

  // Check for seasonality (simple variance ratio test)
  if (n >= seasonLength * 2) {
    const decomp = decomposeSeasonality(values, seasonLength);
    const seasonalVar = calculateStats(decomp.seasonalIndices).stdDev;
    const overallVar = calculateStats(values).stdDev;
    const hasSeasonality = seasonalVar / overallVar > 0.1;

    if (hasSeasonality && hasTrend) return 'tes';
    if (hasSeasonality) return 'tes';
  }

  if (hasTrend) {
    return trendR2 > 0.7 ? 'regression' : 'des';
  }

  // Default to weighted moving average for stable data
  return 'wma';
}

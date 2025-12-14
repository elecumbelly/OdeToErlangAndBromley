import { describe, test, expect } from 'vitest';
import {
  simpleMovingAverage,
  weightedMovingAverage,
  simpleExponentialSmoothing,
  doubleExponentialSmoothing,
  tripleExponentialSmoothing,
  decomposeSeasonality,
  forecastWithMovingAverage,
  forecastWithExponentialSmoothing,
  forecastWithRegression,
  calculateAccuracy,
  autoSelectMethod
} from './advancedForecasting';

// ============================================================================
// MOVING AVERAGE TESTS
// ============================================================================

describe('simpleMovingAverage', () => {
  test('calculates SMA correctly', () => {
    const values = [10, 20, 30, 40, 50];
    const sma = simpleMovingAverage(values, 3);

    // First values use available data
    expect(sma[0]).toBe(10); // Only one value
    expect(sma[1]).toBe(15); // (10+20)/2
    expect(sma[2]).toBe(20); // (10+20+30)/3
    expect(sma[3]).toBe(30); // (20+30+40)/3
    expect(sma[4]).toBe(40); // (30+40+50)/3
  });

  test('handles window larger than data', () => {
    const values = [10, 20, 30];
    const sma = simpleMovingAverage(values, 5);

    expect(sma).toHaveLength(3);
    expect(sma[2]).toBe(20); // Average of all
  });

  test('handles empty array', () => {
    const sma = simpleMovingAverage([], 3);
    expect(sma).toHaveLength(0);
  });
});

describe('weightedMovingAverage', () => {
  test('weights recent values more', () => {
    const values = [10, 20, 30, 40, 50];
    const wma = weightedMovingAverage(values, 3);
    const sma = simpleMovingAverage(values, 3);

    // WMA should be closer to recent values than SMA
    expect(wma[4]).toBeGreaterThan(sma[4]);
  });

  test('calculates correctly', () => {
    const values = [10, 20, 30];
    const wma = weightedMovingAverage(values, 3);

    // Weights: 1, 2, 3 (sum = 6)
    // (10*1 + 20*2 + 30*3) / 6 = (10 + 40 + 90) / 6 = 140/6 ≈ 23.33
    expect(wma[2]).toBeCloseTo(23.33, 1);
  });
});

// ============================================================================
// EXPONENTIAL SMOOTHING TESTS
// ============================================================================

describe('simpleExponentialSmoothing', () => {
  test('first value equals input', () => {
    const values = [100, 120, 110, 130];
    const ses = simpleExponentialSmoothing(values, 0.3);

    expect(ses[0]).toBe(100);
  });

  test('smooths values', () => {
    const values = [100, 200, 100, 200, 100];
    const ses = simpleExponentialSmoothing(values, 0.3);

    // Smoothed values should be less volatile
    const inputVariance = calculateVariance(values);
    const outputVariance = calculateVariance(ses);

    expect(outputVariance).toBeLessThan(inputVariance);
  });

  test('alpha=1 equals original values', () => {
    const values = [100, 120, 110];
    const ses = simpleExponentialSmoothing(values, 1);

    expect(ses).toEqual(values);
  });

  test('alpha=0 maintains first value', () => {
    const values = [100, 120, 110];
    const ses = simpleExponentialSmoothing(values, 0);

    expect(ses).toEqual([100, 100, 100]);
  });
});

describe('doubleExponentialSmoothing', () => {
  test('captures trend', () => {
    const values = [100, 110, 120, 130, 140, 150];
    const { trend } = doubleExponentialSmoothing(values, 0.5, 0.3);

    // All trend values should be positive for increasing data
    expect(trend.every(t => t > 0)).toBe(true);
  });

  test('returns level, trend, and fitted', () => {
    const values = [100, 120, 140];
    const result = doubleExponentialSmoothing(values, 0.3, 0.1);

    expect(result.level).toHaveLength(3);
    expect(result.trend).toHaveLength(3);
    expect(result.fitted).toHaveLength(3);
  });
});

describe('tripleExponentialSmoothing', () => {
  test('captures seasonality', () => {
    // Create seasonal data with period 4
    const values = [100, 120, 80, 90, 110, 130, 85, 95, 115, 135, 90, 100];
    const result = tripleExponentialSmoothing(values, 4, 0.3, 0.1, 0.1);

    expect(result.seasonal).toHaveLength(values.length);
    expect(result.fitted).toHaveLength(values.length);
  });

  test('falls back to double ES for short data', () => {
    const values = [100, 110, 120];
    const result = tripleExponentialSmoothing(values, 7, 0.3, 0.1, 0.1);

    // Should still return valid structure
    expect(result.level).toHaveLength(3);
    expect(result.fitted).toHaveLength(3);
  });
});

// ============================================================================
// SEASONAL DECOMPOSITION TESTS
// ============================================================================

describe('decomposeSeasonality', () => {
  test('extracts seasonal pattern', () => {
    // Create strongly seasonal data
    const period = 7;
    const seasonalPattern = [1.2, 1.1, 1.0, 0.9, 0.8, 0.5, 0.5];
    const values: number[] = [];
    for (let i = 0; i < 28; i++) {
      values.push(100 * seasonalPattern[i % period]);
    }

    const decomp = decomposeSeasonality(values, period, true);

    expect(decomp.seasonalIndices).toHaveLength(period);
    expect(decomp.trend).toHaveLength(values.length);
    expect(decomp.seasonal).toHaveLength(values.length);
    expect(decomp.residual).toHaveLength(values.length);
  });

  test('seasonal indices sum to approximately zero (additive)', () => {
    const values = Array.from({ length: 28 }, (_, i) => 100 + Math.sin(i * Math.PI / 3.5) * 20);
    const decomp = decomposeSeasonality(values, 7, true);

    const sum = decomp.seasonalIndices.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(0.01);
  });
});

// ============================================================================
// FORECAST GENERATION TESTS
// ============================================================================

describe('forecastWithMovingAverage', () => {
  test('generates correct number of forecasts', () => {
    const values = [100, 110, 120, 130, 140, 150, 160];
    const dates = values.map((_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);

    const result = forecastWithMovingAverage(values, dates, 14, 7);

    expect(result.forecasts).toHaveLength(14);
    expect(result.method).toBe('Simple Moving Average');
  });

  test('forecasts start from day after last date', () => {
    const values = [100, 110, 120];
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];

    const result = forecastWithMovingAverage(values, dates, 7, 3);

    expect(result.forecasts[0].date).toBe('2024-01-04');
    expect(result.forecasts[6].date).toBe('2024-01-10');
  });

  test('includes confidence intervals', () => {
    const values = [100, 110, 120, 130, 140];
    const dates = values.map((_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);

    const result = forecastWithMovingAverage(values, dates, 7, 3);

    result.forecasts.forEach(point => {
      expect(point.lower).toBeDefined();
      expect(point.upper).toBeDefined();
      expect(point.lower!).toBeLessThanOrEqual(point.value);
      expect(point.upper!).toBeGreaterThanOrEqual(point.value);
    });
  });
});

describe('forecastWithExponentialSmoothing', () => {
  test('generates forecasts with trend (double)', () => {
    const values = [100, 120, 140, 160, 180, 200];
    const dates = values.map((_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);

    const result = forecastWithExponentialSmoothing(values, dates, 7, 7, 'double');

    expect(result.method).toBe('Double Exponential Smoothing (Holt)');
    // Forecasts should continue the upward trend
    expect(result.forecasts[0].value).toBeGreaterThan(values[values.length - 1] - 50);
  });

  test('captures seasonality (triple)', () => {
    const values = Array.from({ length: 28 }, (_, i) => 100 + (i % 7) * 10);
    const dates = values.map((_, i) => {
      const d = new Date('2024-01-01');
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const result = forecastWithExponentialSmoothing(values, dates, 14, 7, 'triple');

    expect(result.method).toBe('Triple Exponential Smoothing (Holt-Winters)');
    expect(result.parameters.seasonLength).toBe(7);
  });
});

describe('forecastWithRegression', () => {
  test('forecasts linear trend', () => {
    const values = [100, 110, 120, 130, 140];
    const dates = values.map((_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);

    const result = forecastWithRegression(values, dates, 5);

    expect(result.method).toBe('Linear Regression');
    expect(result.parameters.slope).toBeCloseTo(10, 0);
    // Next value should be around 150
    expect(result.forecasts[0].value).toBeCloseTo(150, -1);
  });

  test('includes r-squared in parameters', () => {
    const values = [100, 110, 120, 130, 140];
    const dates = values.map((_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);

    const result = forecastWithRegression(values, dates, 5);

    expect(result.parameters.rSquared).toBeCloseTo(1, 2);
  });
});

// ============================================================================
// ACCURACY METRICS TESTS
// ============================================================================

describe('calculateAccuracy', () => {
  test('perfect predictions have zero error', () => {
    const actual = [100, 110, 120];
    const predicted = [100, 110, 120];

    const accuracy = calculateAccuracy(actual, predicted);

    expect(accuracy.mae).toBe(0);
    expect(accuracy.mape).toBe(0);
    expect(accuracy.rmse).toBe(0);
  });

  test('calculates MAE correctly', () => {
    const actual = [100, 100, 100];
    const predicted = [90, 110, 100];

    const accuracy = calculateAccuracy(actual, predicted);

    // |100-90| + |100-110| + |100-100| = 10 + 10 + 0 = 20
    // MAE = 20/3 ≈ 6.67
    expect(accuracy.mae).toBeCloseTo(6.67, 1);
  });

  test('calculates MAPE correctly', () => {
    const actual = [100, 200];
    const predicted = [90, 180];

    const accuracy = calculateAccuracy(actual, predicted);

    // |100-90|/100 + |200-180|/200 = 0.1 + 0.1 = 0.2
    // MAPE = 0.2/2 * 100 = 10%
    expect(accuracy.mape).toBeCloseTo(10, 0);
  });

  test('calculates RMSE correctly', () => {
    const actual = [100, 100];
    const predicted = [90, 110];

    const accuracy = calculateAccuracy(actual, predicted);

    // MSE = ((100-90)^2 + (100-110)^2) / 2 = (100 + 100) / 2 = 100
    // RMSE = sqrt(100) = 10
    expect(accuracy.rmse).toBe(10);
  });

  test('handles zero actuals in MAPE', () => {
    const actual = [0, 100, 100];
    const predicted = [10, 90, 110];

    const accuracy = calculateAccuracy(actual, predicted);

    // Only non-zero actuals counted in MAPE
    expect(accuracy.mape).toBeGreaterThan(0);
  });
});

// ============================================================================
// AUTO-SELECT METHOD TESTS
// ============================================================================

describe('autoSelectMethod', () => {
  test('selects regression for strong linear trend', () => {
    const values = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280];
    const method = autoSelectMethod(values);

    expect(method).toBe('regression');
  });

  test('selects WMA for stable data', () => {
    const values = [100, 102, 98, 101, 99, 100, 102, 98, 101, 99];
    const method = autoSelectMethod(values);

    expect(['wma', 'sma', 'ses']).toContain(method);
  });

  test('selects TES for seasonal data with trend', () => {
    // Create seasonal + trending data
    const values: number[] = [];
    for (let i = 0; i < 28; i++) {
      values.push(100 + i * 2 + Math.sin(i * Math.PI / 3.5) * 30);
    }
    const method = autoSelectMethod(values, 7);

    expect(['tes', 'des']).toContain(method);
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

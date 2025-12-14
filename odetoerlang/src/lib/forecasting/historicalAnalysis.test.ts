import { describe, test, expect } from 'vitest';
import {
  calculateStats,
  linearRegression,
  aggregateByDay,
  analyzeDayOfWeek,
  analyzeMonthly,
  analyzeTrend,
  analyzeHistoricalData,
  getForecastFromPatterns
} from './historicalAnalysis';
import type { HistoricalData } from '../database/dataAccess';

// ============================================================================
// TEST DATA
// ============================================================================

function createMockHistoricalData(
  dates: string[],
  volumes: number[],
  aht: number = 240
): HistoricalData[] {
  return dates.map((date, i) => ({
    campaign_id: 1,
    date,
    volume: volumes[i],
    aht,
    sla_achieved: 0.85,
    asa: 15,
    abandons: Math.round(volumes[i] * 0.05)
  }));
}

// ============================================================================
// calculateStats Tests
// ============================================================================

describe('calculateStats', () => {
  test('calculates basic statistics correctly', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const stats = calculateStats(values);

    expect(stats.count).toBe(10);
    expect(stats.mean).toBe(5.5);
    expect(stats.median).toBe(5.5);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(10);
  });

  test('handles empty array', () => {
    const stats = calculateStats([]);
    expect(stats.count).toBe(0);
    expect(stats.mean).toBe(0);
  });

  test('calculates percentiles correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const stats = calculateStats(values);

    expect(stats.p25).toBeCloseTo(25.75, 1);
    expect(stats.p75).toBeCloseTo(75.25, 1);
    expect(stats.p90).toBeCloseTo(90.1, 1);
  });

  test('calculates standard deviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const stats = calculateStats(values);
    expect(stats.stdDev).toBeCloseTo(2, 0);
  });
});

// ============================================================================
// linearRegression Tests
// ============================================================================

describe('linearRegression', () => {
  test('fits perfect linear data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // y = 2x

    const { slope, intercept, rSquared } = linearRegression(x, y);

    expect(slope).toBeCloseTo(2, 5);
    expect(intercept).toBeCloseTo(0, 5);
    expect(rSquared).toBeCloseTo(1, 5);
  });

  test('handles single point', () => {
    const x = [1];
    const y = [5];

    const { slope, intercept, rSquared } = linearRegression(x, y);

    expect(slope).toBe(0);
    expect(intercept).toBe(5);
    expect(rSquared).toBe(0);
  });

  test('calculates with noise', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2.1, 3.9, 6.2, 7.8, 10.1];

    const { slope, rSquared } = linearRegression(x, y);

    expect(slope).toBeCloseTo(2, 0);
    expect(rSquared).toBeGreaterThan(0.99);
  });
});

// ============================================================================
// aggregateByDay Tests
// ============================================================================

describe('aggregateByDay', () => {
  test('aggregates multiple intervals per day', () => {
    const data: HistoricalData[] = [
      { campaign_id: 1, date: '2024-01-15', volume: 100, aht: 200 },
      { campaign_id: 1, date: '2024-01-15', volume: 150, aht: 250 },
      { campaign_id: 1, date: '2024-01-16', volume: 200, aht: 220 }
    ];

    const aggregates = aggregateByDay(data);

    expect(aggregates).toHaveLength(2);
    expect(aggregates[0].date).toBe('2024-01-15');
    expect(aggregates[0].totalVolume).toBe(250);
    expect(aggregates[0].avgAht).toBe(225);
    expect(aggregates[0].recordCount).toBe(2);
  });

  test('sorts by date', () => {
    const data: HistoricalData[] = [
      { campaign_id: 1, date: '2024-01-17', volume: 100 },
      { campaign_id: 1, date: '2024-01-15', volume: 100 },
      { campaign_id: 1, date: '2024-01-16', volume: 100 }
    ];

    const aggregates = aggregateByDay(data);

    expect(aggregates[0].date).toBe('2024-01-15');
    expect(aggregates[1].date).toBe('2024-01-16');
    expect(aggregates[2].date).toBe('2024-01-17');
  });

  test('calculates abandon rate', () => {
    const data: HistoricalData[] = [
      { campaign_id: 1, date: '2024-01-15', volume: 100, abandons: 10 }
    ];

    const aggregates = aggregateByDay(data);
    expect(aggregates[0].abandonRate).toBe(0.1);
  });
});

// ============================================================================
// analyzeDayOfWeek Tests
// ============================================================================

describe('analyzeDayOfWeek', () => {
  test('groups by day of week', () => {
    // Create data for a full week (Mon-Sun)
    const dates = [
      '2024-01-15', // Monday
      '2024-01-16', // Tuesday
      '2024-01-17', // Wednesday
      '2024-01-18', // Thursday
      '2024-01-19', // Friday
      '2024-01-20', // Saturday
      '2024-01-21', // Sunday
    ];
    const volumes = [1000, 900, 950, 920, 850, 400, 300];

    const data = createMockHistoricalData(dates, volumes);
    const aggregates = aggregateByDay(data);
    const patterns = analyzeDayOfWeek(aggregates);

    expect(patterns).toHaveLength(7);

    // Monday (day 1)
    const monday = patterns.find(p => p.dayOfWeek === 1);
    expect(monday?.avgVolume).toBe(1000);

    // Saturday (day 6)
    const saturday = patterns.find(p => p.dayOfWeek === 6);
    expect(saturday?.avgVolume).toBe(400);
  });

  test('averages across multiple weeks', () => {
    const dates = [
      '2024-01-15', // Monday week 1
      '2024-01-22', // Monday week 2
    ];
    const volumes = [1000, 1200];

    const data = createMockHistoricalData(dates, volumes);
    const aggregates = aggregateByDay(data);
    const patterns = analyzeDayOfWeek(aggregates);

    const monday = patterns.find(p => p.dayOfWeek === 1);
    expect(monday?.avgVolume).toBe(1100); // (1000 + 1200) / 2
    expect(monday?.sampleSize).toBe(2);
  });
});

// ============================================================================
// analyzeMonthly Tests
// ============================================================================

describe('analyzeMonthly', () => {
  test('groups by month', () => {
    const dates = [
      '2024-01-15',
      '2024-02-15',
      '2024-03-15'
    ];
    const volumes = [1000, 1200, 1100];

    const data = createMockHistoricalData(dates, volumes);
    const aggregates = aggregateByDay(data);
    const patterns = analyzeMonthly(aggregates);

    expect(patterns).toHaveLength(12);

    const january = patterns.find(p => p.month === 1);
    expect(january?.avgVolume).toBe(1000);
    expect(january?.monthName).toBe('January');

    const february = patterns.find(p => p.month === 2);
    expect(february?.avgVolume).toBe(1200);
  });

  test('handles months with no data', () => {
    const dates = ['2024-01-15'];
    const volumes = [1000];

    const data = createMockHistoricalData(dates, volumes);
    const aggregates = aggregateByDay(data);
    const patterns = analyzeMonthly(aggregates);

    const december = patterns.find(p => p.month === 12);
    expect(december?.sampleSize).toBe(0);
    expect(december?.avgVolume).toBe(0);
  });
});

// ============================================================================
// analyzeTrend Tests
// ============================================================================

describe('analyzeTrend', () => {
  test('detects increasing trend', () => {
    const values = [100, 110, 120, 130, 140, 150];
    const trend = analyzeTrend(values);

    expect(trend.direction).toBe('increasing');
    expect(trend.percentChange).toBeCloseTo(50, 0);
    expect(trend.rSquared).toBeGreaterThan(0.99);
  });

  test('detects decreasing trend', () => {
    const values = [150, 140, 130, 120, 110, 100];
    const trend = analyzeTrend(values);

    expect(trend.direction).toBe('decreasing');
    expect(trend.percentChange).toBeCloseTo(-33.3, 0);
  });

  test('detects stable pattern', () => {
    const values = [100, 102, 98, 101, 99, 100];
    const trend = analyzeTrend(values);

    expect(trend.direction).toBe('stable');
  });

  test('handles single value', () => {
    const trend = analyzeTrend([100]);

    expect(trend.direction).toBe('stable');
    expect(trend.startValue).toBe(100);
    expect(trend.endValue).toBe(100);
  });
});

// ============================================================================
// analyzeHistoricalData Tests
// ============================================================================

describe('analyzeHistoricalData', () => {
  test('returns null for empty data', () => {
    const result = analyzeHistoricalData([]);
    expect(result).toBeNull();
  });

  test('computes full insights', () => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2024-01-01');
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    const volumes = dates.map((_, i) => 1000 + i * 10 + Math.random() * 50);

    const data = createMockHistoricalData(dates, volumes);
    const insights = analyzeHistoricalData(data);

    expect(insights).not.toBeNull();
    expect(insights!.totalRecords).toBe(30);
    expect(insights!.dateRange.start).toBe('2024-01-01');
    expect(insights!.dailyAggregates).toHaveLength(30);
    expect(insights!.dayOfWeekPatterns).toHaveLength(7);
    expect(insights!.monthlyPatterns).toHaveLength(12);
    expect(insights!.volumeStats.count).toBe(30);
  });
});

// ============================================================================
// getForecastFromPatterns Tests
// ============================================================================

describe('getForecastFromPatterns', () => {
  test('uses day of week pattern', () => {
    const dates = Array.from({ length: 28 }, (_, i) => {
      const d = new Date('2024-01-01'); // Monday
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    // Weekdays high, weekends low
    const volumes = dates.map(date => {
      const dow = new Date(date).getDay();
      return dow === 0 || dow === 6 ? 500 : 1000;
    });

    const data = createMockHistoricalData(dates, volumes);
    const insights = analyzeHistoricalData(data);

    // Forecast for a Monday
    const mondayForecast = getForecastFromPatterns(insights!, '2024-02-05', false);
    // Forecast for a Saturday
    const saturdayForecast = getForecastFromPatterns(insights!, '2024-02-03', false);

    expect(mondayForecast).toBeGreaterThan(saturdayForecast);
  });
});

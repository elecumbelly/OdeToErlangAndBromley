import { describe, test, expect } from 'vitest';
import {
  validateCalculationInputs,
  isValidInput,
  getFieldError,
  type ValidationResult,
} from './inputValidation';
import type { CalculationInputs } from '../../types';
import { createDefaultInputs as createValidInputs } from '../../tests/fixtures/calculatorInputs';

/**
 * inputValidation.ts Test Suite
 *
 * Tests the input validation system for contact center calculations.
 * Validates:
 * - Each field's boundary conditions (min/max)
 * - Model-dependent validation (averagePatience for Erlang A/X)
 * - Multiple error collection
 * - Helper functions (isValidInput, getFieldError)
 */



describe('inputValidation - Basic Functionality', () => {
  test('valid inputs return valid: true with empty errors', () => {
    const inputs = createValidInputs();
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('isValidInput returns true for valid inputs', () => {
    const inputs = createValidInputs();
    expect(isValidInput(inputs)).toBe(true);
  });

  test('getFieldError returns undefined for valid fields', () => {
    const inputs = createValidInputs();
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBeUndefined();
    expect(getFieldError(result, 'aht')).toBeUndefined();
    expect(getFieldError(result, 'targetSLPercent')).toBeUndefined();
  });
});

describe('inputValidation - Volume', () => {
  test('negative volume is invalid', () => {
    const inputs = createValidInputs({ volume: -1 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'volume')).toBe('Volume cannot be negative');
  });

  test('volume exceeding max is invalid', () => {
    const inputs = createValidInputs({ volume: 100001 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'volume')).toContain('cannot exceed');
    expect(getFieldError(result, 'volume')).toContain('100,000');
  });

  test('volume at 0 (boundary) is valid', () => {
    const inputs = createValidInputs({ volume: 0 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBeUndefined();
  });

  test('volume at max (100,000) is valid', () => {
    const inputs = createValidInputs({ volume: 100000 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBeUndefined();
  });

  test('typical volume (500) is valid', () => {
    const inputs = createValidInputs({ volume: 500 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBeUndefined();
  });
});

describe('inputValidation - AHT', () => {
  test('AHT below minimum is invalid', () => {
    const inputs = createValidInputs({ aht: 0 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'aht')).toBe('AHT must be at least 1 second');
  });

  test('AHT at minimum (1 second) is valid', () => {
    const inputs = createValidInputs({ aht: 1 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'aht')).toBeUndefined();
  });

  test('AHT exceeding max is invalid', () => {
    const inputs = createValidInputs({ aht: 7201 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'aht')).toBe('AHT cannot exceed 2 hours (7200 seconds)');
  });

  test('AHT at max (7200 seconds = 2 hours) is valid', () => {
    const inputs = createValidInputs({ aht: 7200 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'aht')).toBeUndefined();
  });

  test('typical AHT (240 seconds = 4 minutes) is valid', () => {
    const inputs = createValidInputs({ aht: 240 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'aht')).toBeUndefined();
  });
});

describe('inputValidation - Service Level', () => {
  test('negative service level is invalid', () => {
    const inputs = createValidInputs({ targetSLPercent: -1 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'targetSLPercent')).toBe('Service level cannot be negative');
  });

  test('service level at 0% (boundary) is valid', () => {
    const inputs = createValidInputs({ targetSLPercent: 0 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'targetSLPercent')).toBeUndefined();
  });

  test('service level exceeding 100% is invalid', () => {
    const inputs = createValidInputs({ targetSLPercent: 101 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'targetSLPercent')).toBe('Service level cannot exceed 100%');
  });

  test('service level at 100% (boundary) is valid', () => {
    const inputs = createValidInputs({ targetSLPercent: 100 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'targetSLPercent')).toBeUndefined();
  });

  test('typical service level (80%) is valid', () => {
    const inputs = createValidInputs({ targetSLPercent: 80 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'targetSLPercent')).toBeUndefined();
  });
});

describe('inputValidation - Threshold', () => {
  test('threshold below minimum is invalid', () => {
    const inputs = createValidInputs({ thresholdSeconds: 0 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'thresholdSeconds')).toBe('Threshold must be at least 1 second');
  });

  test('threshold at minimum (1 second) is valid', () => {
    const inputs = createValidInputs({ thresholdSeconds: 1 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'thresholdSeconds')).toBeUndefined();
  });

  test('threshold exceeding max is invalid', () => {
    const inputs = createValidInputs({ thresholdSeconds: 601 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'thresholdSeconds')).toBe(
      'Threshold cannot exceed 10 minutes (600 seconds)'
    );
  });

  test('threshold at max (600 seconds = 10 minutes) is valid', () => {
    const inputs = createValidInputs({ thresholdSeconds: 600 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'thresholdSeconds')).toBeUndefined();
  });

  test('typical threshold (20 seconds) is valid', () => {
    const inputs = createValidInputs({ thresholdSeconds: 20 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'thresholdSeconds')).toBeUndefined();
  });
});

describe('inputValidation - Shrinkage', () => {
  test('negative shrinkage is invalid', () => {
    const inputs = createValidInputs({ shrinkagePercent: -0.1 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'shrinkagePercent')).toBe('Shrinkage cannot be negative');
  });

  test('shrinkage at 0% (boundary) is valid', () => {
    const inputs = createValidInputs({ shrinkagePercent: 0 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'shrinkagePercent')).toBeUndefined();
  });

  test('shrinkage at 100% is invalid (infinite FTE)', () => {
    const inputs = createValidInputs({ shrinkagePercent: 100 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'shrinkagePercent')).toBe(
      'Shrinkage cannot be 100% (infinite FTE required)'
    );
  });

  test('shrinkage at 99.99% (just below 100) is valid', () => {
    const inputs = createValidInputs({ shrinkagePercent: 99.99 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'shrinkagePercent')).toBeUndefined();
  });

  test('typical shrinkage (25%) is valid', () => {
    const inputs = createValidInputs({ shrinkagePercent: 25 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'shrinkagePercent')).toBeUndefined();
  });
});

describe('inputValidation - Max Occupancy', () => {
  test('occupancy below 50% is invalid', () => {
    const inputs = createValidInputs({ maxOccupancy: 49 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'maxOccupancy')).toBe('Max occupancy must be at least 50%');
  });

  test('occupancy at 50% (boundary) is valid', () => {
    const inputs = createValidInputs({ maxOccupancy: 50 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'maxOccupancy')).toBeUndefined();
  });

  test('occupancy exceeding 100% is invalid', () => {
    const inputs = createValidInputs({ maxOccupancy: 101 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'maxOccupancy')).toBe('Max occupancy cannot exceed 100%');
  });

  test('occupancy at 100% (boundary) is valid', () => {
    const inputs = createValidInputs({ maxOccupancy: 100 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'maxOccupancy')).toBeUndefined();
  });

  test('typical occupancy (85%) is valid', () => {
    const inputs = createValidInputs({ maxOccupancy: 85 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'maxOccupancy')).toBeUndefined();
  });
});

describe('inputValidation - Average Patience (Model-Dependent)', () => {
  test('patience is ignored for Erlang C model', () => {
    const inputs = createValidInputs({
      model: 'C',
      averagePatience: 5, // Below minimum, but should be ignored
    });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'averagePatience')).toBeUndefined();
  });

  test('patience below minimum is invalid for Erlang A', () => {
    const inputs = createValidInputs({
      model: 'A',
      averagePatience: 9,
    });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'averagePatience')).toBe(
      'Average patience must be at least 10 seconds'
    );
  });

  test('patience at minimum (10 seconds) is valid for Erlang A', () => {
    const inputs = createValidInputs({
      model: 'A',
      averagePatience: 10,
    });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'averagePatience')).toBeUndefined();
  });

  test('patience exceeding max is invalid for Erlang A', () => {
    const inputs = createValidInputs({
      model: 'A',
      averagePatience: 1801,
    });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'averagePatience')).toBe(
      'Average patience cannot exceed 30 minutes'
    );
  });

  test('patience at max (1800 seconds = 30 minutes) is valid for Erlang A', () => {
    const inputs = createValidInputs({
      model: 'A',
      averagePatience: 1800,
    });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'averagePatience')).toBeUndefined();
  });

  test('patience below minimum is invalid for Erlang A', () => {
    const inputs = createValidInputs({
      model: 'A',
      averagePatience: 5,
    });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'averagePatience')).toBe(
      'Average patience must be at least 10 seconds'
    );
  });

  test('typical patience (120 seconds) is valid for Erlang A', () => {
    const inputs = createValidInputs({
      model: 'A',
      averagePatience: 120,
    });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'averagePatience')).toBeUndefined();
  });
});

describe('inputValidation - Interval', () => {
  test('zero interval is invalid', () => {
    const inputs = createValidInputs({ intervalMinutes: 0 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'intervalMinutes')).toBe('Interval must be positive');
  });

  test('negative interval is invalid', () => {
    const inputs = createValidInputs({ intervalMinutes: -5 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'intervalMinutes')).toBe('Interval must be positive');
  });

  test('very small positive interval is valid', () => {
    const inputs = createValidInputs({ intervalMinutes: 0.01 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'intervalMinutes')).toBeUndefined();
  });

  test('interval exceeding 60 minutes is invalid', () => {
    const inputs = createValidInputs({ intervalMinutes: 61 });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(getFieldError(result, 'intervalMinutes')).toBe('Interval cannot exceed 60 minutes');
  });

  test('interval at 60 minutes (boundary) is valid', () => {
    const inputs = createValidInputs({ intervalMinutes: 60 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'intervalMinutes')).toBeUndefined();
  });

  test('typical interval (30 minutes) is valid', () => {
    const inputs = createValidInputs({ intervalMinutes: 30 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'intervalMinutes')).toBeUndefined();
  });
});

describe('inputValidation - Multiple Errors', () => {
  test('collects multiple errors from different fields', () => {
    const inputs = createValidInputs({
      volume: -100,
      aht: 10000,
    });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(getFieldError(result, 'volume')).toBeDefined();
    expect(getFieldError(result, 'aht')).toBeDefined();
  });

  test('collects three errors', () => {
    const inputs = createValidInputs({
      volume: -1,
      targetSLPercent: 150,
      shrinkagePercent: 100,
    });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
  });

  test('collects many errors when all fields invalid', () => {
    const inputs: CalculationInputs = {
      volume: -1,
      aht: 0,
      intervalMinutes: 0,
      targetSLPercent: 150,
      thresholdSeconds: 0,
      shrinkagePercent: 100,
      maxOccupancy: 40,
      model: 'A',
      averagePatience: 5,
      concurrency: 1,
    };
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    // Should have 8 errors (all fields except model)
    expect(result.errors.length).toBe(8);
  });

  test('getFieldError finds specific error among multiple', () => {
    const inputs = createValidInputs({
      volume: -100,
      aht: 10000,
      shrinkagePercent: 100,
    });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBe('Volume cannot be negative');
    expect(getFieldError(result, 'aht')).toBe('AHT cannot exceed 2 hours (7200 seconds)');
    expect(getFieldError(result, 'shrinkagePercent')).toBe(
      'Shrinkage cannot be 100% (infinite FTE required)'
    );
    // Unaffected fields should have no error
    expect(getFieldError(result, 'targetSLPercent')).toBeUndefined();
  });
});

describe('inputValidation - Decimal Values', () => {
  test('decimal shrinkage is valid', () => {
    const inputs = createValidInputs({ shrinkagePercent: 25.75 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'shrinkagePercent')).toBeUndefined();
  });

  test('decimal AHT is valid', () => {
    const inputs = createValidInputs({ aht: 240.5 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'aht')).toBeUndefined();
  });

  test('decimal volume is valid', () => {
    const inputs = createValidInputs({ volume: 500.5 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBeUndefined();
  });
});

describe('inputValidation - Integration / Realistic Scenarios', () => {
  test('all fields at lower boundaries are valid', () => {
    const inputs: CalculationInputs = {
      volume: 0,
      aht: 1,
      intervalMinutes: 0.01,
      targetSLPercent: 0,
      thresholdSeconds: 1,
      shrinkagePercent: 0,
      maxOccupancy: 50,
      model: 'C',
      averagePatience: 10,
      concurrency: 1,
    };
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('all fields at upper boundaries are valid', () => {
    const inputs: CalculationInputs = {
      volume: 100000,
      aht: 7200,
      intervalMinutes: 60,
      targetSLPercent: 100,
      thresholdSeconds: 600,
      shrinkagePercent: 99,
      maxOccupancy: 100,
      model: 'A',
      averagePatience: 1800,
      concurrency: 1,
    };
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('typical call center scenario is valid', () => {
    const inputs: CalculationInputs = {
      volume: 500,
      aht: 240,
      intervalMinutes: 30,
      targetSLPercent: 80,
      thresholdSeconds: 20,
      shrinkagePercent: 25,
      maxOccupancy: 85,
      model: 'C',
      averagePatience: 120,
      concurrency: 1,
    };
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('high-volume scenario is valid', () => {
    const inputs: CalculationInputs = {
      volume: 10000,
      aht: 180,
      intervalMinutes: 15,
      targetSLPercent: 90,
      thresholdSeconds: 30,
      shrinkagePercent: 30,
      maxOccupancy: 90,
      model: 'A',
      averagePatience: 60,
      concurrency: 1,
    };
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('mixed valid/invalid returns only invalid field errors', () => {
    const inputs = createValidInputs({
      volume: 500, // valid
      aht: 10000, // invalid
      targetSLPercent: 80, // valid
      shrinkagePercent: 100, // invalid
    });
    const result = validateCalculationInputs(inputs);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(getFieldError(result, 'aht')).toBeDefined();
    expect(getFieldError(result, 'shrinkagePercent')).toBeDefined();
    expect(getFieldError(result, 'volume')).toBeUndefined();
    expect(getFieldError(result, 'targetSLPercent')).toBeUndefined();
  });
});

describe('inputValidation - isValidInput Helper', () => {
  test('returns true for valid inputs', () => {
    const inputs = createValidInputs();
    expect(isValidInput(inputs)).toBe(true);
  });

  test('returns false for invalid inputs', () => {
    const inputs = createValidInputs({ volume: -1 });
    expect(isValidInput(inputs)).toBe(false);
  });

  test('returns false when multiple fields invalid', () => {
    const inputs = createValidInputs({ volume: -1, aht: 0 });
    expect(isValidInput(inputs)).toBe(false);
  });
});

describe('inputValidation - getFieldError Helper', () => {
  test('returns error message for invalid field', () => {
    const inputs = createValidInputs({ volume: -1 });
    const result = validateCalculationInputs(inputs);

    expect(getFieldError(result, 'volume')).toBe('Volume cannot be negative');
  });

  test('returns undefined for valid field', () => {
    const inputs = createValidInputs({ volume: -1 });
    const result = validateCalculationInputs(inputs);

    // aht is still valid
    expect(getFieldError(result, 'aht')).toBeUndefined();
  });

  test('returns undefined for non-existent field in errors', () => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
    };
    expect(getFieldError(result, 'volume')).toBeUndefined();
  });
});

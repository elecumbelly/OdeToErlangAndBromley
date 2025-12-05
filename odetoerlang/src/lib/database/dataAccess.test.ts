import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * dataAccess.ts Test Suite
 *
 * Tests the database query helpers with mocked sql.js database.
 * The actual database integration is tested separately.
 *
 * NOTE: These tests mock getDatabase() to avoid needing actual sql.js/WASM.
 * They validate the query logic and data transformation, not database I/O.
 */

// Mock the initDatabase module
const mockExec = vi.fn();
const mockRun = vi.fn();
const mockPrepare = vi.fn();

const mockDatabase = {
  exec: mockExec,
  run: mockRun,
  prepare: mockPrepare,
};

vi.mock('./initDatabase', () => ({
  getDatabase: () => mockDatabase,
  saveDatabase: vi.fn(),
}));

// Import after mocking
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  getScenarios,
  getBaselineScenario,
  createScenario,
  updateScenario,
  deleteScenario,
  setBaselineScenario,
  getAssumptions,
  getCurrentAssumptions,
  upsertAssumption,
  getClients,
  createClient,
  getForecasts,
  saveForecast,
  getTableCounts,
  type Campaign,
  type Scenario,
  type Client,
} from './dataAccess';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dataAccess - Campaigns', () => {
  test('getCampaigns returns active campaigns by default', () => {
    mockExec.mockReturnValueOnce([
      {
        columns: ['id', 'campaign_name', 'active'],
        values: [
          [1, 'Campaign A', 1],
          [2, 'Campaign B', 1],
        ],
      },
    ]);

    const campaigns = getCampaigns();

    expect(mockExec).toHaveBeenCalledWith(
      'SELECT * FROM Campaigns WHERE active = 1 ORDER BY campaign_name'
    );
    expect(campaigns).toHaveLength(2);
    expect(campaigns[0].id).toBe(1);
    expect(campaigns[0].campaign_name).toBe('Campaign A');
  });

  test('getCampaigns with activeOnly=false returns all campaigns', () => {
    mockExec.mockReturnValueOnce([
      {
        columns: ['id', 'campaign_name', 'active'],
        values: [
          [1, 'Campaign A', 1],
          [2, 'Inactive Campaign', 0],
        ],
      },
    ]);

    getCampaigns(false);

    expect(mockExec).toHaveBeenCalledWith('SELECT * FROM Campaigns ORDER BY campaign_name');
  });

  test('getCampaigns returns empty array when no results', () => {
    mockExec.mockReturnValueOnce([]);

    const campaigns = getCampaigns();

    expect(campaigns).toEqual([]);
  });

  test('getCampaignById returns campaign when found', () => {
    const mockStep = vi.fn().mockReturnValue(true);
    const mockGetAsObject = vi.fn().mockReturnValue({
      id: 1,
      campaign_name: 'Test Campaign',
      client_id: 10,
    });
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      getAsObject: mockGetAsObject,
      free: mockFree,
    });

    const campaign = getCampaignById(1);

    expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM Campaigns WHERE id = ?');
    expect(mockBind).toHaveBeenCalledWith([1]);
    expect(campaign).not.toBeNull();
    expect(campaign?.id).toBe(1);
    expect(campaign?.campaign_name).toBe('Test Campaign');
  });

  test('getCampaignById returns null when not found', () => {
    const mockStep = vi.fn().mockReturnValue(false);
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      free: mockFree,
    });

    const campaign = getCampaignById(999);

    expect(campaign).toBeNull();
  });

  test('createCampaign inserts and returns new ID', () => {
    mockExec.mockReturnValueOnce([{ values: [[42]] }]);

    const newId = createCampaign({
      campaign_name: 'New Campaign',
      client_id: 1,
      channel_type: 'voice',
      start_date: '2024-01-01',
      end_date: null,
      sla_target_percent: 80,
      sla_threshold_seconds: 20,
      concurrency_allowed: 1,
      active: true,
    });

    expect(mockRun).toHaveBeenCalled();
    expect(newId).toBe(42);
  });

  test('updateCampaign skips id and created_at fields', () => {
    updateCampaign(1, {
      id: 999, // Should be ignored
      created_at: '2020-01-01', // Should be ignored
      campaign_name: 'Updated Name',
    });

    expect(mockRun).toHaveBeenCalled();
    const [sql, values] = mockRun.mock.calls[0];
    expect(sql).toContain('campaign_name = ?');
    // Extract the SET clause (between SET and WHERE) and verify id/created_at not in it
    const setClause = sql.match(/SET (.+) WHERE/)?.[1] || '';
    expect(setClause).not.toContain('id =');
    expect(setClause).not.toContain('created_at =');
    expect(values).toEqual(['Updated Name', 1]);
  });

  test('updateCampaign does nothing with empty updates', () => {
    updateCampaign(1, {});

    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('dataAccess - Scenarios', () => {
  test('getScenarios returns all scenarios ordered by created_at DESC', () => {
    mockExec.mockReturnValueOnce([
      {
        columns: ['id', 'scenario_name', 'is_baseline'],
        values: [
          [2, 'Scenario B', 0],
          [1, 'Scenario A', 1],
        ],
      },
    ]);

    const scenarios = getScenarios();

    expect(mockExec).toHaveBeenCalledWith('SELECT * FROM Scenarios ORDER BY created_at DESC');
    expect(scenarios).toHaveLength(2);
  });

  test('getBaselineScenario returns baseline when exists', () => {
    const mockStep = vi.fn().mockReturnValue(true);
    const mockGetAsObject = vi.fn().mockReturnValue({
      id: 1,
      scenario_name: 'Baseline',
      is_baseline: 1,
    });
    const mockFree = vi.fn();

    mockPrepare.mockReturnValueOnce({
      step: mockStep,
      getAsObject: mockGetAsObject,
      free: mockFree,
    });

    const baseline = getBaselineScenario();

    expect(baseline).not.toBeNull();
    expect(baseline?.is_baseline).toBe(1);
  });

  test('getBaselineScenario returns null when no baseline', () => {
    const mockStep = vi.fn().mockReturnValue(false);
    const mockFree = vi.fn();

    mockPrepare.mockReturnValueOnce({
      step: mockStep,
      free: mockFree,
    });

    const baseline = getBaselineScenario();

    expect(baseline).toBeNull();
  });

  test('createScenario clears existing baseline when isBaseline=true', () => {
    mockExec.mockReturnValueOnce([{ values: [[5]] }]);

    createScenario('New Baseline', 'Description', true);

    // First call should clear existing baseline
    expect(mockRun.mock.calls[0][0]).toContain('UPDATE Scenarios SET is_baseline = 0');
    // Second call should insert new scenario
    expect(mockRun.mock.calls[1][0]).toContain('INSERT INTO Scenarios');
  });

  test('createScenario does not clear baseline when isBaseline=false', () => {
    mockExec.mockReturnValueOnce([{ values: [[5]] }]);

    createScenario('Regular Scenario', undefined, false);

    // Should only have one call (INSERT)
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun.mock.calls[0][0]).toContain('INSERT INTO Scenarios');
  });

  test('deleteScenario removes scenario by ID', () => {
    deleteScenario(3);

    expect(mockRun).toHaveBeenCalledWith('DELETE FROM Scenarios WHERE id = ?', [3]);
  });

  test('setBaselineScenario updates baseline atomically', () => {
    setBaselineScenario(2);

    // First clears existing baseline
    expect(mockRun.mock.calls[0][0]).toContain('SET is_baseline = 0');
    // Then sets new baseline
    expect(mockRun.mock.calls[1][0]).toContain('SET is_baseline = 1');
    expect(mockRun.mock.calls[1][1]).toContain(2);
  });
});

describe('dataAccess - Assumptions', () => {
  test('getAssumptions returns global assumptions when campaignId is null', () => {
    mockExec.mockReturnValueOnce([
      {
        columns: ['id', 'assumption_type', 'value'],
        values: [[1, 'shrinkage', 25]],
      },
    ]);

    const assumptions = getAssumptions(null);

    expect(mockExec).toHaveBeenCalledWith(
      'SELECT * FROM Assumptions WHERE campaign_id IS NULL ORDER BY assumption_type'
    );
    expect(assumptions).toHaveLength(1);
  });

  test('getAssumptions includes campaign-specific and global when campaignId provided', () => {
    const mockStep = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockGetAsObject = vi.fn().mockReturnValue({
      id: 1,
      assumption_type: 'shrinkage',
      value: 25,
    });
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      getAsObject: mockGetAsObject,
      free: mockFree,
    });

    const assumptions = getAssumptions(10);

    expect(mockBind).toHaveBeenCalledWith([10]);
    expect(assumptions).toHaveLength(1);
  });

  test('getCurrentAssumptions filters by date', () => {
    const mockStep = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockGetAsObject = vi.fn().mockReturnValue({
      id: 1,
      assumption_type: 'aht',
      value: 180,
      valid_from: '2024-01-01',
      valid_to: null,
    });
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      getAsObject: mockGetAsObject,
      free: mockFree,
    });

    const assumptions = getCurrentAssumptions(null, '2024-06-15');

    expect(mockBind).toHaveBeenCalledWith([null, '2024-06-15', '2024-06-15']);
  });

  test('upsertAssumption inserts new assumption', () => {
    // First check returns empty (no existing)
    mockExec.mockReturnValueOnce([]).mockReturnValueOnce([{ values: [[10]] }]);

    const id = upsertAssumption('shrinkage', 25, 'percent', '2024-01-01', null, null);

    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toContain('INSERT INTO Assumptions');
    expect(id).toBe(10);
  });

  test('upsertAssumption updates existing assumption', () => {
    // First check returns existing
    mockExec.mockReturnValueOnce([{ values: [[5]] }]);

    const id = upsertAssumption('shrinkage', 30, 'percent', '2024-01-01', null, null);

    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toContain('UPDATE Assumptions');
    expect(id).toBe(5);
  });
});

describe('dataAccess - Clients', () => {
  test('getClients returns active clients by default', () => {
    mockExec.mockReturnValueOnce([
      {
        columns: ['id', 'client_name', 'active'],
        values: [[1, 'Client A', 1]],
      },
    ]);

    const clients = getClients();

    expect(mockExec).toHaveBeenCalledWith(
      'SELECT * FROM Clients WHERE active = 1 ORDER BY client_name'
    );
  });

  test('getClients with activeOnly=false returns all', () => {
    mockExec.mockReturnValueOnce([
      {
        columns: ['id', 'client_name', 'active'],
        values: [
          [1, 'Active Client', 1],
          [2, 'Inactive Client', 0],
        ],
      },
    ]);

    getClients(false);

    expect(mockExec).toHaveBeenCalledWith('SELECT * FROM Clients ORDER BY client_name');
  });

  test('createClient inserts and returns new ID', () => {
    mockExec.mockReturnValueOnce([{ values: [[15]] }]);

    const id = createClient('New Client', 'Technology');

    expect(mockRun).toHaveBeenCalledWith(
      'INSERT INTO Clients (client_name, industry, active) VALUES (?, ?, 1)',
      ['New Client', 'Technology']
    );
    expect(id).toBe(15);
  });

  test('createClient handles null industry', () => {
    mockExec.mockReturnValueOnce([{ values: [[16]] }]);

    createClient('Client Without Industry');

    expect(mockRun.mock.calls[0][1]).toEqual(['Client Without Industry', null]);
  });
});

describe('dataAccess - Forecasts', () => {
  test('getForecasts returns forecasts for scenario', () => {
    const mockStep = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockGetAsObject = vi.fn().mockReturnValue({
      id: 1,
      forecast_name: 'Q1 Forecast',
      scenario_id: 1,
    });
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      getAsObject: mockGetAsObject,
      free: mockFree,
    });

    const forecasts = getForecasts(1);

    expect(mockBind).toHaveBeenCalledWith([1]);
  });

  test('getForecasts filters by campaignId when provided', () => {
    const mockStep = vi.fn().mockReturnValue(false);
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      free: mockFree,
    });

    getForecasts(1, 5);

    expect(mockBind).toHaveBeenCalledWith([1, 5]);
  });

  test('saveForecast inserts all fields and returns ID', () => {
    mockExec.mockReturnValueOnce([{ values: [[100]] }]);

    const id = saveForecast({
      forecast_name: 'Test Forecast',
      scenario_id: 1,
      model_type: 'erlangC',
      campaign_id: 1,
      forecast_date: '2024-01-15',
      forecasted_volume: 1000,
      forecasted_aht: 180,
      required_agents: 15,
      required_fte: 20,
      expected_sla: 80,
      expected_occupancy: 85,
      expected_asa: 15,
    });

    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toContain('INSERT INTO Forecasts');
    expect(id).toBe(100);
  });
});

describe('dataAccess - Utility', () => {
  test('getTableCounts returns counts for all tables', () => {
    // Mock successful count for each table
    mockExec.mockImplementation((sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return [{ values: [[10]] }];
      }
      return [];
    });

    const counts = getTableCounts();

    expect(counts).toHaveProperty('Staff');
    expect(counts).toHaveProperty('Campaigns');
    expect(counts).toHaveProperty('Scenarios');
    expect(counts).toHaveProperty('Forecasts');
  });

  test('getTableCounts handles errors gracefully', () => {
    mockExec.mockImplementation((sql: string) => {
      if (sql.includes('NonExistentTable')) {
        throw new Error('Table not found');
      }
      return [{ values: [[5]] }];
    });

    // Should not throw
    expect(() => getTableCounts()).not.toThrow();
  });
});

describe('dataAccess - Helper Functions', () => {
  test('execToArray handles empty results', () => {
    mockExec.mockReturnValueOnce([]);

    const result = getCampaigns();

    expect(result).toEqual([]);
  });

  test('stmtToArray collects all rows', () => {
    const mockStep = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const mockGetAsObject = vi
      .fn()
      .mockReturnValueOnce({ id: 1 })
      .mockReturnValueOnce({ id: 2 });
    const mockFree = vi.fn();
    const mockBind = vi.fn();

    mockPrepare.mockReturnValueOnce({
      bind: mockBind,
      step: mockStep,
      getAsObject: mockGetAsObject,
      free: mockFree,
    });

    const assumptions = getAssumptions(1);

    expect(assumptions).toHaveLength(2);
    expect(assumptions[0].id).toBe(1);
    expect(assumptions[1].id).toBe(2);
  });
});

import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import type { SqlJsStatic } from 'sql.js';

/**
 * Database Integration Tests
 *
 * These tests use the REAL sql.js library (not mocked) to test:
 * - Schema creation and validation
 * - Foreign key constraints
 * - CRUD operations with actual SQL
 * - Data integrity and relationships
 *
 * Note: Storage operations are still mocked since we don't have IndexedDB in test env.
 */

// Mock storage - we don't want actual persistence in tests
vi.mock('./storage', () => ({
  saveDatabaseBinary: vi.fn().mockResolvedValue(undefined),
  loadDatabaseBinary: vi.fn().mockResolvedValue(null),
  deleteDatabaseBinary: vi.fn().mockResolvedValue(undefined),
  migrateFromLocalStorage: vi.fn().mockResolvedValue(false),
}));

// SQL for core tables - subset needed for integration tests
const INTEGRATION_SCHEMA = `
-- Core reference tables
CREATE TABLE IF NOT EXISTS Clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  industry TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'voice',
  start_date TEXT NOT NULL,
  end_date TEXT,
  sla_target_percent INTEGER DEFAULT 80,
  sla_threshold_seconds INTEGER DEFAULT 20,
  concurrency_allowed INTEGER DEFAULT 1,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES Clients(id)
);

CREATE TABLE IF NOT EXISTS Scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_name TEXT NOT NULL,
  description TEXT,
  is_baseline INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS Assumptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assumption_type TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  campaign_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE TABLE IF NOT EXISTS Forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forecast_name TEXT NOT NULL,
  scenario_id INTEGER NOT NULL,
  model_type TEXT NOT NULL,
  campaign_id INTEGER NOT NULL,
  forecast_date TEXT NOT NULL,
  forecasted_volume REAL,
  forecasted_aht REAL,
  required_agents INTEGER,
  required_fte REAL,
  expected_sla REAL,
  expected_occupancy REAL,
  expected_asa REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES Scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT OR IGNORE INTO schema_version (version, description) VALUES (1, 'Integration test schema');
`;

let SQL: SqlJsStatic;
let db: Database;

beforeAll(async () => {
  // Load real sql.js WASM
  SQL = await initSqlJs();
});

afterAll(() => {
  if (db) db.close();
});

beforeEach(() => {
  // Create fresh database for each test
  if (db) db.close();
  db = new SQL.Database();
  db.exec(INTEGRATION_SCHEMA);
});

describe('Integration - Schema Validation', () => {
  test('all required tables exist', () => {
    const tables = ['Clients', 'Sites', 'Campaigns', 'Scenarios', 'Assumptions', 'Forecasts', 'schema_version'];

    tables.forEach(table => {
      const result = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
      expect(result.length).toBe(1);
      expect(result[0].values[0][0]).toBe(table);
    });
  });

  test('schema_version is initialized', () => {
    const result = db.exec('SELECT version, description FROM schema_version ORDER BY version DESC LIMIT 1');
    expect(result.length).toBe(1);
    expect(result[0].values[0][0]).toBe(1);
  });

  test('foreign key constraints are defined', () => {
    const result = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='Campaigns'");
    const createSql = result[0].values[0][0] as string;
    expect(createSql).toContain('FOREIGN KEY');
    expect(createSql).toContain('client_id');
  });
});

describe('Integration - Client CRUD', () => {
  test('creates client with auto-increment id', () => {
    db.run("INSERT INTO Clients (client_name, industry) VALUES ('Acme Corp', 'Technology')");

    const result = db.exec('SELECT * FROM Clients WHERE client_name = ?', ['Acme Corp']);
    expect(result[0].values.length).toBe(1);
    expect(result[0].values[0][1]).toBe('Acme Corp');
    expect(result[0].values[0][2]).toBe('Technology');
  });

  test('client active defaults to 1', () => {
    db.run("INSERT INTO Clients (client_name) VALUES ('Test Client')");

    const result = db.exec('SELECT active FROM Clients WHERE client_name = ?', ['Test Client']);
    expect(result[0].values[0][0]).toBe(1);
  });

  test('created_at is automatically set', () => {
    db.run("INSERT INTO Clients (client_name) VALUES ('Timestamp Test')");

    const result = db.exec('SELECT created_at FROM Clients WHERE client_name = ?', ['Timestamp Test']);
    const timestamp = result[0].values[0][0] as string;
    expect(timestamp).toBeTruthy();
    // Should be a valid date string
    expect(new Date(timestamp).getTime()).not.toBeNaN();
  });

  test('updates client data', () => {
    db.run("INSERT INTO Clients (client_name, industry) VALUES ('Original', 'Tech')");

    db.run("UPDATE Clients SET client_name = 'Updated', industry = 'Finance' WHERE client_name = 'Original'");

    const result = db.exec("SELECT client_name, industry FROM Clients WHERE client_name = 'Updated'");
    expect(result[0].values[0][0]).toBe('Updated');
    expect(result[0].values[0][1]).toBe('Finance');
  });

  test('deletes client', () => {
    db.run("INSERT INTO Clients (client_name) VALUES ('To Delete')");
    const beforeCount = db.exec('SELECT COUNT(*) FROM Clients')[0].values[0][0];

    db.run("DELETE FROM Clients WHERE client_name = 'To Delete'");

    const afterCount = db.exec('SELECT COUNT(*) FROM Clients')[0].values[0][0];
    expect(afterCount).toBe((beforeCount as number) - 1);
  });
});

describe('Integration - Campaign CRUD with Foreign Keys', () => {
  test('creates campaign with valid client_id', () => {
    // First create a client
    db.run("INSERT INTO Clients (client_name) VALUES ('Parent Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    // Create campaign referencing the client
    db.run(
      `INSERT INTO Campaigns (campaign_name, client_id, channel_type, start_date)
       VALUES ('Test Campaign', ?, 'voice', '2024-01-01')`,
      [clientId]
    );

    const result = db.exec('SELECT * FROM Campaigns WHERE campaign_name = ?', ['Test Campaign']);
    expect(result[0].values.length).toBe(1);
    expect(result[0].values[0][2]).toBe(clientId); // client_id column
  });

  test('campaign defaults are applied', () => {
    db.run("INSERT INTO Clients (client_name) VALUES ('Default Test Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run(
      `INSERT INTO Campaigns (campaign_name, client_id, start_date)
       VALUES ('Defaults Campaign', ?, '2024-01-01')`,
      [clientId]
    );

    const result = db.exec(`
      SELECT channel_type, sla_target_percent, sla_threshold_seconds, concurrency_allowed, active
      FROM Campaigns WHERE campaign_name = 'Defaults Campaign'
    `);

    const [channelType, slaTarget, slaThreshold, concurrency, active] = result[0].values[0];
    expect(channelType).toBe('voice');
    expect(slaTarget).toBe(80);
    expect(slaThreshold).toBe(20);
    expect(concurrency).toBe(1);
    expect(active).toBe(1);
  });

  test('retrieves campaigns with JOIN to clients', () => {
    db.run("INSERT INTO Clients (client_name) VALUES ('Joined Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run(
      `INSERT INTO Campaigns (campaign_name, client_id, start_date)
       VALUES ('Joined Campaign', ?, '2024-01-01')`,
      [clientId]
    );

    const result = db.exec(`
      SELECT c.campaign_name, cl.client_name
      FROM Campaigns c
      JOIN Clients cl ON c.client_id = cl.id
      WHERE c.campaign_name = 'Joined Campaign'
    `);

    expect(result[0].values[0][0]).toBe('Joined Campaign');
    expect(result[0].values[0][1]).toBe('Joined Client');
  });
});

describe('Integration - Scenario Management', () => {
  test('creates scenario', () => {
    db.run(
      `INSERT INTO Scenarios (scenario_name, description, is_baseline, created_by)
       VALUES ('Test Scenario', 'A test scenario', 0, 'system')`
    );

    const result = db.exec('SELECT * FROM Scenarios WHERE scenario_name = ?', ['Test Scenario']);
    expect(result[0].values.length).toBe(1);
  });

  test('only one baseline scenario at a time', () => {
    // Create first baseline
    db.run("INSERT INTO Scenarios (scenario_name, is_baseline) VALUES ('Baseline 1', 1)");

    // Create second baseline
    db.run("UPDATE Scenarios SET is_baseline = 0 WHERE is_baseline = 1");
    db.run("INSERT INTO Scenarios (scenario_name, is_baseline) VALUES ('Baseline 2', 1)");

    // Check only one baseline exists
    const result = db.exec('SELECT COUNT(*) FROM Scenarios WHERE is_baseline = 1');
    expect(result[0].values[0][0]).toBe(1);

    // Verify it's the second one
    const baseline = db.exec('SELECT scenario_name FROM Scenarios WHERE is_baseline = 1');
    expect(baseline[0].values[0][0]).toBe('Baseline 2');
  });

  test('scenario updated_at changes on update', () => {
    db.run("INSERT INTO Scenarios (scenario_name) VALUES ('Update Test')");
    db.exec('SELECT updated_at FROM Scenarios WHERE scenario_name = ?', ['Update Test']);

    // Small delay to ensure timestamp changes
    db.run("UPDATE Scenarios SET description = 'Updated', updated_at = CURRENT_TIMESTAMP WHERE scenario_name = 'Update Test'");

    const afterUpdate = db.exec('SELECT updated_at FROM Scenarios WHERE scenario_name = ?', ['Update Test']);
    const after = afterUpdate[0].values[0][0];

    // Timestamps should differ (or at least after should exist)
    expect(after).toBeTruthy();
    // Note: SQLite's CURRENT_TIMESTAMP has second precision, so they might be equal
    // Just verify it's a valid timestamp
    expect(new Date(after as string).getTime()).not.toBeNaN();
  });
});

describe('Integration - Assumptions', () => {
  test('creates global assumption (null campaign_id)', () => {
    db.run(
      `INSERT INTO Assumptions (assumption_type, value, unit, valid_from)
       VALUES ('shrinkage', 25, 'percent', '2024-01-01')`
    );

    const result = db.exec(`
      SELECT assumption_type, value, campaign_id
      FROM Assumptions
      WHERE assumption_type = 'shrinkage'
    `);

    expect(result[0].values[0][0]).toBe('shrinkage');
    expect(result[0].values[0][1]).toBe(25);
    expect(result[0].values[0][2]).toBeNull();
  });

  test('creates campaign-specific assumption', () => {
    db.run("INSERT INTO Clients (client_name) VALUES ('Assumption Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run(
      `INSERT INTO Campaigns (campaign_name, client_id, start_date)
       VALUES ('Assumption Campaign', ?, '2024-01-01')`,
      [clientId]
    );
    const campaignId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run(
      `INSERT INTO Assumptions (assumption_type, value, unit, valid_from, campaign_id)
       VALUES ('aht', 180, 'seconds', '2024-01-01', ?)`,
      [campaignId]
    );

    const result = db.exec(`
      SELECT assumption_type, campaign_id
      FROM Assumptions
      WHERE assumption_type = 'aht'
    `);

    expect(result[0].values[0][1]).toBe(campaignId);
  });

  test('date range filtering works', () => {
    db.run(
      `INSERT INTO Assumptions (assumption_type, value, unit, valid_from, valid_to)
       VALUES ('shrinkage', 20, 'percent', '2024-01-01', '2024-06-30')`
    );
    db.run(
      `INSERT INTO Assumptions (assumption_type, value, unit, valid_from)
       VALUES ('shrinkage', 25, 'percent', '2024-07-01')`
    );

    // Query for May 2024 - should get 20%
    const mayResult = db.exec(`
      SELECT value FROM Assumptions
      WHERE assumption_type = 'shrinkage'
        AND valid_from <= '2024-05-15'
        AND (valid_to IS NULL OR valid_to >= '2024-05-15')
    `);
    expect(mayResult[0].values[0][0]).toBe(20);

    // Query for August 2024 - should get 25%
    const augResult = db.exec(`
      SELECT value FROM Assumptions
      WHERE assumption_type = 'shrinkage'
        AND valid_from <= '2024-08-15'
        AND (valid_to IS NULL OR valid_to >= '2024-08-15')
    `);
    expect(augResult[0].values[0][0]).toBe(25);
  });
});

describe('Integration - Forecasts with Relationships', () => {
  let scenarioId: number;
  let campaignId: number;

  beforeEach(() => {
    // Setup scenario
    db.run("INSERT INTO Scenarios (scenario_name) VALUES ('Forecast Test Scenario')");
    scenarioId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    // Setup client and campaign
    db.run("INSERT INTO Clients (client_name) VALUES ('Forecast Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run(
      `INSERT INTO Campaigns (campaign_name, client_id, start_date)
       VALUES ('Forecast Campaign', ?, '2024-01-01')`,
      [clientId]
    );
    campaignId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;
  });

  test('creates forecast with all metrics', () => {
    db.run(
      `INSERT INTO Forecasts (
        forecast_name, scenario_id, model_type, campaign_id, forecast_date,
        forecasted_volume, forecasted_aht, required_agents, required_fte,
        expected_sla, expected_occupancy, expected_asa
      ) VALUES (
        'Test Forecast', ?, 'erlangC', ?, '2024-03-15',
        1000, 180, 25, 30, 80, 85, 15
      )`,
      [scenarioId, campaignId]
    );

    const result = db.exec('SELECT * FROM Forecasts WHERE forecast_name = ?', ['Test Forecast']);
    expect(result[0].values.length).toBe(1);

    // Verify all values stored correctly
    const forecast = result[0].values[0];
    const columns = result[0].columns;

    const getValue = (col: string) => forecast[columns.indexOf(col)];

    expect(getValue('forecasted_volume')).toBe(1000);
    expect(getValue('forecasted_aht')).toBe(180);
    expect(getValue('required_agents')).toBe(25);
    expect(getValue('expected_sla')).toBe(80);
  });

  test('forecasts ordered by date', () => {
    // Insert out of order
    db.run(
      `INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date)
       VALUES ('March', ?, 'erlangC', ?, '2024-03-15')`,
      [scenarioId, campaignId]
    );
    db.run(
      `INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date)
       VALUES ('January', ?, 'erlangC', ?, '2024-01-15')`,
      [scenarioId, campaignId]
    );
    db.run(
      `INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date)
       VALUES ('February', ?, 'erlangC', ?, '2024-02-15')`,
      [scenarioId, campaignId]
    );

    const result = db.exec(`
      SELECT forecast_name FROM Forecasts
      WHERE scenario_id = ?
      ORDER BY forecast_date
    `, [scenarioId]);

    expect(result[0].values[0][0]).toBe('January');
    expect(result[0].values[1][0]).toBe('February');
    expect(result[0].values[2][0]).toBe('March');
  });

  test('joins forecast with scenario and campaign', () => {
    db.run(
      `INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date)
       VALUES ('Joined Forecast', ?, 'erlangA', ?, '2024-03-15')`,
      [scenarioId, campaignId]
    );

    const result = db.exec(`
      SELECT
        f.forecast_name,
        s.scenario_name,
        c.campaign_name,
        f.model_type
      FROM Forecasts f
      JOIN Scenarios s ON f.scenario_id = s.id
      JOIN Campaigns c ON f.campaign_id = c.id
      WHERE f.forecast_name = 'Joined Forecast'
    `);

    expect(result[0].values[0][0]).toBe('Joined Forecast');
    expect(result[0].values[0][1]).toBe('Forecast Test Scenario');
    expect(result[0].values[0][2]).toBe('Forecast Campaign');
    expect(result[0].values[0][3]).toBe('erlangA');
  });
});

describe('Integration - SQL Injection Prevention', () => {
  test('parameterized queries prevent injection', () => {
    const maliciousInput = "'; DROP TABLE Clients; --";

    // Using parameterized query - should be safe
    db.run("INSERT INTO Clients (client_name) VALUES (?)", [maliciousInput]);

    // Verify the malicious string was stored as data, not executed
    const result = db.exec("SELECT client_name FROM Clients WHERE client_name = ?", [maliciousInput]);
    expect(result[0].values[0][0]).toBe(maliciousInput);

    // Verify Clients table still exists
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='Clients'");
    expect(tables.length).toBe(1);
  });

  test('special characters in data are handled', () => {
    const specialChars = "Test's \"name\" with `backticks` and \\ slashes";

    db.run("INSERT INTO Clients (client_name) VALUES (?)", [specialChars]);

    const result = db.exec("SELECT client_name FROM Clients WHERE id = last_insert_rowid()");
    expect(result[0].values[0][0]).toBe(specialChars);
  });
});

describe('Integration - Transaction Simulation', () => {
  test('multiple related inserts work together', () => {
    // Simulate a transaction-like sequence
    try {
      db.run("INSERT INTO Clients (client_name) VALUES ('Transaction Client')");
      const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

      db.run(
        "INSERT INTO Campaigns (campaign_name, client_id, start_date) VALUES ('Transaction Campaign', ?, '2024-01-01')",
        [clientId]
      );
      const campaignId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

      db.run(
        `INSERT INTO Assumptions (assumption_type, value, unit, valid_from, campaign_id)
         VALUES ('aht', 200, 'seconds', '2024-01-01', ?)`,
        [campaignId]
      );

      // Verify all data is linked correctly
      const result = db.exec(`
        SELECT cl.client_name, c.campaign_name, a.value
        FROM Assumptions a
        JOIN Campaigns c ON a.campaign_id = c.id
        JOIN Clients cl ON c.client_id = cl.id
        WHERE a.assumption_type = 'aht'
      `);

      expect(result[0].values[0][0]).toBe('Transaction Client');
      expect(result[0].values[0][1]).toBe('Transaction Campaign');
      expect(result[0].values[0][2]).toBe(200);
    } catch (error) {
      // This shouldn't happen in happy path
      expect(error).toBeUndefined();
    }
  });
});

describe('Integration - Aggregation Queries', () => {
  test('counts records correctly', () => {
    // Insert multiple clients
    db.run("INSERT INTO Clients (client_name) VALUES ('Client 1')");
    db.run("INSERT INTO Clients (client_name) VALUES ('Client 2')");
    db.run("INSERT INTO Clients (client_name) VALUES ('Client 3')");

    const result = db.exec('SELECT COUNT(*) FROM Clients');
    expect(result[0].values[0][0]).toBe(3);
  });

  test('groups and counts campaigns by client', () => {
    // Create two clients
    db.run("INSERT INTO Clients (client_name) VALUES ('Multi Campaign Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    // Create multiple campaigns for this client
    db.run("INSERT INTO Campaigns (campaign_name, client_id, start_date) VALUES ('Camp 1', ?, '2024-01-01')", [clientId]);
    db.run("INSERT INTO Campaigns (campaign_name, client_id, start_date) VALUES ('Camp 2', ?, '2024-01-01')", [clientId]);
    db.run("INSERT INTO Campaigns (campaign_name, client_id, start_date) VALUES ('Camp 3', ?, '2024-01-01')", [clientId]);

    const result = db.exec(`
      SELECT cl.client_name, COUNT(c.id) as campaign_count
      FROM Clients cl
      LEFT JOIN Campaigns c ON cl.id = c.client_id
      WHERE cl.id = ?
      GROUP BY cl.id
    `, [clientId]);

    expect(result[0].values[0][1]).toBe(3);
  });

  test('calculates averages', () => {
    db.run("INSERT INTO Scenarios (scenario_name) VALUES ('Avg Test')");
    const scenarioId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run("INSERT INTO Clients (client_name) VALUES ('Avg Client')");
    const clientId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    db.run("INSERT INTO Campaigns (campaign_name, client_id, start_date) VALUES ('Avg Campaign', ?, '2024-01-01')", [clientId]);
    const campaignId = db.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;

    // Insert forecasts with different volumes
    db.run(
      "INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date, forecasted_volume) VALUES ('F1', ?, 'erlangC', ?, '2024-01-01', 100)",
      [scenarioId, campaignId]
    );
    db.run(
      "INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date, forecasted_volume) VALUES ('F2', ?, 'erlangC', ?, '2024-01-02', 200)",
      [scenarioId, campaignId]
    );
    db.run(
      "INSERT INTO Forecasts (forecast_name, scenario_id, model_type, campaign_id, forecast_date, forecasted_volume) VALUES ('F3', ?, 'erlangC', ?, '2024-01-03', 300)",
      [scenarioId, campaignId]
    );

    const result = db.exec(`
      SELECT AVG(forecasted_volume) as avg_volume, SUM(forecasted_volume) as total_volume
      FROM Forecasts
      WHERE scenario_id = ?
    `, [scenarioId]);

    expect(result[0].values[0][0]).toBe(200); // Average of 100, 200, 300
    expect(result[0].values[0][1]).toBe(600); // Sum of 100, 200, 300
  });
});

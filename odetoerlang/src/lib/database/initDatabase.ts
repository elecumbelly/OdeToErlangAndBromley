import initSqlJs, { type Database } from 'sql.js';
// Import SQL schema as raw string (Vite feature)
import schemaSql from './schema.sql?raw';
import {
  saveDatabaseBinary,
  loadDatabaseBinary,
  deleteDatabaseBinary,
  migrateFromLocalStorage,
} from './storage';

let db: Database | null = null;

/**
 * Initialize the SQLite database in browser using sql.js
 * Data persists in IndexedDB (migrated from localStorage for larger storage)
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  // Load sql.js WASM from local bundle (enables offline support)
  // WASM file is in /public folder, served at base URL
  const SQL = await initSqlJs({
    locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
  });

  // One-time migration from localStorage to IndexedDB
  await migrateFromLocalStorage();

  // Try to load existing database from IndexedDB
  const savedDbBinary = await loadDatabaseBinary();
  if (savedDbBinary) {
    try {
      db = new SQL.Database(savedDbBinary);


      // Check schema version and run migrations if needed
      await runMigrations();

      return db;
    } catch (error) {
      console.warn('⚠️ Failed to load saved database, creating new one:', error);
    }
  }

  // Create new database
  db = new SQL.Database();


  // Load and execute schema
  createTables();

  // Save to IndexedDB
  await saveDatabase();

  return db;
}

// Current schema version - increment when adding migrations
const CURRENT_SCHEMA_VERSION = 3;

/**
 * Get the current schema version from the database
 * Returns 0 if schema_version table doesn't exist (legacy database)
 */
function getSchemaVersion(): number {
  if (!db) return 0;

  try {
    const result = db.exec('SELECT MAX(version) as version FROM schema_version');
    if (result.length > 0 && result[0].values.length > 0) {
      return (result[0].values[0][0] as number) || 0;
    }
  } catch {
    // Table doesn't exist - legacy database
    return 0;
  }
  return 0;
}

/**
 * Run database migrations if schema is out of date
 */
async function runMigrations(): Promise<void> {
  if (!db) return;

  const currentVersion = getSchemaVersion();

  if (currentVersion < CURRENT_SCHEMA_VERSION) {


    // Migration 0 → 1: Add schema_version table to legacy databases
    if (currentVersion < 1) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        );
        INSERT OR IGNORE INTO schema_version (version, description)
        VALUES (1, 'Initial schema - WFM Ready Reckoner');
      `);

    }

    // Migration 1 → 2: Add erlang_model column to Scenarios table
    if (currentVersion < 2) {
      db.exec(`
        ALTER TABLE Scenarios ADD COLUMN erlang_model TEXT DEFAULT 'C';
        INSERT OR REPLACE INTO schema_version (version, description)
        VALUES (2, 'Add erlang_model column to Scenarios');
      `);
    }

    // Migration 2 → 3: Add scheduling tables
    if (currentVersion < 3) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS SchedulePlans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_name TEXT NOT NULL,
          campaign_id INTEGER NOT NULL,
          scenario_id INTEGER,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          interval_minutes INTEGER DEFAULT 30,
          max_weekly_hours INTEGER DEFAULT 40,
          min_rest_hours INTEGER DEFAULT 11,
          allow_skill_switch BOOLEAN DEFAULT 1,
          break_window_start_min INTEGER DEFAULT 60,
          break_window_end_min INTEGER DEFAULT 480,
          lunch_window_start_min INTEGER DEFAULT 180,
          lunch_window_end_min INTEGER DEFAULT 360,
          status TEXT DEFAULT 'Draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          FOREIGN KEY (campaign_id) REFERENCES Campaigns(id),
          FOREIGN KEY (scenario_id) REFERENCES Scenarios(id)
        );
        CREATE INDEX IF NOT EXISTS idx_scheduleplans_campaign ON SchedulePlans(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleplans_scenario ON SchedulePlans(scenario_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleplans_dates ON SchedulePlans(start_date, end_date);
        CREATE INDEX IF NOT EXISTS idx_scheduleplans_status ON SchedulePlans(status);

        CREATE TABLE IF NOT EXISTS CoverageRequirements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          schedule_plan_id INTEGER NOT NULL,
          requirement_date DATE NOT NULL,
          interval_start TIME NOT NULL,
          interval_end TIME NOT NULL,
          skill_id INTEGER NOT NULL,
          required_agents INTEGER NOT NULL,
          source_forecast_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (schedule_plan_id) REFERENCES SchedulePlans(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES Skills(id),
          FOREIGN KEY (source_forecast_id) REFERENCES Forecasts(id)
        );
        CREATE INDEX IF NOT EXISTS idx_coverage_plan ON CoverageRequirements(schedule_plan_id);
        CREATE INDEX IF NOT EXISTS idx_coverage_date ON CoverageRequirements(requirement_date);
        CREATE INDEX IF NOT EXISTS idx_coverage_skill ON CoverageRequirements(skill_id);

        CREATE TABLE IF NOT EXISTS ShiftTemplates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_name TEXT NOT NULL,
          paid_minutes INTEGER NOT NULL DEFAULT 480,
          unpaid_minutes INTEGER NOT NULL DEFAULT 60,
          break_count INTEGER NOT NULL DEFAULT 2,
          break_minutes INTEGER NOT NULL DEFAULT 15,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_shifttemplates_name ON ShiftTemplates(template_name);

        CREATE TABLE IF NOT EXISTS OptimizationMethods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          method_key TEXT UNIQUE NOT NULL,
          method_name TEXT NOT NULL,
          version TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_optimizationmethods_key ON OptimizationMethods(method_key);

        CREATE TABLE IF NOT EXISTS ScheduleRuns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          schedule_plan_id INTEGER NOT NULL,
          method_id INTEGER NOT NULL,
          run_group_id TEXT,
          label TEXT,
          status TEXT DEFAULT 'Pending',
          started_at DATETIME,
          completed_at DATETIME,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          FOREIGN KEY (schedule_plan_id) REFERENCES SchedulePlans(id) ON DELETE CASCADE,
          FOREIGN KEY (method_id) REFERENCES OptimizationMethods(id)
        );
        CREATE INDEX IF NOT EXISTS idx_scheduleruns_plan ON ScheduleRuns(schedule_plan_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleruns_method ON ScheduleRuns(method_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleruns_group ON ScheduleRuns(run_group_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleruns_status ON ScheduleRuns(status);

        CREATE TABLE IF NOT EXISTS Shifts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          schedule_run_id INTEGER NOT NULL,
          staff_id INTEGER NOT NULL,
          shift_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          template_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (schedule_run_id) REFERENCES ScheduleRuns(id) ON DELETE CASCADE,
          FOREIGN KEY (staff_id) REFERENCES Staff(id),
          FOREIGN KEY (template_id) REFERENCES ShiftTemplates(id)
        );
        CREATE INDEX IF NOT EXISTS idx_shifts_run ON Shifts(schedule_run_id);
        CREATE INDEX IF NOT EXISTS idx_shifts_staff ON Shifts(staff_id);
        CREATE INDEX IF NOT EXISTS idx_shifts_date ON Shifts(shift_date);

        CREATE TABLE IF NOT EXISTS ShiftSegments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shift_id INTEGER NOT NULL,
          segment_start TIME NOT NULL,
          segment_end TIME NOT NULL,
          segment_type TEXT NOT NULL,
          skill_id INTEGER,
          is_paid BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shift_id) REFERENCES Shifts(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES Skills(id)
        );
        CREATE INDEX IF NOT EXISTS idx_shiftsegments_shift ON ShiftSegments(shift_id);
        CREATE INDEX IF NOT EXISTS idx_shiftsegments_skill ON ShiftSegments(skill_id);
        CREATE INDEX IF NOT EXISTS idx_shiftsegments_type ON ShiftSegments(segment_type);

        CREATE TABLE IF NOT EXISTS ScheduleMetrics (
          schedule_run_id INTEGER PRIMARY KEY,
          coverage_percent REAL DEFAULT 0,
          gap_minutes INTEGER DEFAULT 0,
          overstaff_minutes INTEGER DEFAULT 0,
          overtime_minutes INTEGER DEFAULT 0,
          violations_count INTEGER DEFAULT 0,
          cost_estimate REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (schedule_run_id) REFERENCES ScheduleRuns(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ScheduleViolations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          schedule_run_id INTEGER NOT NULL,
          staff_id INTEGER,
          violation_date DATE NOT NULL,
          violation_type TEXT NOT NULL,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (schedule_run_id) REFERENCES ScheduleRuns(id) ON DELETE CASCADE,
          FOREIGN KEY (staff_id) REFERENCES Staff(id)
        );
        CREATE INDEX IF NOT EXISTS idx_scheduleviolations_run ON ScheduleViolations(schedule_run_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleviolations_staff ON ScheduleViolations(staff_id);
        CREATE INDEX IF NOT EXISTS idx_scheduleviolations_date ON ScheduleViolations(violation_date);
        CREATE INDEX IF NOT EXISTS idx_scheduleviolations_type ON ScheduleViolations(violation_type);

        INSERT INTO ShiftTemplates (template_name, paid_minutes, unpaid_minutes, break_count, break_minutes)
        SELECT 'Standard 9h (8 paid + 1 lunch)', 480, 60, 2, 15
        WHERE NOT EXISTS (
          SELECT 1 FROM ShiftTemplates WHERE template_name = 'Standard 9h (8 paid + 1 lunch)'
        );

        INSERT OR IGNORE INTO OptimizationMethods (method_key, method_name, version, description)
        VALUES
          ('greedy', 'Greedy Fill', '1.0', 'Baseline gap-first fill'),
          ('local_search', 'Local Search', '1.0', 'Iterative swap-based improvement'),
          ('solver', 'Solver', '0.1', 'Placeholder for ILP/CP-SAT solver');

        INSERT OR REPLACE INTO schema_version (version, description)
        VALUES (3, 'Add scheduling tables');
      `);
    }

    await saveDatabase();

  }
}

/**
 * Execute all CREATE TABLE statements
 */
function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Execute schema (imported as raw string via Vite)
  db.exec(schemaSql);


}

/**
 * Save database to IndexedDB (called after every write)
 */
export async function saveDatabase(): Promise<void> {
  if (!db) return;

  try {
    const data = db.export();
    await saveDatabaseBinary(data);

  } catch (error) {
    console.error('❌ Failed to save database:', error);
  }
}

/**
 * Get the current database instance
 */
export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/**
 * Clear all data and reset database
 */
export async function resetDatabase() {
  await deleteDatabaseBinary();
  db = null;
  await initDatabase();

}

/**
 * Export database as downloadable file
 */
export function exportDatabase(): Blob {
  if (!db) throw new Error('Database not initialized');

  const data = db.export();
  return new Blob([data.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
}

/**
 * Import database from file
 */
export async function importDatabase(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const SQL = await initSqlJs({
    locateFile: (f) => `${import.meta.env.BASE_URL}${f}`,
  });

  db = new SQL.Database(uint8Array);

  // Run migrations on imported database
  await runMigrations();
  await saveDatabase();


}

/**
 * Expose current schema version for diagnostics
 */
export function getCurrentSchemaVersion(): number {
  return getSchemaVersion();
}

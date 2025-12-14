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
  // WASM file is in /public folder, served at root
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`,
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
const CURRENT_SCHEMA_VERSION = 2;

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
    locateFile: (f) => new URL(`/${f}`, import.meta.url).href,
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

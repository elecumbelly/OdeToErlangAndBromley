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
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });

  // One-time migration from localStorage to IndexedDB
  await migrateFromLocalStorage();

  // Try to load existing database from IndexedDB
  const savedDbBinary = await loadDatabaseBinary();
  if (savedDbBinary) {
    try {
      db = new SQL.Database(savedDbBinary);
      console.log('✅ Database loaded from IndexedDB');
      return db;
    } catch (error) {
      console.warn('⚠️ Failed to load saved database, creating new one:', error);
    }
  }

  // Create new database
  db = new SQL.Database();
  console.log('🆕 Creating new database');

  // Load and execute schema
  createTables();

  // Save to IndexedDB
  await saveDatabase();

  return db;
}

/**
 * Execute all CREATE TABLE statements
 */
function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Execute schema (imported as raw string via Vite)
  db.exec(schemaSql);

  console.log('✅ All 21 tables created');
}

/**
 * Save database to IndexedDB (called after every write)
 */
export async function saveDatabase(): Promise<void> {
  if (!db) return;

  try {
    const data = db.export();
    await saveDatabaseBinary(data);
    console.log('💾 Database saved to IndexedDB');
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
  console.log('🔄 Database reset');
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
    locateFile: () => '/sql-wasm.wasm',
  });

  db = new SQL.Database(uint8Array);
  await saveDatabase();

  console.log('📥 Database imported from file');
}

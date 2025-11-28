import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;

/**
 * Initialize the SQLite database in browser using sql.js
 * Data persists in localStorage
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  // Load sql.js WASM
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem('odetoerlang_db');
  if (savedDb) {
    try {
      const buffer = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0));
      db = new SQL.Database(buffer);
      console.log('✅ Database loaded from localStorage');
      return db;
    } catch (error) {
      console.warn('⚠️ Failed to load saved database, creating new one:', error);
    }
  }

  // Create new database
  db = new SQL.Database();
  console.log('🆕 Creating new database');

  // Load and execute schema
  await createTables();

  // Save to localStorage
  saveDatabase();

  return db;
}

/**
 * Execute all CREATE TABLE statements
 */
async function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Fetch schema.sql
  const response = await fetch('/src/lib/database/schema.sql');
  const schemaSql = await response.text();

  // Execute all statements
  db.exec(schemaSql);

  console.log('✅ All 21 tables created');
}

/**
 * Save database to localStorage (called after every write)
 */
export function saveDatabase() {
  if (!db) return;

  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    localStorage.setItem('odetoerlang_db', buffer.toString('base64'));
    console.log('💾 Database saved to localStorage');
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
  localStorage.removeItem('odetoerlang_db');
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
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  db = new SQL.Database(uint8Array);
  saveDatabase();

  console.log('📥 Database imported from file');
}

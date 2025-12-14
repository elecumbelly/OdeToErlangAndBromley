/**
 * IndexedDB Storage Module
 *
 * Provides persistent storage for the SQLite database binary.
 * IndexedDB has much larger storage limits than localStorage (5MB),
 * typically 50%+ of available disk space.
 *
 * Uses the 'idb' library for a cleaner Promise-based API.
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'odetoerlang';
const DB_VERSION = 1;
const STORE_NAME = 'database';
const DB_KEY = 'sqlite_binary';

interface OdeToErlangAndBromleyDB {
  database: {
    key: string;
    value: Uint8Array;
  };
}

let dbPromise: Promise<IDBPDatabase<OdeToErlangAndBromleyDB>> | null = null;

/**
 * Get or create the IndexedDB connection
 */
function getDB(): Promise<IDBPDatabase<OdeToErlangAndBromleyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OdeToErlangAndBromleyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save SQLite database binary to IndexedDB
 *
 * @param data - The SQLite database as Uint8Array
 */
export async function saveDatabaseBinary(data: Uint8Array): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, data, DB_KEY);
}

/**
 * Load SQLite database binary from IndexedDB
 *
 * @returns The database binary, or null if not found
 */
export async function loadDatabaseBinary(): Promise<Uint8Array | null> {
  const db = await getDB();
  const data = await db.get(STORE_NAME, DB_KEY);
  return data ?? null;
}

/**
 * Delete the stored database binary
 */
export async function deleteDatabaseBinary(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, DB_KEY);
}

/**
 * Check if a database binary exists in storage
 */
export async function hasDatabaseBinary(): Promise<boolean> {
  const data = await loadDatabaseBinary();
  return data !== null;
}

/**
 * Get storage usage information
 *
 * @returns Object with usage stats, or null if not supported
 */
export async function getStorageUsage(): Promise<{
  used: number;
  quota: number;
  percentUsed: number;
} | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      used,
      quota,
      percentUsed: quota > 0 ? (used / quota) * 100 : 0,
    };
  }
  return null;
}

/**
 * Migrate data from localStorage to IndexedDB (one-time migration)
 *
 * @returns true if migration occurred, false if no data to migrate
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  const LEGACY_KEY = 'odetoerlang_db';
  const savedDb = localStorage.getItem(LEGACY_KEY);

  if (!savedDb) {
    return false;
  }

  try {
    // Convert base64 to Uint8Array
    const buffer = Uint8Array.from(atob(savedDb), (c) => c.charCodeAt(0));

    // Save to IndexedDB
    await saveDatabaseBinary(buffer);

    // Remove from localStorage
    localStorage.removeItem(LEGACY_KEY);

  
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to migrate from localStorage:', error);
    return false;
  }
}

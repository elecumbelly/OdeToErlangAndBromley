import { describe, test, expect, vi, beforeEach } from 'vitest';

/**
 * initDatabase.ts Test Suite
 *
 * Tests SQLite database initialization and lifecycle with mocked sql.js.
 * Validates singleton pattern, schema creation, and persistence operations.
 *
 * NOTE: These tests are complex due to the singleton pattern and module-level state.
 * We use vi.resetModules() to get fresh module instances.
 */

// Mock storage module
vi.mock('./storage', () => ({
  saveDatabaseBinary: vi.fn().mockResolvedValue(undefined),
  loadDatabaseBinary: vi.fn().mockResolvedValue(null),
  deleteDatabaseBinary: vi.fn().mockResolvedValue(undefined),
  migrateFromLocalStorage: vi.fn().mockResolvedValue(false),
}));

// Mock sql.js - must use a class for proper `new` usage
vi.mock('sql.js', () => {
  // Create a class that can be used with `new`
  class MockDatabaseClass {
    exec = vi.fn();
    export = vi.fn(() => new Uint8Array([1, 2, 3]));
  }

  return {
    default: vi.fn().mockResolvedValue({
      Database: MockDatabaseClass,
    }),
    __MockDatabaseClass: MockDatabaseClass,
  };
});

// Mock schema import
vi.mock('./schema.sql?raw', () => ({
  default: 'CREATE TABLE test (id INTEGER);',
}));

beforeEach(async () => {
  vi.clearAllMocks();
  // Reset module state to clear singleton
  vi.resetModules();
});

describe('initDatabase - Basic Operations', () => {
  test('getDatabase throws when not initialized', async () => {
    const { getDatabase } = await import('./initDatabase');

    expect(() => getDatabase()).toThrow('Database not initialized');
  });

  test('initDatabase returns database instance', async () => {
    const { initDatabase } = await import('./initDatabase');
    const storage = await import('./storage');

    const db = await initDatabase();

    expect(db).toBeDefined();
    expect(storage.migrateFromLocalStorage).toHaveBeenCalled();
  });

  test('getDatabase returns instance after init', async () => {
    const { initDatabase, getDatabase } = await import('./initDatabase');

    await initDatabase();
    const db = getDatabase();

    expect(db).toBeDefined();
  });

  test('singleton pattern returns same instance', async () => {
    const { initDatabase } = await import('./initDatabase');

    const db1 = await initDatabase();
    const db2 = await initDatabase();

    expect(db1).toBe(db2);
  });
});

describe('initDatabase - Loading Saved Database', () => {
  test('loads database from IndexedDB when data exists', async () => {
    const storage = await import('./storage');
    const savedData = new Uint8Array([10, 20, 30]);

    vi.mocked(storage.loadDatabaseBinary).mockResolvedValueOnce(savedData);

    vi.resetModules();
    const { initDatabase } = await import('./initDatabase');

    const db = await initDatabase();

    expect(db).toBeDefined();
  });
});

describe('initDatabase - Schema Creation', () => {
  test('executes schema on new database', async () => {
    vi.resetModules();
    const { initDatabase } = await import('./initDatabase');

    const db = await initDatabase();

    // Schema exec should have been called (on the db.exec mock)
    expect(db.exec).toHaveBeenCalled();
  });
});

describe('initDatabase - saveDatabase', () => {
  test('exports and saves database binary', async () => {
    const storage = await import('./storage');

    vi.resetModules();
    const { initDatabase, saveDatabase } = await import('./initDatabase');

    const db = await initDatabase();
    vi.clearAllMocks();

    await saveDatabase();

    expect(db.export).toHaveBeenCalled();
    expect(storage.saveDatabaseBinary).toHaveBeenCalled();
  });

  test('does nothing when database not initialized', async () => {
    const storage = await import('./storage');

    vi.resetModules();
    const { saveDatabase } = await import('./initDatabase');

    await saveDatabase(); // Should not throw

    expect(storage.saveDatabaseBinary).not.toHaveBeenCalled();
  });
});

describe('initDatabase - exportDatabase', () => {
  test('returns Blob with database data', async () => {
    vi.resetModules();
    const { initDatabase, exportDatabase } = await import('./initDatabase');

    await initDatabase();

    const blob = exportDatabase();

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/x-sqlite3');
  });

  test('throws when not initialized', async () => {
    vi.resetModules();
    const { exportDatabase } = await import('./initDatabase');

    expect(() => exportDatabase()).toThrow('Database not initialized');
  });
});

describe('initDatabase - resetDatabase', () => {
  test('deletes and reinitializes database', async () => {
    const storage = await import('./storage');

    vi.resetModules();
    const { initDatabase, resetDatabase } = await import('./initDatabase');

    await initDatabase();
    vi.clearAllMocks();

    await resetDatabase();

    expect(storage.deleteDatabaseBinary).toHaveBeenCalled();
  });
});

describe('initDatabase - importDatabase', () => {
  test('imports database from file', async () => {
    const storage = await import('./storage');

    vi.resetModules();
    const { initDatabase, importDatabase } = await import('./initDatabase');

    await initDatabase();
    vi.clearAllMocks();

    const fileData = new Uint8Array([10, 20, 30]);
    // Create a mock file with arrayBuffer method
    const mockFile = {
      name: 'test.db',
      type: 'application/x-sqlite3',
      arrayBuffer: vi.fn().mockResolvedValue(fileData.buffer),
    } as unknown as File;

    await importDatabase(mockFile);

    expect(storage.saveDatabaseBinary).toHaveBeenCalled();
  });
});

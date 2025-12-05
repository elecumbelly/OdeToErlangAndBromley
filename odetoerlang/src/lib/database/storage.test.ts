import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * storage.ts Test Suite
 *
 * Tests IndexedDB storage operations with mocked idb library.
 * Uses Vitest's mock capabilities to avoid actual IndexedDB operations.
 */

// Must use factory function for vi.mock hoisting
vi.mock('idb', () => {
  const mockPut = vi.fn();
  const mockGet = vi.fn();
  const mockDelete = vi.fn();

  return {
    openDB: vi.fn().mockResolvedValue({
      put: mockPut,
      get: mockGet,
      delete: mockDelete,
    }),
    __mockPut: mockPut,
    __mockGet: mockGet,
    __mockDelete: mockDelete,
  };
});

// Import after mocking
import {
  saveDatabaseBinary,
  loadDatabaseBinary,
  deleteDatabaseBinary,
  hasDatabaseBinary,
  getStorageUsage,
  migrateFromLocalStorage,
} from './storage';
import * as idbModule from 'idb';

// Type assertion to access mock internals
const getMocks = () => ({
  mockPut: (idbModule as unknown as { __mockPut: ReturnType<typeof vi.fn> }).__mockPut,
  mockGet: (idbModule as unknown as { __mockGet: ReturnType<typeof vi.fn> }).__mockGet,
  mockDelete: (idbModule as unknown as { __mockDelete: ReturnType<typeof vi.fn> }).__mockDelete,
});

// Mock navigator.storage
let mockEstimate: ReturnType<typeof vi.fn>;
let navigatorHasStorage = true;

beforeEach(() => {
  vi.clearAllMocks();
  mockEstimate = vi.fn();
  navigatorHasStorage = true;

  Object.defineProperty(global, 'navigator', {
    value: navigatorHasStorage
      ? {
          storage: {
            estimate: mockEstimate,
          },
        }
      : {},
    writable: true,
    configurable: true,
  });

  // Mock localStorage
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
});

describe('storage - saveDatabaseBinary', () => {
  test('saves Uint8Array to IndexedDB', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);

    await saveDatabaseBinary(data);

    const { mockPut } = getMocks();
    expect(mockPut).toHaveBeenCalledWith('database', data, 'sqlite_binary');
  });

  test('saves empty Uint8Array', async () => {
    const data = new Uint8Array([]);

    await saveDatabaseBinary(data);

    const { mockPut } = getMocks();
    expect(mockPut).toHaveBeenCalledWith('database', data, 'sqlite_binary');
  });

  test('saves large Uint8Array', async () => {
    const data = new Uint8Array(100000);
    data.fill(42);

    await saveDatabaseBinary(data);

    const { mockPut } = getMocks();
    expect(mockPut).toHaveBeenCalledWith('database', data, 'sqlite_binary');
  });
});

describe('storage - loadDatabaseBinary', () => {
  test('returns Uint8Array when data exists', async () => {
    const savedData = new Uint8Array([1, 2, 3]);
    const { mockGet } = getMocks();
    mockGet.mockResolvedValueOnce(savedData);

    const result = await loadDatabaseBinary();

    expect(mockGet).toHaveBeenCalledWith('database', 'sqlite_binary');
    expect(result).toBe(savedData);
  });

  test('returns null when no data exists', async () => {
    const { mockGet } = getMocks();
    mockGet.mockResolvedValueOnce(undefined);

    const result = await loadDatabaseBinary();

    expect(result).toBeNull();
  });

  test('returns null when data is null', async () => {
    const { mockGet } = getMocks();
    mockGet.mockResolvedValueOnce(null);

    const result = await loadDatabaseBinary();

    expect(result).toBeNull();
  });
});

describe('storage - deleteDatabaseBinary', () => {
  test('deletes data from IndexedDB', async () => {
    await deleteDatabaseBinary();

    const { mockDelete } = getMocks();
    expect(mockDelete).toHaveBeenCalledWith('database', 'sqlite_binary');
  });
});

describe('storage - hasDatabaseBinary', () => {
  test('returns true when data exists', async () => {
    const { mockGet } = getMocks();
    mockGet.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));

    const result = await hasDatabaseBinary();

    expect(result).toBe(true);
  });

  test('returns false when no data exists', async () => {
    const { mockGet } = getMocks();
    mockGet.mockResolvedValueOnce(undefined);

    const result = await hasDatabaseBinary();

    expect(result).toBe(false);
  });
});

describe('storage - getStorageUsage', () => {
  test('returns storage estimate when supported', async () => {
    mockEstimate.mockResolvedValueOnce({
      usage: 1000000,
      quota: 50000000,
    });

    const result = await getStorageUsage();

    expect(result).toEqual({
      used: 1000000,
      quota: 50000000,
      percentUsed: 2, // 1M / 50M = 2%
    });
  });

  test('handles zero quota', async () => {
    mockEstimate.mockResolvedValueOnce({
      usage: 0,
      quota: 0,
    });

    const result = await getStorageUsage();

    expect(result).toEqual({
      used: 0,
      quota: 0,
      percentUsed: 0,
    });
  });

  test('handles missing usage/quota values', async () => {
    mockEstimate.mockResolvedValueOnce({});

    const result = await getStorageUsage();

    expect(result).toEqual({
      used: 0,
      quota: 0,
      percentUsed: 0,
    });
  });

  test('returns null when storage API not supported', async () => {
    // Remove navigator.storage
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    const result = await getStorageUsage();

    expect(result).toBeNull();
  });
});

describe('storage - migrateFromLocalStorage', () => {
  test('returns false when no localStorage data', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const result = await migrateFromLocalStorage();

    expect(result).toBe(false);
  });

  test('migrates data from localStorage to IndexedDB', async () => {
    // Create mock base64 data in localStorage
    const originalData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const base64Data = btoa(String.fromCharCode(...originalData));
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(base64Data);

    const result = await migrateFromLocalStorage();

    expect(result).toBe(true);
    const { mockPut } = getMocks();
    expect(mockPut).toHaveBeenCalled();
    expect(localStorage.removeItem).toHaveBeenCalledWith('odetoerlang_db');
  });

  test('returns false on migration error', async () => {
    // Set up invalid base64 data
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('not-valid-base64!!!');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await migrateFromLocalStorage();

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

/**
 * useCSVWorker - Hook to manage CSV parsing via Web Worker
 *
 * Provides a clean API for parsing CSV files off the main thread
 * with progress tracking, timeout, single retry, and error handling.
 *
 * Hardening (Phase 6, item 23): a hung worker no longer locks the UI
 * indefinitely — CSV_WORKER_TIMEOUT_MS bounds each attempt, with one retry
 * on timeout/error before falling back to main-thread parsing.
 */

import { useCallback, useRef, useState } from 'react';
import type Papa from 'papaparse';
import type { CSVWorkerResponse } from '../workers/csvWorker';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const CSV_WORKER_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

interface UseCSVWorkerReturn {
  parseCSV: (file: File) => Promise<Papa.ParseResult<unknown>>;
  isLoading: boolean;
  error: string | null;
}

function attemptWorkerParse(file: File): Promise<Papa.ParseResult<unknown>> {
  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      fn();
    };

    try {
      worker = new Worker(
        new URL('../workers/csvWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<CSVWorkerResponse>) => {
        if (event.data.type === 'success' && event.data.data) {
          settle(() => resolve(event.data.data!));
        } else {
          const err = event.data.error || 'Unknown parsing error';
          settle(() => reject(new Error(err)));
        }
      };

      worker.onerror = (event) => {
        settle(() => reject(new Error(`Worker error: ${event.message}`)));
      };

      timer = setTimeout(() => {
        settle(() => reject(new Error(`Worker timed out after ${CSV_WORKER_TIMEOUT_MS}ms`)));
      }, CSV_WORKER_TIMEOUT_MS);

      worker.postMessage({ type: 'parse', file });
    } catch (e) {
      settle(() => reject(e instanceof Error ? e : new Error(String(e))));
    }
  });
}

async function mainThreadFallback(file: File): Promise<Papa.ParseResult<unknown>> {
  const Papa = await import('papaparse');
  return new Promise((resolve, reject) => {
    Papa.default.parse(file, {
      complete: resolve,
      error: reject,
    });
  });
}

export function useCSVWorker(): UseCSVWorkerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAbortRef = useRef<(() => void) | null>(null);

  const parseCSV = useCallback(async (file: File): Promise<Papa.ParseResult<unknown>> => {
    if (file.size > MAX_FILE_SIZE) {
      const err = `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
      setError(err);
      throw new Error(err);
    }

    setIsLoading(true);
    setError(null);

    const runFallback = async () => {
      try {
        return await mainThreadFallback(file);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
        lastAbortRef.current = null;
      }
    };

    // Worker may not be supported (older browsers, sandboxed iframes, etc.).
    if (typeof Worker === 'undefined') {
      return runFallback();
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await attemptWorkerParse(file);
        setIsLoading(false);
        return result;
      } catch (e) {
        lastError = e;
      }
    }

    console.error('[useCSVWorker] worker exhausted retries, falling back to main thread', {
      file: file.name,
      size: file.size,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    return runFallback();
  }, []);

  return {
    parseCSV,
    isLoading,
    error,
  };
}

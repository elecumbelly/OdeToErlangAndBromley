/**
 * useCSVWorker - Hook to manage CSV parsing via Web Worker
 *
 * Provides a clean API for parsing CSV files off the main thread
 * with progress tracking and error handling.
 */

import { useCallback, useRef, useState } from 'react';
import type Papa from 'papaparse';
import type { CSVWorkerResponse } from '../workers/csvWorker';

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface UseCSVWorkerReturn {
  parseCSV: (file: File) => Promise<Papa.ParseResult<unknown>>;
  isLoading: boolean;
  error: string | null;
}

export function useCSVWorker(): UseCSVWorkerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const parseCSV = useCallback((file: File): Promise<Papa.ParseResult<unknown>> => {
    return new Promise((resolve, reject) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const err = `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        setError(err);
        reject(new Error(err));
        return;
      }

      setIsLoading(true);
      setError(null);

      // Create worker with Vite's worker import syntax
      // Falls back to main thread if workers not supported
      try {
        workerRef.current = new Worker(
          new URL('../workers/csvWorker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<CSVWorkerResponse>) => {
          setIsLoading(false);

          if (event.data.type === 'success' && event.data.data) {
            resolve(event.data.data);
          } else {
            const err = event.data.error || 'Unknown parsing error';
            setError(err);
            reject(new Error(err));
          }

          // Clean up worker
          workerRef.current?.terminate();
          workerRef.current = null;
        };

        workerRef.current.onerror = (event) => {
          setIsLoading(false);
          const err = `Worker error: ${event.message}`;
          setError(err);
          reject(new Error(err));

          workerRef.current?.terminate();
          workerRef.current = null;
        };

        // Send file to worker
        workerRef.current.postMessage({
          type: 'parse',
          file,
        });
      } catch {
        // Fallback to main thread parsing if workers not supported
        setIsLoading(false);

        // Dynamic import to keep bundle size down
        import('papaparse').then((Papa) => {
          Papa.default.parse(file, {
            complete: (results) => {
              resolve(results);
            },
            error: (err) => {
              setError(err.message);
              reject(err);
            },
          });
        });
      }
    });
  }, []);

  return {
    parseCSV,
    isLoading,
    error,
  };
}

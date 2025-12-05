/**
 * CSV Worker - Offloads Papa Parse processing to a Web Worker
 *
 * Handles CSV parsing off the main thread to prevent UI blocking
 * for large files.
 */

import Papa from 'papaparse';

export interface CSVWorkerRequest {
  type: 'parse';
  file: File;
  config?: Papa.ParseConfig;
}

export interface CSVWorkerResponse {
  type: 'success' | 'error';
  data?: Papa.ParseResult<unknown>;
  error?: string;
}

// Worker message handler
self.onmessage = async (event: MessageEvent<CSVWorkerRequest>) => {
  const { type, file, config } = event.data;

  if (type === 'parse') {
    try {
      // Parse the file
      Papa.parse(file, {
        ...config,
        complete: (results) => {
          const response: CSVWorkerResponse = {
            type: 'success',
            data: results,
          };
          self.postMessage(response);
        },
        error: (error) => {
          const response: CSVWorkerResponse = {
            type: 'error',
            error: error.message,
          };
          self.postMessage(response);
        },
      });
    } catch (err) {
      const response: CSVWorkerResponse = {
        type: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      self.postMessage(response);
    }
  }
};

export {};

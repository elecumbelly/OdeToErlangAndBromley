import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmartCSVImport from './SmartCSVImport';
import { ToastProvider } from './ui/Toast';

/**
 * SmartCSVImport Component Smoke Tests
 *
 * These tests verify that the component:
 * - Renders without crashing
 * - Displays upload zone and instructions
 * - Has correct form elements
 * - Accessibility requirements are met
 */

// Mock the stores and hooks
const mockSetInput = vi.fn();
const mockParseCSV = vi.fn();

vi.mock('../store/calculatorStore', () => ({
  useCalculatorStore: (selector: (state: { setInput: typeof mockSetInput }) => typeof mockSetInput) =>
    selector({ setInput: mockSetInput }),
}));

vi.mock('../hooks/useCSVWorker', () => ({
  useCSVWorker: () => ({
    parseCSV: mockParseCSV,
    isLoading: false,
    error: null,
  }),
}));

// Helper to render with ToastProvider
const renderWithToast = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SmartCSVImport - Smoke Tests', () => {
  test('renders without crashing', () => {
    renderWithToast(<SmartCSVImport />);
    expect(screen.getByText(/Universal CSV Importer/i)).toBeInTheDocument();
  });

  test('displays upload instructions', () => {
    renderWithToast(<SmartCSVImport />);
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Any CSV file with call center data/i)).toBeInTheDocument();
  });

  test('has file input element', () => {
    renderWithToast(<SmartCSVImport />);
    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toBe('.csv');
  });

  test('file input is hidden', () => {
    renderWithToast(<SmartCSVImport />);
    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;
    expect(fileInput.className).toContain('hidden');
  });

  test('displays max file size information', () => {
    renderWithToast(<SmartCSVImport />);
    expect(screen.getByText(/max 50MB/i)).toBeInTheDocument();
  });
});

describe('SmartCSVImport - File Upload Interaction', () => {
  test('calls parseCSV when file is selected', async () => {
    const mockData = {
      data: [
        ['Incoming Calls', 'AHT', 'Service Level'],
        ['100', '180', '85'],
      ],
    };

    mockParseCSV.mockResolvedValueOnce(mockData);

    renderWithToast(<SmartCSVImport />);

    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;

    // Create a mock file
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for async operations
    await waitFor(() => {
      expect(mockParseCSV).toHaveBeenCalledWith(file);
    });
  });

  test('shows preview after successful file upload', async () => {
    const mockData = {
      data: [
        ['Incoming Calls', 'AHT', 'Service Level'],
        ['100', '180', '85'],
        ['120', '175', '82'],
      ],
    };

    mockParseCSV.mockResolvedValueOnce(mockData);

    renderWithToast(<SmartCSVImport />);

    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for mapping UI to appear
    await waitFor(() => {
      expect(screen.getByText(/Map Your Columns/i)).toBeInTheDocument();
    });

    // Preview should show row count
    await waitFor(() => {
      expect(screen.getByText(/Preview/i)).toBeInTheDocument();
    });
  });
});

describe('SmartCSVImport - Column Mapping', () => {
  test('shows mapping UI after file upload', async () => {
    const mockData = {
      data: [
        ['Incoming Calls', 'AHT', 'Service Level'],
        ['100', '180', '85'],
      ],
    };

    mockParseCSV.mockResolvedValueOnce(mockData);

    renderWithToast(<SmartCSVImport />);

    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // Should see mapping labels
      expect(screen.getByText(/Call Volume/i)).toBeInTheDocument();
      expect(screen.getByText(/Average Handle Time/i)).toBeInTheDocument();
    });
  });

  test('has Import Data button after file upload', async () => {
    const mockData = {
      data: [
        ['Volume', 'AHT'],
        ['100', '180'],
      ],
    };

    mockParseCSV.mockResolvedValueOnce(mockData);

    renderWithToast(<SmartCSVImport />);

    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;
    const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
    });
  });
});

describe('SmartCSVImport - Accessibility', () => {
  test('upload zone is clickable', () => {
    renderWithToast(<SmartCSVImport />);

    const uploadLabel = screen.getByText(/Click to upload/i).closest('label');
    expect(uploadLabel).toBeInTheDocument();
    expect(uploadLabel).toHaveAttribute('for', 'smart-csv-upload');
  });

  test('file input has correct attributes', () => {
    renderWithToast(<SmartCSVImport />);

    const fileInput = document.getElementById('smart-csv-upload') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.csv');
  });
});

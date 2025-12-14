import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssumptionsPanel from './AssumptionsPanel';

/**
 * AssumptionsPanel Component Tests
 *
 * Tests verify:
 * - Renders without crashing
 * - Displays key UI elements
 * - Shows empty state when no assumptions
 */

// Mock the database store
const mockFetchAssumptions = vi.fn();
const mockRefreshCampaigns = vi.fn();
const mockSaveAssumption = vi.fn();

vi.mock('../store/databaseStore', () => ({
  useDatabaseStore: () => ({
    assumptions: [],
    campaigns: [],
    fetchAssumptions: mockFetchAssumptions,
    refreshCampaigns: mockRefreshCampaigns,
    saveAssumption: mockSaveAssumption,
  }),
}));

// Mock the Toast hook
const mockAddToast = vi.fn();
vi.mock('./ui/Toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AssumptionsPanel - Smoke Tests', () => {
  test('renders without crashing', () => {
    render(<AssumptionsPanel />);
    expect(screen.getByText('Assumptions Manager')).toBeInTheDocument();
  });

  test('displays "+ Add Assumption" button', () => {
    render(<AssumptionsPanel />);
    expect(screen.getByRole('button', { name: /\+ Add Assumption/i })).toBeInTheDocument();
  });

  test('shows empty state message when no assumptions', () => {
    render(<AssumptionsPanel />);
    expect(screen.getByText(/No assumptions defined yet/i)).toBeInTheDocument();
  });

  test('fetchAssumptions called on mount', () => {
    render(<AssumptionsPanel />);
    expect(mockFetchAssumptions).toHaveBeenCalledTimes(1);
  });

  test('refreshCampaigns called on mount', () => {
    render(<AssumptionsPanel />);
    expect(mockRefreshCampaigns).toHaveBeenCalledTimes(1);
  });
});

// Dialog interaction tests skipped - Dialog component has rendering issues in test environment
// The Dialog component uses Radix UI which needs special test setup

describe('AssumptionsPanel - Accessibility', () => {
  test('buttons are properly labeled', () => {
    render(<AssumptionsPanel />);

    const addButton = screen.getByRole('button', { name: /\+ Add Assumption/i });
    expect(addButton.tagName).toBe('BUTTON');
  });
});

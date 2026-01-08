import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';

/**
 * Dashboard Component Tests
 */

// Mock Recharts to avoid 0px height/width issues in JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

// Mock the database store
const mockSelectCampaign = vi.fn();
vi.mock('../../store/databaseStore', () => ({
  useDatabaseStore: vi.fn(() => ({
    campaigns: [
      { id: 1, campaign_name: 'Test Campaign' }
    ],
    selectedCampaignId: null,
    selectCampaign: mockSelectCampaign,
  })),
}));

// Mock the calculator store
vi.mock('../../store/calculatorStore', () => ({
  useCalculatorStore: vi.fn(() => ({
    inputs: {
      volume: 1000,
      aht: 240,
      targetSLPercent: 80,
      maxOccupancy: 90,
    },
    results: {
      requiredAgents: 50,
      serviceLevel: 0.85,
      occupancy: 0.75,
      canAchieveTarget: true,
    },
  })),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dashboard heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Command Centre')).toBeInTheDocument();
  });

  test('displays key metrics from calculator store', () => {
    render(<Dashboard />);
    // Check for volume (formatted by MetricCard with 2 decimals by default)
    expect(screen.getByText('1,000.00')).toBeInTheDocument();
    // Check for agents
    expect(screen.getByText('50.00')).toBeInTheDocument();
    // Check for SL (formatted with 1 decimal as specified in props)
    expect(screen.getByText('85.0')).toBeInTheDocument();
  });

  test('shows campaign selector with options', () => {
    render(<Dashboard />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Global View')).toBeInTheDocument();
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
  });

  test('calls selectCampaign when selection changes', () => {
    render(<Dashboard />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });
    expect(mockSelectCampaign).toHaveBeenCalledWith(1);
  });

  test('renders chart and alerts sections', () => {
    render(<Dashboard />);
    expect(screen.getByText('Service Level Trend (Last 7 Days)')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('Understaffed: Monday Morning')).toBeInTheDocument();
  });
});

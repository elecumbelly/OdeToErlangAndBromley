import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SchedulingTab from './SchedulingTab';

// Hoist a stable mock store object so its function refs are identity-stable
// across renders. Without this, every render returns new vi.fn() refs and
// the effects with function deps re-fire infinitely → OOM.
const mockStore = vi.hoisted(() => {
  const stub = () => undefined;
  return {
    campaigns: [],
    scenarios: [],
    selectedCampaignId: null,
    selectedScenarioId: null,
    schedulePlans: [],
    scheduleRuns: [],
    shiftTemplates: [],
    optimizationMethods: [],
    selectedSchedulePlanId: null,
    refreshSchedulePlans: stub,
    refreshScheduleRuns: stub,
    refreshShiftTemplates: stub,
    refreshOptimizationMethods: stub,
    selectSchedulePlan: stub,
    addSchedulePlan: stub,
    editSchedulePlan: stub,
    removeSchedulePlan: stub,
    addScheduleRun: stub,
  };
});

vi.mock('../store/databaseStore', () => ({
  useDatabaseStore: () => mockStore,
}));

vi.mock('../store/calculatorStore', () => ({
  useCalculatorStore: () => ({ inputs: {} }),
}));

vi.mock('../lib/database/dataAccess', () => ({
  getCoverageRequirements: () => [],
  getScheduleMetricsByRunIds: () => [],
}));

vi.mock('../lib/scheduling/coverageGenerator', () => ({
  generateCoverageRequirements: () => undefined,
}));

vi.mock('../lib/scheduling/schedulerEngine', () => ({
  runScheduleOptimization: () => undefined,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SchedulingTab — smoke tests', () => {
  test('renders the Scheduling Planner heading', () => {
    render(<SchedulingTab />);
    expect(screen.getByText(/Scheduling Planner/i)).toBeInTheDocument();
  });

  test('renders the New Plan button', () => {
    render(<SchedulingTab />);
    expect(screen.getByRole('button', { name: /New Plan/i })).toBeInTheDocument();
  });

  test('shows "No campaign" badge when no campaign is selected', () => {
    render(<SchedulingTab />);
    expect(screen.getByText(/No campaign/i)).toBeInTheDocument();
  });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScenarioManager from './ScenarioManager';

/**
 * ScenarioManager Component Smoke Tests
 *
 * These tests verify that the component:
 * - Renders without crashing
 * - Displays key UI elements
 * - Handles user interactions correctly
 * - Shows proper states (empty, with data)
 */

// Mock the stores
const mockRefreshScenarios = vi.fn();
const mockSelectScenario = vi.fn();
const mockAddScenario = vi.fn();
const mockRemoveScenario = vi.fn();
const mockMakeBaseline = vi.fn();
const mockSaveCurrentForecast = vi.fn();

vi.mock('../store/databaseStore', () => ({
  useDatabaseStore: () => ({
    scenarios: [],
    selectedScenarioId: null,
    refreshScenarios: mockRefreshScenarios,
    selectScenario: mockSelectScenario,
    addScenario: mockAddScenario,
    removeScenario: mockRemoveScenario,
    makeBaseline: mockMakeBaseline,
    saveCurrentForecast: mockSaveCurrentForecast,
    error: null,
  }),
}));

vi.mock('../store/calculatorStore', () => ({
  useCalculatorStore: () => ({
    inputs: {
      model: 'erlangC',
      volume: 100,
      aht: 180,
    },
    results: null,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ScenarioManager - Smoke Tests', () => {
  test('renders without crashing', () => {
    render(<ScenarioManager />);
    expect(screen.getByText('Scenarios')).toBeInTheDocument();
  });

  test('displays "+ New" button', () => {
    render(<ScenarioManager />);
    expect(screen.getByRole('button', { name: /\+ New/i })).toBeInTheDocument();
  });

  test('shows empty state message when no scenarios', () => {
    render(<ScenarioManager />);
    expect(screen.getByText(/No scenarios yet/i)).toBeInTheDocument();
  });

  test('refreshScenarios called on mount', () => {
    render(<ScenarioManager />);
    expect(mockRefreshScenarios).toHaveBeenCalledTimes(1);
  });

  test('toggles creation form when clicking "+ New"', () => {
    render(<ScenarioManager />);

    const newButton = screen.getByRole('button', { name: /\+ New/i });
    fireEvent.click(newButton);

    // Form should be visible
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Scenario/i })).toBeInTheDocument();

    // Button text should change to "Cancel"
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('hides creation form when clicking "Cancel"', () => {
    render(<ScenarioManager />);

    // Open form
    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();

    // Close form
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
  });

  test('Create Scenario button is disabled when name is empty', () => {
    render(<ScenarioManager />);

    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    const createButton = screen.getByRole('button', { name: /Create Scenario/i });

    expect(createButton).toBeDisabled();
  });

  test('Create Scenario button enables when name is entered', () => {
    render(<ScenarioManager />);

    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    const nameInput = screen.getByLabelText(/Name/i);
    const createButton = screen.getByRole('button', { name: /Create Scenario/i });

    fireEvent.change(nameInput, { target: { value: 'Test Scenario' } });

    expect(createButton).not.toBeDisabled();
  });
});

describe('ScenarioManager - Form Interactions', () => {
  test('calls addScenario when form is submitted', () => {
    mockAddScenario.mockReturnValueOnce(1);

    render(<ScenarioManager />);

    // Open form
    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));

    // Fill in form
    const nameInput = screen.getByLabelText(/Name/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(nameInput, { target: { value: 'New Scenario' } });
    fireEvent.change(descInput, { target: { value: 'Test description' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Scenario/i }));

    expect(mockAddScenario).toHaveBeenCalledWith('New Scenario', 'Test description');
  });

  test('closes form after successful creation', () => {
    mockAddScenario.mockReturnValueOnce(1);

    render(<ScenarioManager />);

    // Open form
    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));

    // Fill and submit
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Scenario' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Scenario/i }));

    // Form should be hidden
    expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
  });

  test('selects newly created scenario', () => {
    mockAddScenario.mockReturnValueOnce(5);

    render(<ScenarioManager />);

    // Open form and create
    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Scenario' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Scenario/i }));

    expect(mockSelectScenario).toHaveBeenCalledWith(5);
  });
});

describe('ScenarioManager - Accessibility', () => {
  test('form inputs have proper labels', () => {
    render(<ScenarioManager />);

    fireEvent.click(screen.getByRole('button', { name: /\+ New/i }));

    const nameInput = screen.getByLabelText(/Name/i);
    const descInput = screen.getByLabelText(/Description/i);

    expect(nameInput).toHaveAttribute('id', 'scenarioName');
    expect(descInput).toHaveAttribute('id', 'scenarioDesc');
  });

  test('buttons are keyboard accessible', () => {
    render(<ScenarioManager />);

    const newButton = screen.getByRole('button', { name: /\+ New/i });
    expect(newButton.tagName).toBe('BUTTON');
  });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimpleLanding from './SimpleLanding';

/**
 * SimpleLanding - Smoke tests
 *
 * Locks in the beginner-friendly affordances:
 *  - Step numbering and prompts
 *  - InfoTip on each numeric input
 *  - Staffing assumptions expanded by default
 *  - "Start here" preset badge
 *  - Glossary footer
 *  - Plain-English result phrasing (agents + people on payroll)
 */

const mockSetInput = vi.fn();

const baseState = {
  inputs: {
    volume: 80,
    aht: 210,
    intervalMinutes: 30,
    targetSLPercent: 80,
    thresholdSeconds: 20,
    shrinkagePercent: 25,
    maxOccupancy: 90,
    model: 'C',
    averagePatience: 120,
    concurrency: 1,
    solveFor: 'agents',
    currentHeadcount: 0,
  },
  results: {
    requiredAgents: 8,
    totalFTE: 11,
    serviceLevel: 82,
    occupancy: 78,
    asa: 12,
    trafficIntensity: 9.33,
    canAchieveTarget: true,
  },
  validation: { valid: true, errors: [] },
  setInput: mockSetInput,
};

vi.mock('../store/calculatorStore', () => {
  const useCalculatorStore = (selector: (state: typeof baseState) => unknown) => selector(baseState);
  useCalculatorStore.getState = () => baseState;
  return { useCalculatorStore };
});

beforeEach(() => {
  mockSetInput.mockClear();
});

describe('SimpleLanding — beginner affordances', () => {
  test('renders the three numbered steps', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    expect(screen.getByText(/How many contacts\?/i)).toBeInTheDocument();
    expect(screen.getByText(/How fast do you need to answer\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Who's actually available\?/i)).toBeInTheDocument();
  });

  test('every key input has an InfoTip button', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    expect(screen.getByRole('button', { name: /What is Contacts arriving/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What is Average handle time/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What is Service level target/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What is Answer time target/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What is Shrinkage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What is Maximum occupancy/i })).toBeInTheDocument();
  });

  test('InfoTip toggles a tooltip on click', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    const tipButton = screen.getByRole('button', { name: /What is Shrinkage/i });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.click(tipButton);
    const tip = screen.getByRole('tooltip');
    expect(tip).toBeInTheDocument();
    expect(tip.textContent).toMatch(/breaks, training/i);
  });

  test('"Start here" badge appears on the first preset', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    expect(screen.getByText(/Start here/i)).toBeInTheDocument();
  });

  test('staffing assumptions section is open by default', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    const summary = screen.getByText(/Staffing assumptions/i);
    const details = summary.closest('details');
    expect(details).not.toBeNull();
    expect(details).toHaveAttribute('open');
  });

  test('glossary section renders the key terms', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    expect(screen.getByText(/What do these terms mean\?/i)).toBeInTheDocument();
    // "Erlang C" also appears in the hero kicker; restrict to the glossary <dt>.
    const erlangTerms = screen.getAllByText(/^Erlang C$/);
    expect(erlangTerms.some((el) => el.tagName === 'DT')).toBe(true);
    expect(screen.getByText(/AHT \(Average Handle Time\)/i)).toBeInTheDocument();
    expect(screen.getByText(/FTE \(Full-Time Equivalent\)/i)).toBeInTheDocument();
  });

  test('result phrasing names agents AND people on payroll', () => {
    render(<SimpleLanding onOpenAdvanced={() => undefined} />);
    expect(screen.getByText(/8 agents/i)).toBeInTheDocument();
    expect(screen.getByText(/11 people on payroll/i)).toBeInTheDocument();
    expect(screen.getByText(/breaks and shrinkage/i)).toBeInTheDocument();
  });

  test('"Open advanced planner" button fires onOpenAdvanced', () => {
    const onOpenAdvanced = vi.fn();
    render(<SimpleLanding onOpenAdvanced={onOpenAdvanced} />);
    fireEvent.click(screen.getByRole('button', { name: /Open advanced planner/i }));
    expect(onOpenAdvanced).toHaveBeenCalledTimes(1);
  });
});

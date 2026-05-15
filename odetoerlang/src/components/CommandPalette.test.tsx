import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette, type CommandEntry } from './CommandPalette';

const entries: CommandEntry[] = [
  { id: 'dashboard', name: 'Overview', hubName: 'Command', description: 'KPI launchpad', icon: '🏠' },
  { id: 'calculator', name: 'Standard', hubName: 'Calculator', description: 'Erlang B/C/A', icon: '🧮' },
  { id: 'scheduling', name: 'Scheduling', hubName: 'Planning', description: 'Coverage and shifts', icon: '⏰' },
];

describe('CommandPalette', () => {
  it('renders entries when open', () => {
    const onSelect = vi.fn();
    render(<CommandPalette open={true} onOpenChange={() => {}} entries={entries} onSelect={onSelect} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
  });

  it('filters entries by query', () => {
    render(<CommandPalette open={true} onOpenChange={() => {}} entries={entries} onSelect={() => {}} />);
    const input = screen.getByLabelText('Search tabs');
    fireEvent.change(input, { target: { value: 'sched' } });
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Standard')).not.toBeInTheDocument();
  });

  it('Enter selects the first matching entry', () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<CommandPalette open={true} onOpenChange={onOpenChange} entries={entries} onSelect={onSelect} />);
    const input = screen.getByLabelText('Search tabs');
    fireEvent.change(input, { target: { value: 'sched' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('scheduling');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render when closed', () => {
    render(<CommandPalette open={false} onOpenChange={() => {}} entries={entries} onSelect={() => {}} />);
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });
});

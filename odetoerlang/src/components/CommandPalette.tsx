import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';

export interface CommandEntry {
  id: string;
  name: string;
  hubName: string;
  description: string;
  icon: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: CommandEntry[];
  onSelect: (id: string) => void;
}

/**
 * Fuzzy / substring filter — case-insensitive, multi-token.
 * Each query token must match somewhere in `name + hubName + description`.
 * Higher scores rank above lower; 0 means "filtered out".
 */
function score(entry: CommandEntry, query: string): number {
  const trimmed = query.trim();
  if (!trimmed) return 1;

  const haystack = `${entry.name} ${entry.hubName} ${entry.description}`.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const tokens = lowerQuery.split(/\s+/).filter(Boolean);

  for (const t of tokens) {
    if (!haystack.includes(t)) return 0;
  }

  const lowerName = entry.name.toLowerCase();
  if (lowerName === lowerQuery) return 100;
  if (lowerName.startsWith(lowerQuery)) return 50;
  return 10;
}

export function CommandPalette({ open, onOpenChange, entries, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const ranked = useMemo(() => {
    return entries
      .map(e => ({ entry: e, score: score(e, query) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [entries, query]);

  useEffect(() => {
    if (activeIndex >= ranked.length) setActiveIndex(Math.max(0, ranked.length - 1));
  }, [ranked.length, activeIndex]);

  const choose = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(ranked.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(0, i - 1));
        break;
      case 'Enter': {
        e.preventDefault();
        const chosen = ranked[activeIndex];
        if (chosen) choose(chosen.entry.id);
        break;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} ariaLabel="Command palette">
      <DialogContent className="!max-w-xl !p-0 overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type to search tabs…"
            className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-base font-mono"
            aria-label="Search tabs"
          />
        </div>
        <ul role="listbox" aria-label="Available destinations" className="max-h-80 overflow-y-auto py-2">
          {ranked.length === 0 && (
            <li className="px-4 py-3 text-sm text-text-muted">No matches.</li>
          )}
          {ranked.map(({ entry }, i) => (
            <li
              key={entry.id}
              role="option"
              aria-selected={i === activeIndex}
              className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
                i === activeIndex ? 'bg-bg-elevated' : 'hover:bg-bg-elevated/50'
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => choose(entry.id)}
            >
              <span className="text-lg" aria-hidden="true">{entry.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-text-primary truncate">{entry.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">{entry.hubName}</span>
                </div>
                <p className="text-xs text-text-secondary truncate">{entry.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border-subtle px-4 py-2 text-[10px] uppercase tracking-wider text-text-muted flex justify-between font-mono">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>{ranked.length} of {entries.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

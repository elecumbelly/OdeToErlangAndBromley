# Project Architecture

Load this context when understanding project structure, module responsibilities, or file organization.

---

## Directory Structure

```
OdeToErlangAndBromley/
├── odetoerlang/              # Main application
│   ├── public/               # Static assets (wasm, etc.)
│   ├── src/
│   │   ├── components/       # UI Components (Flat structure + some folders)
│   │   │   ├── ui/           # Reusable atomic components (Button, Dialog, etc.)
│   │   │   ├── Calendar/     # Calendar specific components
│   │   │   └── ...           # Feature components (InputPanel, ResultsDisplay, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Core logic
│   │   │   ├── calculations/ # Erlang formulas & Engine
│   │   │   ├── database/     # SQLite (sql.js) abstraction & Schema
│   │   │   ├── forecasting/  # Forecasting logic
│   │   │   ├── services/     # Business logic services (CalculationService)
│   │   │   └── validation/   # Input validation rules
│   │   ├── store/            # Zustand state management
│   │   ├── styles/           # Tailwind config & tokens
│   │   ├── types/            # Global TypeScript definitions
│   │   ├── utils/            # Helper functions
│   │   ├── workers/          # Web Workers (CSV processing)
│   │   ├── App.tsx           # Main layout & routing
│   │   └── main.tsx          # Entry point
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/                     # Documentation
│   └── archive/              # Old planning docs
├── .claude/                  # AI context & commands
├── CLAUDE.md                 # Assistant instructions
├── GEMINI.md                 # Assistant memories
└── README.md                 # Project Overview
```

---

## Core Modules

### 1. Calculation Engine (`src/lib/calculations/`)

**Purpose:** Mathematically rigorous Erlang implementations.

| File | Function |
|------|----------|
| `erlangEngine.ts` | Unified entry point for all calculations |
| `erlangC.ts` | Queue with infinite patience (Standard) |
| `erlangA.ts` | Queue with abandonment (Patience-based) |
| `erlangB.ts` | Blocking probability (No queue) |
| `erlangX.ts` | Advanced model with retrials (Internal use) |

**Key Principle:** Pure functions, no side effects, heavy unit testing.

### 2. Database Layer (`src/lib/database/`)

**Tech:** `sql.js` (SQLite in WASM) + `idb` (IndexedDB persistence).

**Purpose:** "Headless" backend running entirely in the browser.

- `schema.sql`: Defines the 31-table relational schema (v4).
- `dataAccess/`: Per-domain typed CRUD modules (campaigns, scenarios, contracts, historical, staffing, etc.) plus `_shared.ts` helpers. `dataAccess.ts` is the barrel re-export — import from there.
- `initDatabase.ts`: Handles WASM loading, schema migrations (with BEGIN/COMMIT/ROLLBACK), and IndexedDB persistence.

### 3. State Management (`src/store/`)

**Tech:** Zustand.

- `calculatorStore.ts`: Transient UI state for the Calculator tab. Delegates logic to `CalculationService`.
- `databaseStore.ts`: Syncs DB tables (Campaigns, Scenarios) with UI.

### 4. UI Components (`src/components/`)

**Structure:** Mostly flat, moving towards feature folders.

- `InputPanel.tsx`: Main calculator inputs.
- `ResultsDisplay.tsx`: KPI cards and summary.
- `CalendarView.tsx`: FullCalendar integration.
- `SmartCSVImport.tsx`: Web-worker powered CSV parsing.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 (Vite) |
| Language | TypeScript 5.x |
| Database | SQLite (sql.js) |
| State | Zustand |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Calendar | FullCalendar |
| Testing | Vitest |

---

## Key Patterns

### Calculation Service
Business logic is separated from the UI and Store.
```typescript
// src/lib/services/CalculationService.ts
class CalculationService {
  static calculate(inputs, constraints) {
    // Validation
    // Model Selection
    // Execution
    return results;
  }
}
```

### Database Access
Direct SQL execution via typed helpers, organised per domain under `dataAccess/`.
```typescript
// src/lib/database/dataAccess/campaigns.ts (re-exported via dataAccess.ts barrel)
export function getCampaigns() {
  const db = getDatabase();
  return execToArray<Campaign>(db.exec('SELECT * FROM Campaigns...'));
}
```
Shared helpers (`execToArray`, `getScalar`, `buildUpdateClause`, `getLastInsertId`) live in `dataAccess/_shared.ts`.

### Error Handling
- **UI:** React Error Boundaries wrap major tabs.
- **Stores:** User-facing errors are sanitized.
- **Database:** Transactions used for batch operations.
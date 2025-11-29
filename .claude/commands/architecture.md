# Project Architecture

Load this context when understanding project structure, module responsibilities, or file organization.

---

## Directory Structure

```
OdeToErlang/
├── odetoerlang/              # Main application
│   ├── public/               # Static assets
│   │   ├── index.html        # HTML entry point
│   │   └── favicon.ico       # App icon
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── import/       # CSV import components
│   │   │   ├── configuration/# Parameter editors
│   │   │   ├── calculations/ # Calculation displays
│   │   │   ├── results/      # Results visualization
│   │   │   ├── export/       # Export functionality
│   │   │   └── help/         # Help system components
│   │   ├── lib/              # Core libraries
│   │   │   ├── calculations/ # Erlang formulas
│   │   │   │   ├── erlangB.ts
│   │   │   │   ├── erlangC.ts
│   │   │   │   ├── erlangA.ts
│   │   │   │   └── erlangX.ts
│   │   │   ├── parsers/      # CSV parsing
│   │   │   ├── models/       # Data models
│   │   │   └── utils/        # Utilities
│   │   ├── content/          # Help content
│   │   │   ├── glossary.json
│   │   │   ├── tooltips.json
│   │   │   └── tutorials/
│   │   ├── styles/           # CSS/styling
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── tests/                # Test files
│   ├── package.json          # Dependencies
│   └── vite.config.ts        # Vite config
├── .claude/                  # Claude Code config
│   ├── commands/             # Slash commands
│   └── settings.local.json   # Local settings
├── CLAUDE.md                 # AI assistant context
├── README.md                 # Human documentation
└── LICENSE                   # MIT License
```

---

## Core Modules

### 1. Calculation Engine (`src/lib/calculations/`)

**Purpose:** Mathematically correct Erlang implementations

| File | Function |
|------|----------|
| `erlangB.ts` | Blocking probability (no queue) |
| `erlangC.ts` | Queue with infinite patience |
| `erlangA.ts` | Queue with abandonment |
| `erlangX.ts` | Advanced model with retrials |
| `serviceLevels.ts` | SLA, ASA, occupancy calculations |

**Key Principle:** Pure functions, no side effects, fully tested.

### 2. Data Management (`src/lib/parsers/`, `src/lib/models/`)

**Parsers:**
- CSV parsing and validation
- Data normalization
- Format detection

**Models:**
- TypeScript interfaces for all data types
- State management types
- Configuration schemas

### 3. UI Components (`src/components/`)

**Import:**
- Drag-and-drop CSV upload
- Data preview tables
- Validation feedback

**Configuration:**
- Editable assumption panels
- SLA target editors
- Shrinkage breakdown

**Results:**
- Charts (staffing curves, service levels)
- Tables (interval breakdown)
- Summary cards

**Export:**
- CSV export
- PDF generation
- Excel export

### 4. Help System (`src/components/help/`)

- `Tooltip.tsx` - Contextual tooltips
- `Glossary.tsx` - Searchable glossary
- `Tutorial.tsx` - Step-by-step guides
- `HelpSearch.tsx` - Help search

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18+ |
| Language | TypeScript |
| Build | Vite |
| Testing | Vitest |
| Styling | Tailwind CSS / CSS Modules |
| Charts | Recharts / Chart.js |
| CSV | Papa Parse |
| State | React Context / Zustand |

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ServiceLevelChart.tsx` |
| Utilities | camelCase | `formatNumber.ts` |
| Tests | `.test.ts` suffix | `erlangC.test.ts` |
| Types | PascalCase | `CalculationResult.ts` |
| CSS Modules | camelCase | `dashboard.module.css` |

---

## Component Patterns

### Standard Component Structure
```typescript
// ComponentName.tsx
import { FC } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Props with explicit types
}

export const ComponentName: FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // Hooks at top
  // Event handlers
  // Render
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
};
```

### Calculation Function Pattern
```typescript
// Pure function, no side effects
export function calculateServiceLevel(
  agents: number,
  trafficIntensity: number,
  aht: number,
  threshold: number
): number {
  // Validation
  if (agents <= 0) throw new Error('Agents must be positive');

  // Calculation
  const result = /* ... */;

  // Return typed result
  return result;
}
```

---

## Data Flow

```
CSV Import → Parser → Validation → State → Calculations → Results
                                      ↑
                          Configuration Panel
```

1. User imports CSV or enters data
2. Parser normalizes and validates
3. State stores current configuration
4. Calculations run on state changes
5. Results render in real-time

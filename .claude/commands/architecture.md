# System Architecture & File Structure

**Auto-loaded when:** Working on system design, module organization, file structure, architecture decisions

---

## Current Project State

### Existing Files
```
OdeToErlang/
├── LICENSE                  # MIT License, Copyright 2025 SteS
├── CLAUDE.md                # AI assistant guide (streamlined)
├── .claude/
│   ├── commands/            # Detailed documentation (this file is here!)
│   │   ├── architecture.md
│   │   ├── erlang-formulas.md
│   │   ├── contact-center-domain.md
│   │   ├── conventions.md
│   │   ├── csv-formats.md
│   │   ├── help-system-design.md
│   │   └── implementation-phases.md
│   └── MIGRATION_PLAN.md    # Documentation restructuring plan
```

**Status:** Initial development phase - minimal files, ready for implementation

---

## Target Application Structure

### Full Directory Layout
```
OdeToErlang/
├── public/                          # Static assets
│   ├── index.html                  # Main HTML entry point
│   ├── favicon.ico                 # App icon
│   └── assets/                     # Images, fonts, static files
│       ├── images/
│       ├── fonts/
│       └── icons/
│
├── src/                            # Source code
│   ├── components/                 # UI components (organized by feature)
│   │   ├── import/                 # CSV import functionality
│   │   │   ├── CSVUpload.jsx      # Drag-and-drop upload
│   │   │   ├── DataPreview.jsx    # Preview uploaded data
│   │   │   ├── ValidationErrors.jsx # Show import errors
│   │   │   └── ImportWizard.jsx   # Step-by-step import guide
│   │   │
│   │   ├── configuration/          # Parameter/assumption editors
│   │   │   ├── ServiceLevelConfig.jsx    # SLA target settings
│   │   │   ├── ShrinkageConfig.jsx       # Shrinkage breakdown
│   │   │   ├── OccupancyConfig.jsx       # Occupancy targets
│   │   │   ├── FormulaSelector.jsx       # Choose Erlang B/C/A/X
│   │   │   └── AssumptionsPanel.jsx      # Main config container
│   │   │
│   │   ├── calculations/           # Calculation display
│   │   │   ├── CalculationSteps.jsx      # Show formula steps
│   │   │   ├── TrafficIntensity.jsx      # Display Erlangs
│   │   │   ├── AgentRequirement.jsx      # Show agent count
│   │   │   └── LiveCalculator.jsx        # Real-time recalc
│   │   │
│   │   ├── results/                # Results visualization
│   │   │   ├── StaffingTable.jsx         # Interval-by-interval FTE
│   │   │   ├── ServiceLevelChart.jsx     # SL over time
│   │   │   ├── OccupancyChart.jsx        # Occupancy visualization
│   │   │   ├── CostProjection.jsx        # Cost analysis
│   │   │   └── Dashboard.jsx             # Main results view
│   │   │
│   │   ├── export/                 # Export functionality
│   │   │   ├── ExportCSV.jsx             # CSV export
│   │   │   ├── ExportPDF.jsx             # PDF reports
│   │   │   ├── ExportExcel.jsx           # Excel export
│   │   │   └── ReportBuilder.jsx         # Custom report creator
│   │   │
│   │   ├── help/                   # Help system components
│   │   │   ├── Tooltip.jsx               # Contextual tooltip
│   │   │   ├── Glossary.jsx              # Glossary sidebar/modal
│   │   │   ├── Tutorial.jsx              # Interactive tutorial
│   │   │   ├── HelpSearch.jsx            # Searchable help
│   │   │   └── EducationalMode.jsx       # Show formulas
│   │   │
│   │   └── common/                 # Shared/reusable components
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       ├── Modal.jsx
│   │       └── Card.jsx
│   │
│   ├── lib/                        # Core libraries (business logic)
│   │   ├── calculations/           # Erlang formulas (CRITICAL!)
│   │   │   ├── erlangB.js                # Erlang B implementation
│   │   │   ├── erlangC.js                # Erlang C implementation
│   │   │   ├── erlangA.js                # Erlang A implementation
│   │   │   ├── erlangX.js                # Erlang X implementation
│   │   │   ├── multiSkill.js             # Multi-skill routing
│   │   │   ├── serviceLevels.js          # SL, ASA calculations
│   │   │   ├── abandonment.js            # Abandonment modeling
│   │   │   ├── shrinkage.js              # Shrinkage calculations
│   │   │   └── index.js                  # Export all calculations
│   │   │
│   │   ├── parsers/                # CSV and data parsing
│   │   │   ├── csvParser.js              # Generic CSV parser
│   │   │   ├── volumeParser.js           # Parse volume data
│   │   │   ├── ahtParser.js              # Parse AHT data
│   │   │   ├── configParser.js           # Parse configuration
│   │   │   └── validators.js             # Data validation
│   │   │
│   │   ├── models/                 # Data models and state
│   │   │   ├── Interval.js               # Time interval model
│   │   │   ├── Channel.js                # Channel model
│   │   │   ├── Skill.js                  # Skill model
│   │   │   ├── Assumptions.js            # Configuration model
│   │   │   └── Results.js                # Calculation results model
│   │   │
│   │   ├── utils/                  # Utilities and helpers
│   │   │   ├── formatters.js             # Number/date formatting
│   │   │   ├── validators.js             # Input validation
│   │   │   ├── math.js                   # Math utilities
│   │   │   └── constants.js              # App constants
│   │   │
│   │   └── storage/                # Local storage/persistence
│   │       ├── localStorage.js           # Browser localStorage
│   │       ├── indexedDB.js              # IndexedDB (large data)
│   │       └── configManager.js          # Save/load configs
│   │
│   ├── content/                    # Help and training content
│   │   ├── glossary.json                 # Terminology definitions
│   │   ├── tooltips.json                 # Field-level help text
│   │   ├── tutorials/                    # Tutorial configurations
│   │   │   ├── quick-start.json
│   │   │   ├── csv-import.json
│   │   │   ├── multi-channel.json
│   │   │   └── comparing-formulas.json
│   │   ├── scenarios/                    # Example scenarios
│   │   │   ├── small-voice-queue.json
│   │   │   ├── multi-channel.json
│   │   │   └── high-volume-sales.json
│   │   └── faq.md                        # Frequently asked questions
│   │
│   ├── hooks/                      # Custom React hooks (if using React)
│   │   ├── useCalculation.js             # Calculation state hook
│   │   ├── useCSVImport.js               # CSV import hook
│   │   ├── useLocalStorage.js            # Persistence hook
│   │   └── useDebounce.js                # Debounce hook
│   │
│   ├── styles/                     # CSS/styling
│   │   ├── global.css                    # Global styles
│   │   ├── variables.css                 # CSS variables
│   │   ├── components/                   # Component-specific styles
│   │   └── themes/                       # Theme files (light/dark)
│   │
│   ├── App.jsx                     # Main application component
│   ├── App.css                     # App-level styles
│   └── index.js                    # Application entry point
│
├── tests/                          # Unit and integration tests
│   ├── unit/
│   │   ├── calculations/                 # Test Erlang formulas
│   │   │   ├── erlangC.test.js
│   │   │   ├── erlangA.test.js
│   │   │   └── serviceLevels.test.js
│   │   ├── parsers/                      # Test CSV parsing
│   │   │   └── csvParser.test.js
│   │   └── utils/                        # Test utilities
│   │       └── validators.test.js
│   ├── integration/
│   │   ├── csv-to-calculation.test.js    # Full flow test
│   │   └── export.test.js
│   └── fixtures/                         # Test data
│       ├── sample-volumes.csv
│       └── sample-aht.csv
│
├── docs/                           # User-facing documentation
│   ├── formulas.md                       # Mathematical formulas
│   ├── csv-formats.md                    # CSV specifications
│   ├── user-guide.md                     # End-user docs
│   └── api-reference.md                  # API docs (if needed)
│
├── examples/                       # Sample CSV files
│   ├── sample-volumes.csv
│   ├── sample-aht.csv
│   ├── sample-shrinkage.csv
│   └── sample-config.json
│
├── .github/                        # GitHub configuration
│   └── workflows/
│       ├── test.yml                      # Run tests on PR
│       └── deploy.yml                    # Deploy to GitHub Pages
│
├── .claude/                        # Claude Code configuration
│   └── commands/                         # Documentation commands
│
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Build tool config (if Vite)
├── vitest.config.js                # Test config (if Vitest)
├── LICENSE                         # MIT License
├── README.md                       # User-facing documentation
└── CLAUDE.md                       # AI assistant guide
```

---

## Module Organization

### Core Calculation Engine (`src/lib/calculations/`)

**Purpose:** Pure functions for mathematical calculations
**Principles:**
- No UI dependencies
- Fully testable in isolation
- Side-effect free (pure functions)
- Well-documented with formulas

**Example Structure:**
```javascript
// src/lib/calculations/erlangC.js

/**
 * Calculate Erlang C probability (probability of waiting)
 * Uses iterative method to avoid factorial overflow
 *
 * @param {number} agents - Number of agents available
 * @param {number} trafficIntensity - Traffic intensity in Erlangs
 * @returns {number} Probability of waiting (0-1)
 */
export function erlangC(agents, trafficIntensity) {
  // Implementation
}

/**
 * Calculate service level for given staffing
 *
 * @param {number} agents - Number of agents
 * @param {number} trafficIntensity - Traffic in Erlangs
 * @param {number} aht - Average Handle Time (seconds)
 * @param {number} threshold - Time threshold (seconds)
 * @returns {number} Service level percentage (0-1)
 */
export function serviceLevel(agents, trafficIntensity, aht, threshold) {
  // Implementation
}

/**
 * Solve for minimum agents to meet service level target
 *
 * @param {number} trafficIntensity - Traffic in Erlangs
 * @param {number} aht - Average Handle Time (seconds)
 * @param {number} targetSL - Target service level (0-1)
 * @param {number} threshold - Time threshold (seconds)
 * @returns {number|null} Minimum agents, or null if impossible
 */
export function solveAgents(trafficIntensity, aht, targetSL, threshold) {
  // Implementation
}
```

### Data Parsers (`src/lib/parsers/`)

**Purpose:** Parse and validate CSV files and user input
**Principles:**
- Flexible column naming
- Clear error messages
- Type validation
- Range checking

**Example:**
```javascript
// src/lib/parsers/volumeParser.js

/**
 * Parse volume CSV data
 *
 * Expected columns: Date, Time, Channel, Skill, Volume
 * (case-insensitive, flexible naming)
 *
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} { data: Array, errors: Array }
 */
export function parseVolumeCSV(csvContent) {
  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader
  });

  const validatedData = [];
  const validationErrors = [];

  data.forEach((row, index) => {
    const validation = validateVolumeRow(row);
    if (validation.valid) {
      validatedData.push(normalizeVolumeRow(row));
    } else {
      validationErrors.push({
        row: index + 2, // +2 for header and 0-index
        errors: validation.errors
      });
    }
  });

  return {
    data: validatedData,
    errors: [...errors, ...validationErrors]
  };
}
```

### Data Models (`src/lib/models/`)

**Purpose:** Define data structures and business logic
**Principles:**
- Encapsulate data
- Validation in constructors
- Immutable where possible
- Clear interfaces

**Example:**
```javascript
// src/lib/models/Assumptions.js

export class Assumptions {
  constructor({
    serviceLevelTarget = 0.80,
    serviceLevelThreshold = 20,
    shrinkage = 0.25,
    occupancy = 0.85,
    formulaType = 'erlangC',
    intervalMinutes = 30
  } = {}) {
    this.validate({ serviceLevelTarget, shrinkage, occupancy });

    this.serviceLevelTarget = serviceLevelTarget;
    this.serviceLevelThreshold = serviceLevelThreshold;
    this.shrinkage = shrinkage;
    this.occupancy = occupancy;
    this.formulaType = formulaType;
    this.intervalMinutes = intervalMinutes;
  }

  validate({ serviceLevelTarget, shrinkage, occupancy }) {
    if (serviceLevelTarget < 0 || serviceLevelTarget > 1) {
      throw new Error('Service level must be between 0 and 1');
    }
    if (shrinkage < 0 || shrinkage >= 1) {
      throw new Error('Shrinkage must be between 0 and 1 (exclusive)');
    }
    if (occupancy < 0 || occupancy > 1) {
      throw new Error('Occupancy must be between 0 and 1');
    }
  }

  toJSON() {
    return { ...this };
  }
}
```

### UI Components (`src/components/`)

**Purpose:** User interface elements
**Principles:**
- Single responsibility
- Reusable where possible
- Separated presentation and logic
- Accessible (ARIA labels, keyboard nav)

**Component Hierarchy:**
```
App
├── Header
├── ImportSection
│   ├── CSVUpload
│   ├── DataPreview
│   └── ValidationErrors
├── ConfigurationSection
│   └── AssumptionsPanel
│       ├── ServiceLevelConfig
│       ├── ShrinkageConfig
│       └── FormulaSelector
├── CalculationSection
│   ├── LiveCalculator
│   └── CalculationSteps
└── ResultsSection
    ├── Dashboard
    │   ├── StaffingTable
    │   ├── ServiceLevelChart
    │   └── OccupancyChart
    └── ExportOptions
```

---

## Data Flow Architecture

### Unidirectional Data Flow
```
User Input (CSV/Config)
    ↓
Parse & Validate
    ↓
Store in State
    ↓
Calculate (when state changes)
    ↓
Update Results State
    ↓
Re-render UI
```

### State Management Options

**Option 1: React Context API (Simple)**
```javascript
// src/context/CalculationContext.js
const CalculationContext = createContext();

export function CalculationProvider({ children }) {
  const [volumes, setVolumes] = useState([]);
  const [assumptions, setAssumptions] = useState(new Assumptions());
  const [results, setResults] = useState(null);

  // Recalculate when volumes or assumptions change
  useEffect(() => {
    const newResults = calculateStaffing(volumes, assumptions);
    setResults(newResults);
  }, [volumes, assumptions]);

  return (
    <CalculationContext.Provider value={{ volumes, assumptions, results, setVolumes, setAssumptions }}>
      {children}
    </CalculationContext.Provider>
  );
}
```

**Option 2: Zustand (Cleaner)**
```javascript
// src/store/calculationStore.js
import create from 'zustand';

export const useCalculationStore = create((set, get) => ({
  volumes: [],
  assumptions: new Assumptions(),
  results: null,

  setVolumes: (volumes) => {
    set({ volumes });
    get().recalculate();
  },

  setAssumptions: (assumptions) => {
    set({ assumptions });
    get().recalculate();
  },

  recalculate: () => {
    const { volumes, assumptions } = get();
    const results = calculateStaffing(volumes, assumptions);
    set({ results });
  }
}));
```

---

## Build and Deployment

### Development Server
```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src",
    "format": "prettier --write src"
  }
}
```

### Deployment Target
**GitHub Pages (Recommended for 100% client-side app):**
- Free hosting
- Automatic HTTPS
- Custom domain support
- Simple CI/CD with GitHub Actions

**Deploy Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Technology Stack Decisions

### Framework Selection Criteria

**React:**
- ✅ Most popular, largest ecosystem
- ✅ Excellent TypeScript support
- ✅ Great charting libraries (Recharts)
- ❌ Larger bundle size
- ❌ More boilerplate

**Vue:**
- ✅ Easier learning curve
- ✅ Great documentation
- ✅ Single-file components
- ❌ Smaller ecosystem than React
- ⚠️ TypeScript support improving

**Svelte:**
- ✅ Smallest bundle size
- ✅ Best performance
- ✅ Least boilerplate
- ❌ Smaller ecosystem
- ❌ Fewer chart libraries

**Recommendation:** React (if team knows it) or Svelte (for best performance)

### TypeScript vs JavaScript

**TypeScript Benefits:**
- ✅ Catch math errors at compile time
- ✅ Better IDE autocomplete
- ✅ Self-documenting interfaces
- ✅ Safer refactoring

**Recommendation:** Use TypeScript for calculation modules, optional for UI

---

## Security Considerations

### Client-Side Only Architecture
**Advantages:**
- No backend to secure
- No database vulnerabilities
- No authentication needed
- Simpler deployment

**Security Measures:**
- ✅ Validate all user input (CSV data)
- ✅ Sanitize any rendered user content (prevent XSS)
- ✅ Use HTTPS (automatic with GitHub Pages)
- ✅ No sensitive data stored (all calculations local)

### CSV Import Security
```javascript
// Validate file size before parsing
if (file.size > 10 * 1024 * 1024) { // 10MB limit
  throw new Error('File too large');
}

// Sanitize column headers
function sanitizeHeader(header) {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 50); // Limit length
}

// Validate numeric ranges
function validateVolume(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0 || num > 1000000) {
    throw new Error('Invalid volume');
  }
  return num;
}
```

---

## Performance Optimization

### Calculation Caching
```javascript
// Memoize expensive calculations
import memoize from 'lodash/memoize';

const memoizedErlangC = memoize(
  (agents, traffic) => erlangC(agents, traffic),
  (agents, traffic) => `${agents}-${traffic}` // Cache key
);
```

### Web Workers for Heavy Calculations
```javascript
// src/workers/erlangX-worker.js
self.addEventListener('message', (e) => {
  const { agents, traffic, theta } = e.data;
  const result = erlangX(agents, traffic, theta);
  self.postMessage(result);
});

// In component
const worker = new Worker(new URL('./workers/erlangX-worker.js', import.meta.url));
worker.postMessage({ agents, traffic, theta });
worker.onmessage = (e) => setResults(e.data);
```

---

**Key Architectural Principles:**
1. **Separation of Concerns:** UI ↔ Logic ↔ Data
2. **Pure Functions:** Calculations have no side effects
3. **Testability:** Every module can be tested in isolation
4. **Progressive Enhancement:** Start simple (Erlang C), add complexity later
5. **Client-Side First:** No backend required for MVP

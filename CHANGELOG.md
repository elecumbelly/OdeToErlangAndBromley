# Changelog

All notable changes to OdeToErlangAndBromley will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-05-15

### Added
- Soft-delete (`deleted_at`) on Scenarios and CalendarEvents; SELECTs filter active rows.
- BroadcastChannel cross-tab calendar sync with origin-tab echo guard.
- Cmd/Ctrl+K command palette with fuzzy filter over 17 destinations.
- Cross-tab KPI aria-live regions and `jsx-a11y` ESLint plugin (warn-level groundwork).
- Diagnostics surface for stationarity assumption with UI badge in `ResultsDisplay`.
- DES-backed sanity harness replacing the fake Monte Carlo.

### Changed
- **Brand:** in-app runtime identifiers renamed `odetoerlang` → `odetoerlangandbromley` (IndexedDB DB_NAME, BroadcastChannel name on both sites, Zustand persist store, 4 export filename prefixes, browser title, splash, README brand). Hard rename, no migration shim — existing-user local DBs are not carried across. `LEGACY_KEY = 'odetoerlang_db'` deliberately preserved in `storage.ts` as the migration-shim pointer to the historical localStorage name.
- **TypeScript strict mode:** `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` both enabled in `tsconfig.app.json`. Fixed all 137 unique resulting errors across 25+ files using non-null assertions (`arr[i]!`) or explicit `?? 0`/`?.` fallbacks where appropriate. Math behaviour preserved (in particular Holt-Winters multiplicative-mode `prevSeasonal` fallback intentionally keeps `||` rather than `??` to guard against zero-seasonal-index divide-by-zero).
- **Erlang B** switched to log-stable inverse recurrence (stays finite at A=5000+ where the prior iterative form underflowed past A~100). `erlangBLinear` kept as parity reference.
- **Concurrency** now applies a configurable overhead curve (default 15%) instead of a naive linear AHT divide; `effectiveAHTForConcurrency` exposed.
- **Occupancy penalty inverted** to `occupancyViolationSeverity` so SL falls and ASA climbs as understaffing worsens. `occupancyPenalty` remains as a deprecated alias for one release.
- **Shrinkage × productivity** now coherent: `effectiveAgents = headcount × (1 − shrinkage/100) × productivity`.
- Calculator store decoupled from `databaseStore`; productivity provider injected at boot via `setProductivityProvider`.
- `saveDatabase()` uses a soft mutex preventing mid-write export snapshots.
- DB migrations wrapped in BEGIN/COMMIT/ROLLBACK with version bump inside the transaction.
- Composite indexes: `HistoricalData(campaign_id,date)`, `Forecasts(scenario_id,campaign_id,forecast_date)`, `CalendarEvents(campaign_id,start,end)`.
- Dialog: focus trap, Esc-to-close, focus restoration, `role="dialog"`.
- Chart theming via new `useChartTheme` hook reading CSS variables (no more hardcoded hex).
- CSV worker: 10s per-attempt timeout, one retry, structured fallback log, main-thread fallback preserved.

### Fixed
- `getBaselineScenario` missing `deleted_at IS NULL` filter (surfaced soft-deleted baselines).
- SQL injection in `getRecruitmentRequests` count query (`status` now passes through a bound parameter).
- All 94 outstanding `jsx-a11y` warnings; rules promoted from `warn` to `error`.

### Removed
- 14 unused source files (~1893 LOC): `ACDImport.tsx`, `CSVImport.tsx`, `ResultsCharts.tsx`, `CampaignSelector.tsx`, `HelpTooltip.tsx`, `glossary.ts`, `ui/Alert.tsx`, `ui/Skeleton.tsx`, `ui/index.ts`, `hooks/useStatusColor.ts`, `lib/forecasting/forecastEngine.ts`, `styles/tokens.ts`, `utils/colors.ts`, `utils/formatting.ts`. All were orphans (no inbound imports). Active import flow is `SmartCSVImport`.
- Stale path-header comments at the top of `erlangB.ts` and `erlangEngine.ts` (project convention: no self-locating path comments — they rot when the file moves).
- Duplicate `default` export on `ui/CwfLogo.tsx` (only the named export is consumed).
- Unused `@radix-ui/react-tooltip` dependency.
- Unused `decimal.js` dependency.
- Unused `@testing-library/user-event` devDependency.

### Security
- Bumped `lodash` to `^4.18.1` via npm `overrides` (was transitively pinned at `4.17.21` through `recharts` and `workbox-build`). Clears Prototype-Pollution and `_.template` code-injection advisories on the lockfile.

### Rollback note
Reverting after a user has reached v4 schema will resurrect soft-deleted scenarios and calendar events because v3 `dataAccess` lacks the `deleted_at IS NULL` filter. No data loss; user-visible regression. Document in release notes if downgrade is ever needed.

## [0.2.2] - 2026-02

### Fixed
- **P1**: Shrinkage double-count in coverage generator (was using `totalFTE` instead of `requiredAgents`).
- **P1**: Misleading scheduler method descriptions.
- **P2**: Concurrency now wired into `erlangEngine` (was accepted but ignored).
- **P2**: CSV date-format support (MM/DD/YYYY, MM-DD-YYYY) with roundtrip validation.
- **P2**: Timezone-unsafe dates across 20+ files; centralized on new `dateUtils` module.
- **P2**: What-if scenarios were hardcoded to Erlang C — now routes through `erlangEngine` respecting the active model.
- **P2**: Added concurrency validation and upper-bound clamping (max 10).
- **P3**: SLA/occupancy unit mismatch in ScenarioManager (was dividing by 100 before saving when DB expects 0–100).

### Changed
- Security and crash-resilience pass from CodeRabbit scan: path traversal, SSRF, credential leakage, XSS, input validation, null guards, division by zero, timeout handling, session leaks, race conditions, error propagation.

### Docs
- Corrected Erlang A formula in `FORMULAS.md`.
- Fixed React version and test counts in READMEs.
- Updated `CSV-FORMATS.md` with supported date formats.
- Updated `SCHEDULING.md` method descriptions.

## [0.2.1] - 2026-01

### Added
- Simple Mode landing page and mode toggle for new users.
- Basic/Scientific mode tabs in Simulation Controls.
- Dashboard test coverage.

### Changed
- Consolidated navigation into 6 functional Hubs with sub-tabs.
- Modernized SimulationTab and QueueVisual with glassmorphism UI.
- Simplified ControlsPanel with Volume/AHT inputs.
- Replaced busy dashboard with clean KPI launchpad.

### Removed
- Redundant hero section from calculator tab.
- 1-2-3 onboarding banner.

### Docs
- Added explicit tribute to Lester Bromley and his Erlang for Excel plugin.

## [0.2.0] - 2025-12-08

### Added
- Universal CSV importer with smart column mapping
- Educational mode with formula breakdowns
- Comprehensive documentation (README, CONTRIBUTING, FORMULAS, CSV-FORMATS)
- Model comparison tool (Erlang B vs C vs A)
- Capacity planning (reverse calculator)
- Multi-channel support with concurrency handling
- What-if scenario analysis
- Interactive charts and analytics
- **Calendar and Scheduling UI**
- **React Error Boundary**
- **GitHub Actions CI**

### Changed
- Improved Erlang C edge case handling for low volume scenarios
- Enhanced shrinkage calculations in scenario comparison
- Optimized mathematical formula implementations
- **Refactored Erlang Model types (ErlangModel -> ErlangVariant)**
- **Removed Erlang X UI/model (legacy X now maps to Erlang A)**
- **Extracted CalculationService from store**
- **Sanitized user-facing error messages in store**
- **Removed module-level debounce singleton**
- **Updated theme for InitializationProgress**

### Fixed
- Critical Erlang C edge case for low volume scenarios
- Shrinkage calculation bug in ScenarioComparison and MultiChannelPanel
- **Numerous TypeScript compilation errors (verbatimModuleSyntax, concurrency)**
- **Inconsistent ErlangModel/ErlangVariant usage**
- **Missing Dialog component**
- **SmartCSVImport avgVolume destructuring**
- **databaseStore getAssumptions parameter issue**

## [0.1.0] - 2025-01-23

### Added
- **Core Erlang Models**
  - Erlang C (infinite patience model)
  - Erlang A (with abandonment modeling)
  - Erlang X (most accurate, with retrials)
  - Model selector in InputPanel allowing users to choose calculation method

- **Mathematical Implementations**
  - Iterative Erlang C formula (factorial-safe)
  - Service level calculations (SL = % answered within threshold)
  - Average Speed of Answer (ASA)
  - Occupancy and utilization metrics
  - Traffic intensity calculations
  - FTE calculations with shrinkage
  - Abandonment probability (Erlang A)
  - Retrial modeling (Erlang X)
  - Virtual traffic calculations (Erlang X)

- **User Interface**
  - Main calculator with InputPanel and ResultsDisplay
  - Real-time calculation updates (auto-calculate on parameter change)
  - Responsive design with Tailwind CSS
  - Tab-based navigation (Calculator, Charts, Multi-Channel, etc.)
  - Professional gradient design with primary blue color scheme

- **Input Configuration**
  - Call volume per interval
  - Average Handle Time (AHT) in seconds
  - Interval length (15, 30, or 60 minutes)
  - Service level target (% and threshold in seconds)
  - Shrinkage percentage
  - Maximum occupancy target
  - Average customer patience (for Erlang A/X)
  - Model selection (C, A, or X)

- **Results Display**
  - Traffic intensity (Erlangs)
  - Required agents
  - Total FTE with shrinkage
  - Achieved service level
  - Average Speed of Answer (ASA)
  - Agent occupancy
  - Abandonment metrics (for Erlang A/X)
  - Color-coded status indicators (meeting/missing targets)

- **Multi-Channel Support**
  - Voice, Email, Chat, Video, Social Media, Custom channels
  - Channel-specific configurations (AHT, target SL, concurrency)
  - Blended agent calculations
  - Total FTE across all channels
  - Channel-by-channel breakdowns

- **Charts & Analytics**
  - Service level vs. agents curve (sensitivity analysis)
  - Cost vs. service level trade-off
  - Occupancy by agent count
  - Intraday volume distribution
  - Interactive Recharts visualizations

- **Scenario Comparison**
  - Create up to 3 what-if scenarios
  - Side-by-side parameter comparison
  - Results comparison table
  - Scenario cloning and reset
  - Visual difference highlighting

- **Model Comparison**
  - Side-by-side Erlang C vs A vs X results
  - Accuracy difference analysis
  - Mathematical insights and recommendations
  - Use case guidance for each model

- **Capacity Planning (Reverse Calculator)**
  - Enter available agents/seats to see achievable SL
  - Surplus/deficit analysis vs. optimal staffing
  - Seat utilization metrics
  - Model selection (C, A, or X)
  - Capacity insights and recommendations

- **CSV Import** (Legacy)
  - ACDImport for standard ACD exports
  - Basic CSVImport component
  - Note: These are superseded by SmartCSVImport

- **Export Functionality**
  - Export results to CSV
  - Export configuration to JSON
  - Print-friendly layouts

- **Educational Mode**
  - Step-by-step formula explanations
  - Erlang C, A, and X documentation
  - Mathematical notation and examples
  - Historical context (tribute to A.K. Erlang)
  - Key concept definitions
  - Use case guidance
  - Common mistakes and best practices

- **State Management**
  - Zustand store for calculator state
  - Persistent inputs across tab navigation
  - Auto-calculation on parameter changes
  - Model-specific calculation dispatch
  - Abandonment metrics tracking (for Erlang A/X)

- **TypeScript Types**
  - ErlangModel type ('erlangC' | 'erlangA' | 'erlangX')
  - CalculationInputs interface
  - CalculationResults interface
  - Full type safety across the application

- **Developer Experience**
  - React 18 with TypeScript
  - Vite build system
  - Tailwind CSS for styling
  - ESLint configuration
  - Hot module replacement
  - Component-based architecture

### Technical Details

**Erlang C Implementation:**
- Iterative calculation method avoiding factorial overflow
- Edge case handling (zero volume, unstable queues, single agent)
- Clamped results to valid [0, 1] range
- Special handling for M/M/1 queues
- Validated against published Erlang C tables

**Erlang A Enhancements:**
- Patience parameter (theta = average patience / AHT)
- Abandonment probability calculations
- Expected abandonments in queue
- Answered contacts calculation
- Service level adjusted for abandonment

**Erlang X Features:**
- Equilibrium abandonment solver
- Retrial probability modeling
- Virtual traffic calculations
- Most accurate staffing predictions (±2% vs ±10-15% for Erlang C)

**Performance Optimizations:**
- Memoized calculations where appropriate
- Efficient iterative algorithms
- Minimal re-renders with proper React patterns

### Known Limitations

- CSV import does not yet update calculator inputs automatically
- No historical trend analysis
- No forecasting algorithms (moving average, regression, seasonality)
- No shift scheduling/rostering
- Single-language only (no i18n)
- Desktop-focused (mobile responsive but not optimized)

### Dependencies

**Production:**
- react: ^18.3.1
- react-dom: ^18.3.1
- zustand: ^5.0.2
- recharts: ^2.15.0
- papaparse: ^5.4.1
- date-fns: ^4.1.0
- lucide-react: ^0.468.0

**Development:**
- typescript: ~5.6.2
- vite: ^7.2.4
- tailwindcss: ^3.4.17
- @vitejs/plugin-react: ^4.3.4
- eslint: ^9.17.0

### Browser Support

- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### File Structure

```
odetoerlang/
├── src/
│   ├── components/
│   │   ├── ACDImport.tsx
│   │   ├── CSVImport.tsx
│   │   ├── SmartCSVImport.tsx (NEW)
│   │   ├── ChartsPanel.tsx
│   │   ├── EducationalMode.tsx
│   │   ├── ExportPanel.tsx
│   │   ├── InputPanel.tsx
│   │   ├── ModelComparison.tsx
│   │   ├── MultiChannelPanel.tsx
│   │   ├── ResultsDisplay.tsx
│   │   ├── ReverseCalculator.tsx
│   │   └── ScenarioComparison.tsx
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── erlangA.ts
│   │   │   ├── erlangC.ts
│   │   │   ├── erlangX.ts
│   │   │   └── multiChannel.ts
│   │   └── utils/
│   │       └── index.ts
│   ├── store/
│   │   └── calculatorStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Credits

**Mathematical Foundations:**
- A.K. Erlang (1878-1929) - Original Erlang B and C formulas (1917)
- Garnett, Mandelbaum & Reiman - Erlang A model (2002)
- Janssen, Koole & Pot - Erlang X model (2011)

**Implementation:**
- Copyright 2025 SteS
- MIT License

---

## Version History

- **[0.1.0]** - 2025-01-23 - Initial release with Erlang C, A, X models
- **[Unreleased]** - Active development

---

## Upgrade Guide

### From 0.0.x to 0.1.0

This is the initial public release. No upgrade path needed.

---

## Future Roadmap

See [README.md](README.md#-roadmap) for planned features.

### Planned for 0.2.0
- [ ] Historical data analysis with trend detection
- [ ] Advanced forecasting algorithms
- [ ] Real-time data feeds (WebSocket/API)
- [ ] Performance optimizations for large datasets

### Planned for 0.3.0
- [ ] Shift scheduling/rostering
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)

### Planned for 1.0.0
- [ ] Cloud save/sync (optional, privacy-preserving)
- [ ] Integration with popular WFM tools
- [ ] Enterprise features (team collaboration, audit logs)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## License

MIT License - Copyright 2025 SteS

See [LICENSE](LICENSE) for full text.

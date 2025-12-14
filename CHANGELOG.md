# Changelog

All notable changes to OdeToErlangAndBromley will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

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

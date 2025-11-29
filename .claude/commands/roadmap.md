# Development Roadmap

Load this context when planning features or understanding development priorities.

---

## Phase 1: Foundation (Erlang C)

### Core Deliverables
- [ ] Project setup (Vite + React + TypeScript)
- [ ] **Erlang C formula implementation**
  - Iterative calculation (avoid factorial overflow)
  - Service level: P(wait > t)
  - ASA calculation
  - Agent requirement solver
- [ ] Simple UI for single-skill voice calculations
- [ ] Basic CSV import for volume data
- [ ] **Unit tests against published Erlang C tables**

### Help System Foundation
- [ ] Tooltip component with hover/click
- [ ] Info icons next to input fields
- [ ] Initial glossary content
- [ ] Field-level help text

---

## Phase 2: Configuration & Multi-Channel

### Core Deliverables
- [ ] Configurable assumptions panel
  - SLA targets
  - Shrinkage breakdown
  - Occupancy targets
- [ ] **Erlang B implementation** (blocking probability)
- [ ] Multi-channel support
  - Voice, email, chat, video, social
  - Channel-specific AHT
- [ ] Enhanced CSV import (AHT, shrinkage, SLA targets)
- [ ] Results visualization
  - Staffing curves
  - Service level charts
- [ ] Basic cost calculations

### Help System
- [ ] Interactive glossary with search
- [ ] "Quick Start" tutorial
- [ ] 2-3 example scenarios

---

## Phase 3: Erlang A & Advanced Calculations

### Core Deliverables
- [ ] **Erlang A implementation**
  - Patience parameter (θ)
  - Abandonment rate calculations
  - Adjusted service level predictions
- [ ] **Multi-skill routing calculations**
  - Skill-based distribution
  - Skill proficiency modeling
  - Agent overlap/blending
- [ ] Interval-based forecasting (15/30-minute intervals)
- [ ] Enhanced cost projections
- [ ] Occupancy dashboards
- [ ] **Formula selector:** User chooses B, C, or A

### Help System
- [ ] Educational mode ("Show Calculation Steps")
- [ ] Formula display with notation
- [ ] More tutorials (multi-channel, Erlang A vs C)
- [ ] 5-7 example scenarios

---

## Phase 4: Erlang X & Professional Features

### Core Deliverables
- [ ] **Erlang X implementation**
  - Virtual waiting time modeling
  - Retrial behavior parameters
  - Time-dependent abandonment
  - Equilibrium solver
- [ ] **Validation suite:** Compare B, C, A, X side-by-side
- [ ] Export to CSV, Excel, PDF
- [ ] Save/load configurations (localStorage/IndexedDB)
- [ ] What-if scenario comparison
- [ ] Mobile-responsive design
- [ ] Performance optimization (Web Workers)

### Help System
- [ ] "Need Help?" floating button
- [ ] Searchable help ("Ask a question...")
- [ ] Complete tutorial library (7+ topics)
- [ ] 10+ example scenarios
- [ ] FAQ section
- [ ] Help usage analytics

---

## Technical Decisions Needed

### Already Decided
- **Framework:** React
- **Language:** TypeScript
- **Build:** Vite
- **Testing:** Vitest

### Still TBD
- [ ] **Styling:** Tailwind CSS vs CSS Modules?
- [ ] **Charts:** Recharts vs Chart.js vs D3.js?
- [ ] **State Management:** Context API vs Zustand?
- [ ] **Decimal Library:** decimal.js vs big.js?
- [ ] **CSV Export:** Custom vs json2csv?
- [ ] **Tooltip Library:** Tippy.js vs Floating UI vs custom?
- [ ] **Tutorial System:** Intro.js vs Shepherd.js vs custom?

---

## Open Questions

### Product
- Real-time data feeds (WebSocket, API polling)?
- Forecasting algorithms (moving average, regression)?
- Shift scheduling beyond FTE calculations?
- Multi-language support?
- Dark mode?

### Technical
- Integration with external WFM tools?
- Historical scenario storage (database vs local)?
- WebAssembly for Erlang X performance?

---

## Quality Gates

Each phase should meet:
- [ ] All unit tests passing
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Code reviewed

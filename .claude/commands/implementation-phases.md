# Implementation Phases & Roadmap

**Auto-loaded when:** Planning features, discussing roadmap, making technical decisions

---

## Development Philosophy

**Principles:**
1. **Start Simple:** MVP with core functionality first
2. **Validate Early:** Test calculations against standards from day one
3. **Iterate Based on Feedback:** Real users drive priorities
4. **Progressive Enhancement:** Add complexity only when needed
5. **Maintain Quality:** Never sacrifice mathematical accuracy for speed

---

## Phase 1: Foundation (MVP)

**Goal:** Single-skill Erlang C calculator with basic UI

### Core Features
- [ ] **Erlang C Implementation**
  - Mathematically correct iterative calculation
  - Service level calculation (P(wait > t))
  - ASA (Average Speed of Answer) calculation
  - Agent requirement solver (find minimum agents for target SL)
  - **CRITICAL:** Validate against published Erlang C tables

- [ ] **Simple UI**
  - Single-page application
  - Manual input fields (no CSV yet)
  - Input validation with clear error messages
  - Real-time calculation on input change

- [ ] **Basic Configuration**
  - Volume input
  - AHT input (seconds)
  - Service level target (% and threshold)
  - Shrinkage percentage
  - Interval length (default 30 min)

- [ ] **Results Display**
  - Traffic intensity (Erlangs)
  - Agents required
  - Service level achieved
  - FTE with shrinkage
  - Simple text/table display

- [ ] **Initial Help System**
  - Tooltip component infrastructure
  - Info icons next to all input fields
  - Basic tooltips for core terms (SL, AHT, Shrinkage, FTE)
  - Glossary data structure (10-15 core terms)

- [ ] **Testing Foundation**
  - Unit tests for Erlang C calculations
  - Test against known results (published tables)
  - Edge case handling (zero volume, impossible SLA, etc.)

### Tech Stack Decisions Needed
- **Framework:** React / Vue / Svelte
- **Build Tool:** Vite (recommended) / Create React App
- **Styling:** CSS Modules / Tailwind / styled-components
- **Testing:** Vitest (recommended) / Jest

### Success Criteria
✅ Erlang C calculation accuracy within ±1% of published tables
✅ All core inputs have tooltips
✅ Results update in real-time as inputs change
✅ Edge cases handled gracefully
✅ 80%+ unit test coverage for calculations

### Estimated Complexity
**Medium** - Core math is well-defined, UI is straightforward

---

## Phase 2: Usability & Multi-Channel

**Goal:** Make the tool practical for real-world use

### Features
- [ ] **CSV Import**
  - Volume data import (date, time, channel, volume)
  - AHT configuration (by channel)
  - Data validation and error reporting
  - Sample template files
  - Preview before applying

- [ ] **Multi-Channel Support**
  - Define multiple channels (Voice, Chat, Email, etc.)
  - Channel-specific AHT
  - Channel-specific SLA targets
  - Separate calculations per channel
  - Combined FTE summary

- [ ] **Enhanced Configuration Panel**
  - Editable shrinkage breakdown (not just total %)
  - Occupancy target per channel
  - Cost per hour (for basic cost calculations)
  - Save/load configuration presets

- [ ] **Improved Results Visualization**
  - Basic charts (service level over time, staffing curve)
  - Interval-by-interval staffing table (if CSV imported)
  - Occupancy visualization
  - Cost projections

- [ ] **Erlang B Implementation** (Optional)
  - For blocking scenarios (trunk lines)
  - User can toggle between Erlang B and C
  - Educational comparison

- [ ] **Enhanced Help System**
  - Interactive glossary with search
  - Expand tooltip content (add examples, typical values)
  - "Quick Start" tutorial (5-7 steps)
  - 2-3 pre-loaded example scenarios
  - FAQ section (5-10 common questions)

### Tech Stack Additions
- **CSV Parsing:** Papa Parse
- **Charts:** Chart.js / Recharts / D3.js (decide based on framework)
- **State Management:** Context API / Zustand (if complexity warrants)

### Success Criteria
✅ CSV import works with flexible column naming
✅ Multi-channel calculations accurate
✅ Users can complete Quick Start tutorial successfully
✅ Example scenarios load and calculate correctly
✅ Glossary has 30+ terms with cross-linking

### Estimated Complexity
**Medium-High** - CSV parsing adds complexity, multi-channel requires careful state management

---

## Phase 3: Erlang A & Advanced Calculations

**Goal:** Improve accuracy with abandonment modeling

### Features
- [ ] **Erlang A Implementation**
  - Abandonment parameter (theta = patience / AHT)
  - Adjusted service level calculations
  - Abandonment rate input
  - Average patience time input
  - **Validate against Erlang A academic papers**

- [ ] **Formula Selector**
  - User chooses: Erlang B, C, or A
  - Side-by-side comparison mode
  - Explain differences in accuracy
  - Show when to use each

- [ ] **Multi-Skill Routing (Simplified)**
  - Define multiple skills per channel
  - Skill-based volume distribution
  - Basic skill overlap (% multi-skilled agents)
  - Proportional FTE allocation

- [ ] **Interval-Based Forecasting**
  - 15/30/60-minute interval support
  - Intraday patterns
  - Day-of-week patterns
  - Visual interval timeline

- [ ] **Enhanced Cost Calculations**
  - Labor cost (FTE × hourly rate × hours)
  - Overhead percentage
  - Technology cost per agent
  - Total cost of operation
  - Cost vs. service level trade-off chart

- [ ] **Export Functionality**
  - Export results to CSV
  - Export interval staffing table
  - Export cost breakdown
  - Print-friendly report view

- [ ] **Educational Mode Implementation**
  - Toggle "Show Calculation Steps"
  - Display formulas with mathematical notation
  - Explain which inputs affect which outputs
  - Link to academic references
  - Add 3-4 more tutorials (multi-channel, CSV import, comparing formulas)
  - Expand scenarios to 5-7 examples

### Tech Stack Additions
- **Decimal Math:** decimal.js or big.js (for financial precision)
- **PDF Export:** jsPDF (if PDF export added)
- **Excel Export:** xlsx or SheetJS (if Excel export added)

### Success Criteria
✅ Erlang A accuracy within ±5% of academic test cases
✅ Formula comparison shows clear differences
✅ Educational mode explains all calculation steps
✅ Multi-skill calculations reasonable (simplified model)
✅ Export formats validated (can re-import CSV)
✅ Tutorial library covers all major features

### Estimated Complexity
**High** - Erlang A requires numerical methods, multi-skill is conceptually complex

---

## Phase 4: Erlang X & Professional Features

**Goal:** Professional-grade accuracy and enterprise features

### Features
- [ ] **Erlang X Implementation**
  - Virtual waiting time modeling
  - Retrial behavior parameters
  - Time-dependent abandonment
  - Equilibrium solver for staffing
  - **Most computationally intensive**

- [ ] **Validation Suite**
  - Compare B, C, A, X results side-by-side
  - Show accuracy differences
  - Recommend best formula for scenario
  - Cross-validate with commercial tools (if available)

- [ ] **Advanced Multi-Skill Routing**
  - Full skill matrix
  - Skill proficiency levels (expert, proficient, trainee)
  - Complex routing rules
  - Optimization algorithms

- [ ] **Persistence & Scenarios**
  - Save configurations to localStorage/IndexedDB
  - Named scenario management
  - Import/export scenarios
  - Scenario comparison (what-if analysis)

- [ ] **Performance Optimization**
  - Web Workers for heavy calculations (Erlang X)
  - Calculation result caching
  - Debounced recalculations
  - Lazy loading for large datasets
  - Consider WebAssembly for Erlang X

- [ ] **Mobile-Responsive Design**
  - Touch-friendly interface
  - Responsive charts
  - Mobile-optimized tooltips
  - Progressive Web App (PWA) support

- [ ] **Advanced Exports**
  - PDF reports with charts
  - Excel export with formulas
  - Customizable report templates
  - Automated email reports (if backend added)

- [ ] **Complete Help System**
  - Context-aware help ("Need Help?" floating button)
  - Searchable help with "Ask a question..." bar
  - Complete tutorial library (7+ topics)
  - 10+ example scenarios
  - Video tutorials (links to external content)
  - Print/export help documentation
  - Help usage analytics (track most-accessed topics)

### Tech Stack Additions
- **Web Workers:** For background calculations
- **WebAssembly:** Optional, for Erlang X performance
- **PWA:** Service workers, manifest.json
- **Analytics:** Plausible or similar (privacy-friendly)

### Success Criteria
✅ Erlang X accuracy within ±2% of reality
✅ All four formulas (B, C, A, X) validated
✅ Performance acceptable with 1000+ intervals
✅ Mobile experience excellent
✅ Help system comprehensive and searchable
✅ Scenario management intuitive

### Estimated Complexity
**Very High** - Erlang X is cutting-edge, performance optimization non-trivial

---

## Technical Decisions to Make

### Framework Selection

**React**
- ✅ Largest ecosystem
- ✅ Excellent TypeScript support
- ✅ Great chart libraries (Recharts)
- ✅ Most tutorials/resources
- ❌ Larger bundle size
- ❌ More boilerplate

**Vue**
- ✅ Easier learning curve
- ✅ Great documentation
- ✅ Single-file components
- ✅ Good performance
- ⚠️ TypeScript support improving
- ❌ Smaller ecosystem

**Svelte**
- ✅ Smallest bundle size
- ✅ Best raw performance
- ✅ Least boilerplate
- ✅ Compile-time optimization
- ❌ Smallest ecosystem
- ❌ Fewer chart libraries

**Recommendation:** React (if team familiar) or Svelte (for best performance/bundle size)

### TypeScript vs JavaScript

**TypeScript Pros:**
- Type safety for calculations (catch errors at compile time)
- Better IDE autocomplete
- Self-documenting interfaces
- Safer refactoring

**TypeScript Cons:**
- Steeper learning curve
- More setup/configuration
- Longer build times

**Recommendation:** Use TypeScript at least for calculation modules (`src/lib/calculations/`)

### State Management

**Phase 1-2:** Context API (built-in, sufficient for simple state)
**Phase 3+:** Zustand or Jotai (if state becomes complex)
**Avoid:** Redux (too much boilerplate for this use case)

### Styling

**CSS Modules**
- ✅ Scoped styles
- ✅ No runtime cost
- ❌ More files

**Tailwind CSS**
- ✅ Rapid development
- ✅ Consistent design system
- ❌ Learning curve
- ❌ Larger HTML

**styled-components**
- ✅ Co-located with components
- ✅ Dynamic styling
- ❌ Runtime cost
- ❌ Larger bundle

**Recommendation:** Tailwind (fastest development) or CSS Modules (best performance)

### Chart Library

**Chart.js**
- ✅ Simple API
- ✅ Good documentation
- ✅ Framework-agnostic
- ❌ Less interactive

**Recharts (React only)**
- ✅ Declarative
- ✅ React-native
- ✅ Responsive
- ❌ Larger bundle

**D3.js**
- ✅ Most powerful
- ✅ Full customization
- ❌ Steeper learning curve
- ❌ More code to write

**Recommendation:** Chart.js (simple) or Recharts (if using React)

### Testing

**Vitest**
- ✅ Fast
- ✅ Modern
- ✅ Vite integration
- ✅ Jest-compatible API

**Jest**
- ✅ Established
- ✅ Large ecosystem
- ❌ Slower than Vitest

**Recommendation:** Vitest (if using Vite) or Jest (if using CRA)

---

## Open Questions

### Forecasting
- Should we add forecasting algorithms (moving average, regression, seasonality)?
- Or focus purely on capacity planning (given a forecast)?
- **Recommendation:** Phase 5+ (nice-to-have, not core)

### Shift Scheduling
- Should we add shift scheduling/rostering (beyond FTE calculations)?
- **Recommendation:** Out of scope (very complex, separate tool)

### Backend/Database
- Currently 100% client-side. Add backend for:
  - User accounts
  - Saved scenarios (cloud sync)
  - Team collaboration
- **Recommendation:** Phase 5+ (if user demand exists)

### Real-Time Data
- Support real-time data feeds (WebSocket, API polling)?
- **Recommendation:** Out of scope for MVP (enterprise feature)

### Integration
- Export formats compatible with external WFM tools (Aspect, NICE, Verint)?
- **Recommendation:** Phase 4+ (if user feedback indicates need)

---

## Risk Mitigation

### Mathematical Accuracy Risk
**Risk:** Calculations don't match industry standards
**Mitigation:**
- Test against published Erlang tables from day one
- Cross-validate with commercial tools
- Peer review by WFM professionals
- Document all formulas and assumptions

### Complexity Creep Risk
**Risk:** Over-engineering, bloated codebase
**Mitigation:**
- Stick to phase plan
- Only add features with clear user value
- Regular code reviews
- Keep YAGNI principle

### Performance Risk
**Risk:** Slow calculations with large datasets
**Mitigation:**
- Performance testing from Phase 2
- Web Workers for heavy calculations
- Caching strategies
- Consider WebAssembly for Erlang X

### Usability Risk
**Risk:** Tool too complex for non-experts
**Mitigation:**
- Comprehensive help system from Phase 1
- User testing at each phase
- Tutorial system
- Example scenarios

---

## Success Metrics

### Phase 1
- [ ] 50+ users complete first calculation
- [ ] 90%+ calculation accuracy vs. standards
- [ ] < 5 seconds to first result

### Phase 2
- [ ] 100+ users import CSV successfully
- [ ] 80%+ complete Quick Start tutorial
- [ ] 5+ GitHub stars/forks

### Phase 3
- [ ] Erlang A accuracy validated
- [ ] Users export results regularly
- [ ] Educational mode adopted by 30%+ users

### Phase 4
- [ ] Erlang X accuracy within ±2%
- [ ] Mobile usage > 20%
- [ ] 10+ example scenarios loaded regularly

---

## Timeline Expectations

**Note:** No specific time estimates, as per project guidelines. Focus on "what needs to be done" not "when."

**Phase 1:** Foundation - essential for any further work
**Phase 2:** Usability - needed before public release
**Phase 3:** Advanced features - professional-grade tool
**Phase 4:** Enterprise features - optional, user-driven

**Approach:** Complete each phase fully before moving to next. Validate with users between phases.

---

## Post-MVP Ideas (Phase 5+)

- Forecasting algorithms (time-series analysis)
- Shift scheduling/rostering
- User accounts and cloud sync
- Team collaboration features
- Real-time data integration
- Mobile app (React Native)
- API for programmatic access
- Plugins/extensions system
- Multi-language support (i18n)
- Dark mode theme
- Accessibility audit and improvements
- Video tutorial library
- Community scenario sharing

---

**Key Principle:** Start simple, validate early, iterate based on real user feedback. Mathematical accuracy is non-negotiable at every phase.

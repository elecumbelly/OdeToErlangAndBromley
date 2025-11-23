# CLAUDE.md - AI Assistant Guide for OdeToErlang

**Last Updated:** 2025-11-23
**Repository:** elecumbelly/OdeToErlang
**License:** MIT
**Copyright:** 2025 SteS

---

## Repository Overview

### Purpose
**OdeToErlang** is a comprehensive contact center capacity planning calculator. The name is a tribute to the **Erlang C formula**, the foundational queuing theory calculation used for staffing contact centers.

This is an "all-singing, all-dancing" capacity planning and management tool for calculating staffing requirements in modern, multi-skill, multi-channel contact center environments.

### Key Features
- **100% Browser-Based:** Client-side web application, no backend required
- **Fully Configurable:** Every assumption, parameter, and variable is adjustable
- **CSV Import:** Load historical data, forecasts, and configurations via CSV files
- **Multi-Channel Support:** Voice, email, chat, social media, video, and custom channels
- **Multi-Skill Routing:** Complex skill-based routing calculations
- **Real-Time Recalculation:** Instant results as parameters change
- **Comprehensive Outputs:** FTE requirements, service levels, occupancy, costs, exportable reports, visual dashboards

### Current State
- **Status:** Initial development phase
- **Architecture:** Client-side only (HTML, CSS, JavaScript)
- **Branch Strategy:** Feature branches prefixed with `claude/`
- **Primary Technologies:** Modern JavaScript framework + visualization libraries

---

## Codebase Structure

### Current Layout
```
OdeToErlang/
├── LICENSE          # MIT License, Copyright 2025 SteS
└── CLAUDE.md        # This file (AI assistant guide)
```

### Expected Web Application Structure
```
OdeToErlang/
├── public/                  # Static assets
│   ├── index.html          # Main HTML entry point
│   ├── favicon.ico         # App icon
│   └── assets/             # Images, fonts, etc.
├── src/
│   ├── components/         # UI components
│   │   ├── import/         # CSV import components
│   │   ├── configuration/  # Parameter/assumption editors
│   │   ├── calculations/   # Calculation display components
│   │   ├── results/        # Results visualization
│   │   └── export/         # Export functionality
│   ├── lib/                # Core libraries
│   │   ├── calculations/   # Erlang C/A formulas and algorithms
│   │   │   ├── erlangC.js        # Erlang C implementation
│   │   │   ├── erlangA.js        # Erlang A (with abandonment)
│   │   │   ├── multiSkill.js     # Multi-skill routing
│   │   │   └── serviceLevels.js  # SLA calculations
│   │   ├── parsers/        # CSV and data parsing
│   │   ├── models/         # Data models and state
│   │   └── utils/          # Utilities and helpers
│   ├── styles/             # CSS/styling
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
├── tests/                  # Unit and integration tests
├── docs/                   # Documentation
│   ├── formulas.md         # Mathematical formulas reference
│   ├── csv-formats.md      # CSV file format specifications
│   └── user-guide.md       # End-user documentation
├── examples/               # Sample CSV files and configurations
│   ├── sample-volumes.csv
│   ├── sample-aht.csv
│   └── sample-config.json
├── .github/                # GitHub workflows
├── package.json            # Dependencies and scripts
├── LICENSE                 # MIT License
├── README.md               # User-facing documentation
└── CLAUDE.md               # AI assistant guide (this file)
```

### Core Modules

#### 1. Calculation Engine (`src/lib/calculations/`)
Mathematical formulas and algorithms:
- **Erlang C:** Queue waiting time with infinite patience
- **Erlang A:** Queue with abandonment/patience modeling
- **Multi-skill routing:** Skill-based distribution algorithms
- **Service level calculations:** ASA, SLA, occupancy, utilization
- **Shrinkage modeling:** Break time, training, absenteeism

#### 2. Data Management (`src/lib/parsers/`, `src/lib/models/`)
- CSV parsing and validation
- Data normalization and transformation
- State management (intervals, skills, channels)
- Configuration persistence (localStorage/IndexedDB)

#### 3. UI Components (`src/components/`)
- **Import:** Drag-and-drop CSV upload, data preview, validation
- **Configuration:** Editable assumption panels (SLA targets, shrinkage, occupancy)
- **Calculations:** Live calculation display, formula visualization
- **Results:** Charts, tables, FTE schedules, cost projections
- **Export:** CSV, PDF, Excel export functionality

#### 4. Visualization (`results/`)
- Interactive charts (line, bar, heatmaps)
- Interval-based staffing schedules
- Service level vs. staffing trade-off curves
- Occupancy and utilization dashboards

---

## Development Workflows

### Git Workflow

#### Branch Strategy
- **Development Branches:** Always use branches prefixed with `claude/` followed by session identifier
- **Example:** `claude/claude-md-mib2hvmqk83zob5b-016WfDnWa5ovXUrvj58YZfrs`
- **Main Branch:** Currently unnamed (will be established with first major commit)

#### Commit Guidelines
1. **Write clear, descriptive commit messages** in imperative mood
   - Good: "Add factorial implementation in Erlang"
   - Bad: "Added stuff" or "fixes"

2. **Structure commits logically:**
   - One logical change per commit
   - Group related changes together
   - Don't mix refactoring with feature additions

3. **Commit message format:**
   ```
   Brief summary (50 chars or less)

   More detailed explanation if needed. Wrap at 72 characters.
   Explain the what and why, not the how.

   - Bullet points are acceptable
   - Reference issues: #123
   ```

#### Push Guidelines
- **Always use:** `git push -u origin <branch-name>`
- **Branch naming:** Must start with `claude/` and end with matching session ID
- **Network failures:** Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
- **Never force push** to main/master without explicit permission

### Pull Request Workflow

#### Before Creating a PR
1. Ensure all commits are on the correct `claude/` branch
2. Run all tests and verify they pass
3. Review all changes yourself first
4. Ensure code follows project conventions

#### PR Structure
```markdown
## Summary
- Bullet point summary of changes
- Focus on the "why" not just the "what"

## Changes
- Specific files/modules modified
- New functionality added
- Breaking changes (if any)

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Code reviewed

## Related Issues
Closes #123
```

---

## Key Conventions for AI Assistants

### Code Analysis Protocol

#### Before Making Changes
1. **Always read files first** - Never propose changes to unread code
2. **Understand context** - Review related files and dependencies
3. **Check for patterns** - Identify existing code conventions and follow them
4. **Search before creating** - Look for existing similar functionality

#### When Exploring the Codebase
1. **Use Task tool with subagent_type=Explore** for broad questions:
   - "How does error handling work?"
   - "What is the module structure?"
   - "Where are API endpoints defined?"

2. **Use specific tools for targeted searches:**
   - `Glob` for finding files by pattern
   - `Grep` for finding specific code patterns
   - `Read` for examining file contents

### Development Principles

#### Simplicity First
- **Avoid over-engineering** - Only add what's needed for the current task
- **No premature abstractions** - Three similar lines is better than a premature abstraction
- **YAGNI (You Aren't Gonna Need It)** - Don't design for hypothetical futures
- **No extra features** - A bug fix doesn't need surrounding code cleanup

#### Code Quality
- **No security vulnerabilities:**
  - Command injection
  - XSS attacks
  - SQL injection
  - OWASP Top 10 vulnerabilities

- **Error handling:**
  - Only validate at system boundaries (user input, external APIs)
  - Trust internal code and framework guarantees
  - Don't add error handling for scenarios that can't happen

- **Clean deletions:**
  - Remove unused code completely
  - No backwards-compatibility hacks without justification
  - No `_unused_vars`, `// removed` comments, or dead code

#### Documentation Standards
- **Comments:** Only where logic isn't self-evident
- **Don't add comments to unchanged code**
- **Don't add docstrings unless:**
  - You created the function
  - It's a public API
  - The behavior is non-obvious

### Task Management

#### Using TodoWrite
1. **Use for tasks with 3+ steps** or non-trivial complexity
2. **Don't use for:**
   - Single straightforward tasks
   - Trivial operations
   - Purely conversational requests

3. **Task states:**
   - `pending`: Not started
   - `in_progress`: Currently working (only ONE at a time)
   - `completed`: Finished successfully

4. **Task format:**
   ```javascript
   {
     content: "Run the build",        // Imperative form
     activeForm: "Running the build", // Present continuous
     status: "in_progress"
   }
   ```

5. **Mark completed immediately** - Don't batch completions
6. **Only mark complete when fully done** - If blocked, keep as in_progress

---

## Language-Specific Conventions

### JavaScript/Web Development

#### File Organization
- **Component files:** One component per file
- **File naming:**
  - Components: `PascalCase.jsx` or `PascalCase.vue`
  - Utilities: `camelCase.js`
  - Tests: `*.test.js` or `*.spec.js`
- **Module structure:** ES6 modules with named exports preferred

#### Code Style
- **Indentation:** 2 spaces
- **Line length:** 100 characters max
- **Naming conventions:**
  - Functions: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: match exported component/function name
- **Quotes:** Single quotes for strings, template literals for interpolation
- **Semicolons:** Consistent usage (use or don't use, pick one)

#### Technology Stack
- **Framework Options:** React, Vue, or Svelte (TBD)
- **Build Tool:** Vite or Create React App
- **Styling:** CSS Modules or Tailwind CSS
- **Charts:** Chart.js, Recharts, or D3.js
- **CSV Parsing:** Papa Parse or csv-parser
- **State Management:** Context API, Zustand, or Pinia (framework-dependent)
- **Testing:** Vitest or Jest + Testing Library
- **TypeScript:** Optional but recommended for type safety in calculations

#### Mathematical Precision
- **Use decimal libraries** for financial calculations (avoid floating point errors)
- **Round consistently:** Define rounding rules for FTE calculations
- **Validate inputs:** Check for reasonable ranges (e.g., 0-100% for shrinkage)
- **Document formulas:** Include mathematical notation in comments or separate docs

#### Testing
- **Framework:** Vitest or Jest
- **Test categories:**
  - Unit tests for calculation functions (critical!)
  - Component tests for UI behavior
  - Integration tests for CSV parsing → calculation → display flow
- **Calculation tests:** Verify against known results (e.g., published Erlang C tables)
- **Edge cases:** Test with 0 volumes, 100% occupancy, extreme AHT values
- **Test naming:** Descriptive names that explain scenario being tested

---

## Project-Specific Guidelines

### Domain Knowledge: Contact Center Operations

#### Core Concepts
- **Erlang C Formula:** Calculates probability of waiting in queue (assumes infinite patience)
- **Erlang A Formula:** Extends Erlang C to include abandonment/patience modeling
- **Service Level:** % of contacts answered within threshold (e.g., 80/20 = 80% in 20 seconds)
- **Average Speed of Answer (ASA):** Mean wait time for answered contacts
- **Occupancy:** % of time agents spend handling contacts vs. idle
- **Shrinkage:** % of paid time not available for handling contacts (breaks, training, etc.)
- **Average Handle Time (AHT):** Mean duration of a contact (talk time + after-call work)
- **Full-Time Equivalent (FTE):** Standard unit of staffing (1 FTE = full-time schedule)

#### Contact Center Calculations

**Basic Erlang C:**
```
Traffic Intensity (A) = (Call Volume × AHT) / Interval Length
Agents Required = f(A, Service Level Target, AHT)
```

**With Shrinkage:**
```
Productive FTE = Erlang C Result
Total FTE = Productive FTE / (1 - Shrinkage%)
```

**Multi-Channel Considerations:**
- Different channels have different AHT patterns
- Concurrent chat/email handling (occupancy > 100% possible)
- Priority routing between channels
- Skill-based routing complexity

#### Configurable Assumptions
The tool must allow users to adjust:
1. **Service Level Targets:** 80/20, 90/30, custom thresholds
2. **Shrinkage %:** Breaks, lunch, training, meetings, absenteeism
3. **Occupancy Targets:** Typically 85-90% for voice, can be higher for digital
4. **AHT by Channel/Skill:** Voice, email, chat, social media
5. **Arrival Patterns:** Intraday, day-of-week, seasonal variations
6. **Abandonment Rates:** % of contacts abandoned before answer
7. **Patience Distribution:** How long customers wait before abandoning
8. **Skill Proficiency:** Agent efficiency by skill level
9. **Multi-skill Overlap:** % of agents with multiple skills
10. **Cost Parameters:** Hourly rates, overhead, technology costs

### Design Principles

#### User Experience
- **Everything is editable:** No hard-coded assumptions
- **Instant feedback:** Calculations update as parameters change
- **Visual clarity:** Clear display of inputs, calculations, and results
- **Guidance:** Tooltips and help text explaining contact center terms
- **Flexibility:** Support both simple (single-skill voice) and complex scenarios

#### Accuracy and Validation
- **Mathematical correctness:** Implement formulas precisely
- **Input validation:** Reasonable ranges, clear error messages
- **Edge case handling:** Zero volumes, 100% shrinkage, impossible SLAs
- **Verification:** Compare results to industry-standard tools
- **Documentation:** Explain formulas and assumptions used

#### Data Import/Export
- **Flexible CSV formats:** Support common WFM tool exports
- **Clear templates:** Provide sample CSVs with documentation
- **Error handling:** Validate data, report issues clearly
- **Export options:** Results in multiple formats for different audiences
- **Persistence:** Save configurations locally for reuse

### Design Goals
- [ ] Accurate Erlang C and Erlang A implementations
- [ ] Support for multi-skill, multi-channel environments
- [ ] Flexible CSV import for all data types
- [ ] Real-time recalculation as assumptions change
- [ ] Comprehensive output (FTE, service levels, occupancy, costs)
- [ ] Visual dashboards and charts
- [ ] Export to CSV, Excel, PDF
- [ ] User-friendly interface for non-technical users
- [ ] Professional-grade accuracy for WFM professionals
- [ ] Mobile-responsive design (optional, but nice to have)

---

## Communication Guidelines

### Output Style
- **Be concise** - Output is displayed in CLI
- **Use markdown** - GitHub-flavored markdown is supported
- **No unnecessary emojis** - Only if explicitly requested
- **Direct communication** - Output text directly, not through bash echo or comments
- **Professional tone** - Objective, technical, factual

### Tool Usage
- **Parallel execution:** Call independent tools together in one message
- **Sequential when needed:** Wait for results if there are dependencies
- **Never guess parameters:** Ask if required values are missing
- **Prefer specialized tools:** Use Read/Edit/Write instead of cat/sed/echo

---

## Security Guidelines

### Authorized Activities
✅ Defensive security implementations
✅ Security testing with authorization
✅ CTF challenges and educational contexts
✅ Security research with proper context

### Prohibited Activities
❌ Destructive techniques
❌ DoS attacks
❌ Mass targeting
❌ Supply chain compromise
❌ Detection evasion for malicious purposes

### Dual-Use Tools
Require clear authorization context for:
- C2 frameworks
- Credential testing
- Exploit development

---

## Maintenance Notes

### When to Update This File
- Major architectural changes
- New language/framework adoption
- Established code conventions
- New development workflows
- Team decisions on standards
- Tool or dependency changes

### Update Protocol
1. Read current CLAUDE.md
2. Make necessary changes
3. Update "Last Updated" date
4. Document what changed and why
5. Commit with clear message: "Update CLAUDE.md: [what changed]"

---

## Quick Reference

### Essential Commands
```bash
# Check repository status
git status

# Create and switch to feature branch
git checkout -b claude/feature-name-<session-id>

# Stage and commit changes
git add <files>
git commit -m "Your message"

# Push to remote
git push -u origin <branch-name>

# Check recent commits
git log --oneline -10
```

### Common AI Assistant Tasks
1. **Analyzing code:** Read → Understand → Report
2. **Adding features:** Read → Plan (TodoWrite) → Implement → Test → Commit
3. **Fixing bugs:** Reproduce → Read → Fix → Test → Commit
4. **Refactoring:** Read → Plan → Refactor → Test → Commit

### File Operation Tools
- **Finding files:** `Glob` with patterns like `**/*.erl`
- **Searching code:** `Grep` with regex patterns
- **Reading:** `Read` for file contents
- **Editing:** `Edit` for precise string replacement
- **Creating:** `Write` for new files (use sparingly)

---

## Resources

### Contact Center & Workforce Management
- **Erlang C Formula:** [Wikipedia](https://en.wikipedia.org/wiki/Erlang_(unit)#Erlang_C_formula)
- **Queuing Theory:** Understanding call center mathematics
- **WFM Best Practices:** Industry standards for forecasting and scheduling
- **Service Level Standards:** Common SLA targets (80/20, 90/30, etc.)

### Mathematical References
- **Erlang C Calculator:** Reference implementations for verification
- **Queuing Theory Papers:** Academic sources for advanced formulas
- **Statistical Methods:** Forecasting and time series analysis

### Technical Documentation
- **JavaScript/Framework Docs:** React, Vue, or Svelte official documentation
- **Chart.js/D3.js:** Data visualization libraries
- **Papa Parse:** CSV parsing library
- **Testing Library:** Component and integration testing

### Development Resources
- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript and Web APIs
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Project Links
- **Repository:** elecumbelly/OdeToErlang
- **License:** MIT (see LICENSE file)
- **Issues:** Use GitHub issues for tracking

---

## CSV Input Formats

### Expected CSV Files

The application should support importing the following data via CSV:

#### 1. Volume Data (`volumes.csv`)
Expected columns:
```csv
Date,Time,Channel,Skill,Volume
2025-01-15,09:00,Voice,Sales,120
2025-01-15,09:30,Voice,Sales,145
2025-01-15,09:00,Chat,Support,45
```

#### 2. Average Handle Time (`aht.csv`)
Expected columns:
```csv
Channel,Skill,AHT_Seconds
Voice,Sales,420
Voice,Support,360
Chat,Sales,180
Email,Support,300
```

#### 3. Service Level Targets (`sla.csv`)
Expected columns:
```csv
Channel,Skill,Target_Percent,Threshold_Seconds
Voice,Sales,80,20
Voice,Support,90,30
Chat,*,85,60
```

#### 4. Shrinkage Configuration (`shrinkage.csv`)
Expected columns:
```csv
Category,Percentage
Breaks,8.33
Lunch,4.17
Training,5.00
Meetings,3.00
Absenteeism,4.00
```

#### 5. Staffing Assumptions (`assumptions.csv`)
Expected columns:
```csv
Parameter,Value
Target_Occupancy,0.85
Interval_Minutes,30
Hours_Per_FTE,40
Cost_Per_Hour,25.00
```

### CSV Import Guidelines
- **Flexible headers:** Support variations in column naming (case-insensitive)
- **Optional columns:** Allow partial data (fill defaults for missing values)
- **Date formats:** Support ISO 8601 and common formats (MM/DD/YYYY, DD/MM/YYYY)
- **Time intervals:** Support 15-min, 30-min, 60-min intervals
- **Wildcards:** Support `*` for "all skills" or "all channels"
- **Validation:** Check for required columns, reasonable value ranges
- **Error reporting:** Clear messages about what's wrong and where

---

## Notes for Future Development

### Phase 1: Foundation (Core Calculator)
- [ ] Choose JavaScript framework (React, Vue, or Svelte)
- [ ] Set up project structure and build system
- [ ] Implement basic Erlang C formula
- [ ] Create simple UI for single-skill voice calculations
- [ ] Add CSV import for volume data
- [ ] Unit tests for calculation accuracy

### Phase 2: Configuration & Multi-Channel
- [ ] Configurable assumptions (SLA, shrinkage, occupancy)
- [ ] Multi-channel support (voice, email, chat, etc.)
- [ ] Channel-specific AHT and handling rules
- [ ] Enhanced CSV import (AHT, shrinkage, targets)
- [ ] Results visualization (charts, tables)

### Phase 3: Advanced Features
- [ ] Erlang A (abandonment modeling)
- [ ] Multi-skill routing calculations
- [ ] Skill proficiency and overlap modeling
- [ ] Interval-based forecasting (15/30-minute intervals)
- [ ] Cost calculations and projections
- [ ] Occupancy and utilization dashboards

### Phase 4: Export & Refinement
- [ ] Export to CSV, Excel, PDF
- [ ] Save/load configurations (localStorage/IndexedDB)
- [ ] What-if scenario comparison
- [ ] Mobile-responsive design
- [ ] User documentation and help system
- [ ] Performance optimization for large datasets

### Technical Decisions Needed
- [ ] **Framework:** React (most popular), Vue (easier), or Svelte (fastest)?
- [ ] **TypeScript:** Yes (recommended for calculations) or vanilla JavaScript?
- [ ] **Styling:** CSS Modules, Tailwind, or styled-components?
- [ ] **Charts:** Chart.js (simple), Recharts (React-native), or D3.js (powerful)?
- [ ] **State Management:** Context API, Zustand, Redux, or Pinia?
- [ ] **Testing:** Vitest (modern) or Jest (established)?
- [ ] **Decimal Library:** decimal.js or big.js for precise calculations?
- [ ] **CSV Export:** Custom or library like json2csv?

### Open Questions
- Should we support real-time data feeds (WebSocket, API polling)?
- Include forecasting algorithms (moving average, regression, seasonality)?
- Support for shift scheduling/rostering (beyond FTE calculations)?
- Multi-language support for international users?
- Dark mode theme?
- Integration with external WFM tools (import/export formats)?
- Historical scenario storage (database vs. local storage)?

---

*This document is a living guide that should evolve with the project. Keep it updated, concise, and useful for both AI assistants and human developers.*

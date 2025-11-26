# CLAUDE.md - AI Assistant Guide for OdeToErlang

**Last Updated:** 2025-11-25
**Repository:** elecumbelly/OdeToErlang
**License:** MIT
**Copyright:** 2025 SteS

---

## 🤖 CRITICAL: Automatic Context Loading Instructions

**YOU MUST automatically load relevant context commands based on the user's task WITHOUT asking them to do it manually.**

### Context Loading Protocol

Before starting ANY task, analyze the user's request and automatically load relevant slash commands using the SlashCommand tool:

**Task Pattern Recognition → Auto-Load Commands:**

| **If the task involves...** | **Automatically load** |
|------------------------------|------------------------|
| Erlang formulas, calculations, math, staffing algorithms | `/erlang-formulas` |
| Contact center concepts, WFM, service levels, queuing theory | `/contact-center-domain` |
| CSV import/export, data parsing, file formats | `/csv-formats` |
| Code style, git workflow, testing, conventions | `/conventions` |
| System architecture, file structure, module organization | `/architecture` |
| UI/UX, help system, tooltips, tutorials, glossary | `/help-system-design` |
| Roadmap, phases, technical decisions, future planning | `/implementation-phases` |

**Example Workflow:**
```
User: "Implement the Erlang C service level calculation"

You think: This involves Erlang formulas AND contact center domain knowledge
You do: Automatically invoke SlashCommand("/erlang-formulas") and SlashCommand("/contact-center-domain")
You then: Proceed with implementation using loaded context
```

**Multiple Commands:** Load ALL relevant commands in parallel if the task spans multiple areas.

**No Manual Invocation:** The user should NEVER need to type `/command-name` themselves - you detect and load context automatically.

---

## Repository Overview

### Purpose
**OdeToErlang** is a comprehensive contact center capacity planning calculator - a tribute to the **Erlang C formula**, the foundational queuing theory calculation for staffing contact centers.

An "all-singing, all-dancing" capacity planning tool for calculating staffing requirements in modern, multi-skill, multi-channel contact center environments.

### Key Features
- **100% Browser-Based:** Client-side web application, no backend required
- **Fully Configurable:** Every assumption, parameter, and variable is adjustable
- **CSV Import/Export:** Load historical data, forecasts, and configurations
- **Multi-Channel Support:** Voice, email, chat, social media, video, custom channels
- **Multi-Skill Routing:** Complex skill-based routing calculations
- **Real-Time Recalculation:** Instant results as parameters change
- **Comprehensive Outputs:** FTE requirements, service levels, occupancy, costs, reports, dashboards
- **Built-in Help & Training:** Contextual tooltips, interactive tutorials, glossary, formula explanations

### Current State
- **Status:** Initial development phase
- **Architecture:** Client-side only (HTML, CSS, JavaScript)
- **Branch Strategy:** Feature branches prefixed with `claude/`
- **Primary Technologies:** Modern JavaScript framework + visualization libraries

---

## Quick Reference

### Project Structure
```
OdeToErlang/
├── .claude/
│   └── commands/         # Detailed documentation (auto-loaded by Claude)
├── src/
│   ├── lib/
│   │   ├── calculations/ # Erlang B, C, A, X formulas
│   │   ├── parsers/      # CSV parsing
│   │   └── models/       # Data models
│   ├── components/       # UI components
│   └── content/          # Help system content
├── tests/                # Unit and integration tests
├── docs/                 # User-facing documentation
└── examples/             # Sample CSV files
```

### Git Workflow (Quick)
```bash
# Feature branch naming
git checkout -b claude/feature-name-<session-id>

# Commit with co-author
git commit -m "Your message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push with tracking
git push -u origin <branch-name>
```

### Core Principles
- **Simplicity First:** No over-engineering, YAGNI, minimal abstractions
- **Mathematical Accuracy:** Implement formulas precisely, validate against standards
- **Security:** No vulnerabilities (XSS, injection, OWASP Top 10)
- **Clean Code:** Remove unused code completely, no backwards-compatibility hacks
- **Test Critical Paths:** Especially calculation functions

---

## Development Stack (TBD)

**Decisions Needed:**
- Framework: React / Vue / Svelte
- TypeScript: Yes (recommended for calculations) / No
- Styling: CSS Modules / Tailwind / styled-components
- Charts: Chart.js / Recharts / D3.js
- State: Context API / Zustand / Redux / Pinia
- Testing: Vitest / Jest

---

## Essential Commands Reference

**For detailed documentation, Claude will automatically load these:**
- `/architecture` - System design and file structure
- `/erlang-formulas` - Mathematical formulas with validation
- `/contact-center-domain` - WFM concepts, terminology, best practices
- `/csv-formats` - CSV import/export specifications
- `/conventions` - Code style, testing, git workflow
- `/help-system-design` - UI/UX for help features
- `/implementation-phases` - Roadmap and technical decisions

**You don't need to manually invoke these - Claude loads them automatically based on your task.**

---

## Key Domain Concepts (Quick Reference)

**The Four Erlang Formulas:**
1. **Erlang B (1917):** Blocking systems, no queue (trunk lines)
2. **Erlang C (1917):** Basic queuing, infinite patience (simple baseline)
3. **Erlang A (2004):** Queuing with abandonment (realistic)
4. **Erlang X (2012+):** Most accurate, models retrials (professional-grade)

**Core Metrics:**
- **Service Level:** % answered within threshold (e.g., 80/20 = 80% in 20s)
- **ASA:** Average Speed of Answer (mean wait time)
- **AHT:** Average Handle Time (talk + after-call work)
- **Occupancy:** % time agents spend handling contacts (target: 85-90%)
- **Shrinkage:** % paid time unavailable (breaks, training, etc.)
- **FTE:** Full-Time Equivalent (standard staffing unit)

**Implementation Priority:**
1. Phase 1: Erlang C (widely understood baseline)
2. Phase 2: Erlang A (improved accuracy)
3. Phase 3: Erlang X (professional-grade)
4. Optional: Erlang B (specialized scenarios)

**Allow users to choose which formula - different orgs have different standards.**

---

## Critical Implementation Rules

### Before Making Changes
1. ✅ **Always read files first** - Never propose changes to unread code
2. ✅ **Automatically load context** - Use SlashCommand tool based on task
3. ✅ **Understand patterns** - Review existing code conventions
4. ✅ **Search before creating** - Look for existing functionality

### Mathematical Accuracy
- **Precision:** Use decimal.js or big.js for financial calculations
- **Validation:** Test against published Erlang tables and commercial tools
- **Edge Cases:** Handle zero volume, 100% shrinkage, impossible SLAs
- **Iterative Methods:** Never use factorial(n) directly (overflow risk)

### Code Quality
- **No security vulnerabilities:** Command injection, XSS, SQL injection, OWASP Top 10
- **Clean deletions:** Remove unused code completely, no dead code or `_unused` vars
- **Minimal error handling:** Only at system boundaries (user input, external APIs)
- **No premature abstraction:** Three similar lines > premature abstraction

---

## Task Management

Use TodoWrite for tasks with 3+ steps or non-trivial complexity.

**Task states:**
- `pending`: Not started
- `in_progress`: Currently working (ONLY ONE at a time)
- `completed`: Fully finished

**Mark completed immediately** - don't batch completions.
**Only mark complete when fully done** - if blocked, keep as `in_progress`.

---

## Communication Style

- **Concise:** Output displayed in CLI
- **Markdown:** GitHub-flavored markdown
- **No emojis:** Unless explicitly requested
- **Direct:** Output text directly, not through bash echo or comments
- **Professional:** Objective, technical, factual

---

## Security Guidelines

✅ **Authorized:** Defensive security, pentesting (with authorization), CTF, education
❌ **Prohibited:** DoS attacks, mass targeting, supply chain compromise, malicious evasion

---

## Maintenance

### When to Update This File
- Major architectural changes
- New conventions established
- Workflow updates
- Technology stack decisions

### Update Protocol
1. Read current CLAUDE.md
2. Make changes
3. Update "Last Updated" date
4. Commit: `"Update CLAUDE.md: [what changed]"`

---

## License & Copyright

**MIT License** - Copyright 2025 SteS

See LICENSE file for full text.

---

*This is a living document. Keep it concise - detailed docs live in `.claude/commands/` and are auto-loaded by Claude as needed.*

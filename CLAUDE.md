# CLAUDE.md - OdeToErlang

Contact center calculator (React/TS/Vite). Erlang B/C/A/X formulas.

**v0.2.0** | Dark theme | Tests: 280+

## Parallelization Rules

**ALWAYS parallel when possible:**
- Multiple file reads → parallel Task agents
- Independent searches → parallel Grep/Glob
- Multi-component changes → parallel agents per component
- Research + implementation → Explore agent first, then implement

**Use Task agents for:**
- Any search needing 2+ attempts
- Context-heavy work (inject command file content)
- Multi-file changes (1 agent per logical unit)

## Agent Dispatch

| Keywords | Command File | Agent |
|----------|--------------|-------|
| erlang, formula, calculation, B/C/A/X | erlang-formulas.md | general-purpose |
| CSV, import, export | csv-formats.md | general-purpose |
| test, vitest, coverage | js-conventions.md | general-purpose |
| component, React, implement | js-conventions.md | general-purpose |
| architecture, structure | architecture.md | Explore |
| roadmap, planning | roadmap.md | Plan |

**Pattern:** Read `.claude/commands/<file>.md` → inject into agent prompt

## Core Rules

- Read before edit
- YAGNI - no over-engineering
- Tests required for new code
- TodoWrite for 3+ steps
- No emojis

## Files

```
.claude/commands/
├── erlang-formulas.md   # Math, edge cases
├── csv-formats.md       # Import/export specs
├── js-conventions.md    # TS patterns, testing
├── architecture.md      # Directory structure
├── domain-knowledge.md  # CC terms, benchmarks
└── roadmap.md          # Phase deliverables
```

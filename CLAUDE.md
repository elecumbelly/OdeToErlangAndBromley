# CLAUDE.md - OdeToErlang

Contact center capacity planning calculator (React/TypeScript/Vite).
Implements Erlang B, C, A, X queuing formulas for staffing calculations.

**Version:** 0.2.0 | **UI:** Dark theme (Scientific/Vivid on Black)

## Testing Status

| File | Tests | Status |
|------|-------|--------|
| modelRunner.ts | 56 | Done |
| inputValidation.ts | 64 | Done |
| SimulationEngine.ts | 15+ | Done |
| Database layer | 59 | Done |
| erlangC.ts | 35+ | Done |
| erlangA.ts | 25+ | Done |
| erlangX.ts | 30+ | Done |

**Rule**: Any work on untested files MUST include tests.

## Formula Status

| Formula | Status | File |
|---------|--------|------|
| Erlang B | Helper | erlangC.ts (internal) |
| Erlang C | Complete | erlangC.ts |
| Erlang A | Complete | erlangA.ts |
| Erlang X | Complete | erlangX.ts |

## Auto-Agent Spawning Rules

When you detect work in these areas, automatically spawn a Task agent with the relevant command file content injected into the prompt. Do NOT ask the user to invoke commands manually.

| Detect Keywords | Command File | Agent Type |
|-----------------|--------------|------------|
| erlang, formula, calculation, probability, staffing, B/C/A/X | erlang-formulas.md | general-purpose |
| service level, AHT, shrinkage, FTE, abandonment, occupancy | domain-knowledge.md | Explore |
| CSV, import, export, parse, file format | csv-formats.md | general-purpose |
| test, coverage, vitest, unit test | js-conventions.md | general-purpose |
| component, TypeScript, React, implement | js-conventions.md | general-purpose |
| tooltip, help, tutorial, glossary | help-system.md | general-purpose |
| structure, architecture, module, organization | architecture.md | Explore |
| commit, branch, PR, push | git-workflow.md | general-purpose |
| roadmap, priority, planning, phase | roadmap.md | Plan |

### Multi-Context Tasks

| Task Type | Inject Both |
|-----------|-------------|
| New Erlang formula | erlang-formulas.md + js-conventions.md |
| Erlang formula tests | erlang-formulas.md + js-conventions.md |
| CSV validation | csv-formats.md + js-conventions.md |
| Feature planning | roadmap.md + architecture.md |

### Agent Spawning Pattern

```
1. Read .claude/commands/<relevant-file>.md
2. Spawn Task agent:
   - subagent_type: <from table above>
   - prompt: [Injected command content] + [Specific task]
   - Include: Working directory is odetoerlang/
```

## Agent Types

| Type | Use For |
|------|---------|
| Explore | Understanding codebase, finding patterns, "where is X" |
| Plan | Architectural decisions, multi-step feature design |
| general-purpose | Implementation, bug fixes, tests, code changes |

## Core Rules

- Read files before proposing changes
- Simplicity over abstraction (YAGNI)
- Validate only at system boundaries
- Use TodoWrite for 3+ step tasks
- Concise output, no emojis

## Command Files (.claude/commands/)

| File | Contains |
|------|----------|
| erlang-formulas.md | B, C, A, X math, validation, edge cases |
| domain-knowledge.md | Contact center terms, benchmarks |
| csv-formats.md | Import/export specs, column mappings |
| architecture.md | Directory structure, modules |
| js-conventions.md | TypeScript patterns, testing |
| help-system.md | Tooltip, tutorial, glossary specs |
| git-workflow.md | Branch naming, commit format |
| roadmap.md | Phase 1-4 deliverables |

## Branch Convention

```
claude/<feature>-<session-id>
```

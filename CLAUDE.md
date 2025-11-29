# CLAUDE.md - OdeToErlang

Contact center capacity planning calculator (React/TypeScript/Vite).
Implements Erlang B, C, A, X queuing formulas for staffing calculations.

## Slash Commands - LOAD BEFORE STARTING WORK

**IMPORTANT:** Before starting specialized work, load the relevant command to get detailed context. These commands contain specifications, code examples, and domain knowledge that would bloat auto-context if always loaded.

| Command | Load Before... |
|---------|----------------|
| `/erlang-formulas` | Implementing/testing ANY Erlang calculations (B, C, A, X) |
| `/domain-knowledge` | Working with contact center terms (SL, AHT, FTE, etc.) |
| `/csv-formats` | ANY CSV import/export work |
| `/help-system` | Building tooltips, tutorials, glossary, help UI |
| `/architecture` | Understanding project structure or adding new modules |
| `/js-conventions` | Writing new TypeScript/React code |
| `/git-workflow` | Making commits, creating branches, opening PRs |
| `/roadmap` | Planning features, understanding priorities |

### When to Load Commands
- **User asks about Erlang formulas** → Load `/erlang-formulas` first
- **User asks about service levels, AHT, occupancy** → Load `/domain-knowledge`
- **User wants to add CSV feature** → Load `/csv-formats`
- **Starting any code implementation** → Load `/js-conventions`
- **Ready to commit** → Load `/git-workflow`

### Using Commands with Task Agents
When spawning Task agents for parallel work, include the relevant command content in the agent prompt:
```
1. Load /erlang-formulas
2. Spawn Task agent with that context + specific task
3. Agent works in its own context window
```

## Core Rules

### Before Making Changes
- Always read files first - never propose changes to unread code
- Search for existing patterns before creating new ones
- Use Task tool with `subagent_type=Explore` for broad questions

### Development Principles
- Simplicity over abstraction - only add what's needed
- YAGNI - don't design for hypothetical futures
- No premature abstractions - three similar lines beats a premature abstraction
- Keep changes focused - a bug fix doesn't need surrounding cleanup

### Code Quality
- No security vulnerabilities (OWASP top 10)
- Validate only at system boundaries (user input, external APIs)
- Remove unused code completely - no backwards-compatibility hacks

### Task Management
- Use TodoWrite for tasks with 3+ steps
- Mark tasks completed immediately - don't batch
- Only ONE task in_progress at a time

## Communication
- Concise output - displayed in CLI
- No emojis unless explicitly requested
- Professional, objective tone

## Branch Convention
```
claude/<feature>-<session-id>
```

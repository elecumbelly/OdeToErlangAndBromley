# CLAUDE.md Migration Plan

## Current Issue
CLAUDE.md is 1000+ lines - too large for efficient daily context loading.

## Proposed Structure

### 1. Keep CLAUDE.md Minimal (Quick Reference Only)
- Project overview (1 paragraph)
- Essential setup
- Links to detailed slash commands
- Quick git workflow reference

### 2. Create Modular Slash Commands

```
.claude/
└── commands/
    ├── architecture.md              # System design & file structure
    ├── erlang-formulas.md           # Mathematical formulas & validation
    ├── contact-center-domain.md     # WFM concepts, terminology, best practices
    ├── csv-formats.md               # Data import specifications
    ├── conventions.md               # Code style, testing, git workflow
    ├── help-system-design.md        # UI/UX for tooltips, glossary, tutorials
    └── implementation-phases.md     # Roadmap & technical decisions
```

### 3. Create Skills for Reusable Logic

```
.claude/skills/
├── erlang-validator/
│   └── SKILL.md        # Validate Erlang formula implementations against test cases
└── csv-debugger/
    └── SKILL.md        # Debug CSV parsing issues
```

## Migration Steps

1. Create `.claude/commands/` directory
2. Split CLAUDE.md sections into focused command files
3. Update CLAUDE.md to reference commands
4. Create 1-2 skills for common patterns
5. Test by running `/architecture`, `/erlang-formulas`, etc.

## Usage Examples

**Starting work on calculations:**
```
You: /erlang-formulas
Claude: [loads mathematical reference]
You: Implement Erlang C service level calculation
```

**Working on CSV import:**
```
You: /csv-formats
Claude: [loads CSV specs]
You: Add validation for volume.csv
```

**Quick reference:**
```
You: What's the git workflow?
Claude: [reads minimal CLAUDE.md, finds workflow section]
```

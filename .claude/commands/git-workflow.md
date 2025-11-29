# Git Workflow

Load this context when making commits, creating branches, or opening PRs.

---

## Branch Strategy

### Naming Convention
```
claude/<feature-or-task>-<session-id>
```

**Examples:**
- `claude/add-erlang-a-formula-abc123`
- `claude/fix-csv-import-validation-xyz789`
- `claude/testing-erlang-formulas-phase1`

### Branch Rules
- Always branch from `main`
- Never commit directly to `main`
- Delete branches after merge

---

## Commit Guidelines

### Message Format
```
<type>: <brief summary> (50 chars max)

<optional body - explain WHY, not WHAT>
<wrap at 72 characters>

<optional footer>
```

### Types
| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding/fixing tests |
| `chore` | Build, tooling, dependencies |

### Examples

**Good:**
```
feat: add Erlang C probability calculation

Implements iterative method to avoid factorial overflow.
Validated against published Erlang tables.
```

**Bad:**
```
Added stuff
```
```
Fixed bug
```
```
WIP
```

### Commit Rules
- One logical change per commit
- Don't mix refactoring with features
- Run tests before committing
- Use imperative mood ("add" not "added")

---

## Pull Request Process

### Before Creating PR
1. Ensure all commits are on feature branch
2. Run tests: `npm test`
3. Run build: `npm run build`
4. Self-review all changes

### PR Template
```markdown
## Summary
- [1-3 bullet points describing changes]
- Focus on WHY, not just WHAT

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Build succeeds

## Related Issues
Closes #123

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### PR Size Guidelines
- **Small:** < 200 lines, single feature
- **Medium:** 200-500 lines, related features
- **Large:** 500+ lines, consider splitting

---

## Essential Commands

```bash
# Check status
git status

# Create feature branch
git checkout -b claude/feature-name-sessionid

# Stage changes
git add <files>
git add -p  # Interactive staging

# Commit
git commit -m "type: message"

# Push (first time)
git push -u origin branch-name

# Push (subsequent)
git push

# Pull latest main
git checkout main
git pull

# Rebase feature branch
git checkout feature-branch
git rebase main

# View history
git log --oneline -10
```

---

## Common Scenarios

### Starting New Work
```bash
git checkout main
git pull
git checkout -b claude/new-feature-xyz
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push -u origin claude/new-feature-xyz
```

### Fixing Mistakes
```bash
# Amend last commit (before push)
git commit --amend

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard uncommitted changes
git checkout -- <file>
```

### Resolving Conflicts
```bash
git rebase main
# Fix conflicts in files
git add <fixed-files>
git rebase --continue
```

---

## Safety Rules

- **Never force push** to main/master
- **Never commit secrets** (.env, credentials)
- **Always test** before pushing
- **Keep commits atomic** - one change per commit

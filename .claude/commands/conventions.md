# Code Conventions & Development Workflow

**Auto-loaded when:** Working on code style, git operations, testing, PR workflows

---

## Git Workflow

### Branch Strategy
**Always use branches prefixed with `claude/` followed by session identifier**

```bash
# Create feature branch
git checkout -b claude/feature-name-<session-id>

# Examples:
git checkout -b claude/erlang-c-implementation-abc123
git checkout -b claude/csv-import-xyz789
```

### Commit Guidelines

**Structure commits logically:**
- One logical change per commit
- Group related changes together
- Don't mix refactoring with feature additions

**Commit message format:**
```
Brief summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the what and why, not the how.

- Bullet points are acceptable
- Reference issues: #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Good commit messages:**
- ✅ "Add Erlang C service level calculation"
- ✅ "Fix division by zero in traffic intensity calc"
- ✅ "Refactor CSV parser for better error handling"

**Bad commit messages:**
- ❌ "Added stuff"
- ❌ "fixes"
- ❌ "WIP"

### Push Guidelines
```bash
# Always use -u flag for first push
git push -u origin <branch-name>

# Network failures: retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
```

**Never force push to main/master without explicit permission**

### Pull Request Structure

**Before Creating PR:**
1. Ensure all commits are on correct `claude/` branch
2. Run all tests and verify they pass
3. Review all changes yourself first
4. Ensure code follows project conventions

**PR Template:**
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

## Code Style

### JavaScript/TypeScript

**File Naming:**
- Components: `PascalCase.jsx` or `PascalCase.tsx`
- Utilities: `camelCase.js` or `camelCase.ts`
- Tests: `*.test.js` or `*.spec.ts`

**Naming Conventions:**
```javascript
// Functions: camelCase
function calculateErlangC(agents, traffic) { }

// Components: PascalCase
function ServiceLevelCalculator() { }

// Constants: UPPER_SNAKE_CASE
const MAX_AGENTS = 1000;
const DEFAULT_SHRINKAGE = 0.25;

// Variables: camelCase
const trafficIntensity = volume * aht / interval;
```

**Code Formatting:**
- **Indentation:** 2 spaces
- **Line length:** 100 characters max
- **Quotes:** Single quotes for strings, template literals for interpolation
- **Semicolons:** Consistent usage (pick one style, stick to it)

**Example:**
```javascript
function calculateServiceLevel(agents, trafficIntensity, aht, threshold) {
  if (agents <= trafficIntensity) {
    return 0; // Unstable queue
  }

  const pwait = erlangC(agents, trafficIntensity);
  const result = pwait * Math.exp(-(agents - trafficIntensity) * (threshold / aht));

  return 1 - result;
}
```

### Module Organization

**ES6 modules with named exports preferred:**
```javascript
// erlangC.js
export function erlangC(agents, traffic) { }
export function serviceLevel(agents, traffic, aht, threshold) { }

// Import
import { erlangC, serviceLevel } from './calculations/erlangC.js';
```

**File structure:**
- One component per file
- Group related utilities in same file
- Separate concerns (calculation vs. UI vs. data)

---

## Development Principles

### Simplicity First
**Avoid over-engineering:**
- ❌ Don't add features beyond what's requested
- ❌ Don't refactor code you're not changing
- ❌ Don't add error handling for scenarios that can't happen
- ❌ Don't create abstractions for one-time operations
- ✅ Only add what's needed for the current task
- ✅ Three similar lines > premature abstraction
- ✅ YAGNI (You Aren't Gonna Need It)

**Examples:**

**Bad (over-engineered):**
```javascript
// Creating abstraction for single use
class ErlangCalculatorFactory {
  createCalculator(type) {
    switch(type) {
      case 'C': return new ErlangCCalculator();
      // Only C is used, why the factory?
    }
  }
}
```

**Good (simple):**
```javascript
// Just implement what's needed
function erlangC(agents, traffic) {
  // Direct implementation
}
```

### Code Quality

**Security - NO vulnerabilities:**
- ❌ Command injection
- ❌ XSS attacks
- ❌ SQL injection (if database added later)
- ❌ OWASP Top 10 vulnerabilities

**Clean deletions:**
- ✅ Remove unused code completely
- ❌ No `_unused_vars` or `// removed` comments
- ❌ No backwards-compatibility hacks without justification
- ❌ No dead code

**Error handling:**
- ✅ Validate at system boundaries (user input, CSV import, external APIs)
- ✅ Trust internal code and framework guarantees
- ❌ Don't add try/catch for scenarios that can't fail

**Example:**
```javascript
// Good: Validate user input
function setServiceLevelTarget(target) {
  if (target < 0 || target > 1) {
    throw new Error('Service level must be between 0 and 1');
  }
  // ... rest of function
}

// Bad: Unnecessary error handling
function addNumbers(a, b) {
  try {
    return a + b; // This can't fail, why try/catch?
  } catch(e) {
    console.error(e);
  }
}
```

### Documentation Standards

**Comments:**
- Only where logic isn't self-evident
- Don't explain WHAT code does (that's what code is for)
- Explain WHY decisions were made

**Don't add comments to unchanged code**

**Don't add docstrings unless:**
- You created the function
- It's a public API
- The behavior is non-obvious

**Example:**
```javascript
// Good: Explains WHY
// Use iterative method to avoid factorial overflow for large agent counts
function erlangC(agents, traffic) {
  let inverseProbability = 1.0;
  for (let k = 1; k < agents; k++) {
    inverseProbability = 1 + (k / traffic) * inverseProbability;
  }
  // ...
}

// Bad: Explains WHAT (redundant)
// This function calculates Erlang C
function erlangC(agents, traffic) {
  // Loop through agents
  for (let k = 1; k < agents; k++) {
    // Add to inverse probability
    inverseProbability = 1 + (k / traffic) * inverseProbability;
  }
}
```

---

## Testing Strategy

### Framework
**TBD:** Vitest or Jest + Testing Library

### Test Categories

**1. Unit Tests (Critical for calculations!):**
```javascript
// Test mathematical accuracy against known results
test('Erlang C: Traffic=10, Agents=13, SL 80/20', () => {
  const sl = serviceLevel(13, 10, 180, 20);
  expect(sl).toBeCloseTo(0.80, 2); // Within 2 decimal places
});

test('Erlang C: Zero volume returns zero FTE', () => {
  const result = calculateStaffing(0, 180, 0.80, 20);
  expect(result.fte).toBe(0);
});

test('Erlang C: Division by zero throws error', () => {
  expect(() => {
    calculateTrafficIntensity(100, 0); // AHT = 0
  }).toThrow();
});
```

**2. Component Tests:**
```javascript
test('ServiceLevelInput validates range 0-100%', () => {
  render(<ServiceLevelInput />);
  const input = screen.getByLabelText('Service Level Target');

  fireEvent.change(input, { target: { value: '150' } });

  expect(screen.getByText('Must be between 0 and 100')).toBeInTheDocument();
});
```

**3. Integration Tests:**
```javascript
test('CSV import → calculation → display flow', async () => {
  // Upload CSV
  const file = new File(['volume,aht\n100,240'], 'test.csv');
  await uploadCSV(file);

  // Trigger calculation
  fireEvent.click(screen.getByText('Calculate'));

  // Verify results displayed
  expect(screen.getByText(/FTE Required: 5.67/)).toBeInTheDocument();
});
```

### Edge Cases to Test

**Calculation edge cases:**
- Zero volume
- Zero AHT (division by zero)
- 100% shrinkage (infinite FTE)
- Agents < Traffic Intensity (unstable queue)
- Impossible SLA targets
- Very large numbers (overflow risk)
- Very small numbers (underflow/precision)

**CSV import edge cases:**
- Empty file
- Missing required columns
- Invalid data types (text in numeric field)
- Negative values
- Out-of-range dates
- Malformed CSV (missing quotes, wrong delimiters)

### Test Naming

**Descriptive names that explain scenario:**
```javascript
// Good
test('returns zero FTE when volume is zero')
test('throws error when AHT is zero (division by zero)')
test('calculates correct service level for Traffic=10, Agents=13')

// Bad
test('test1')
test('edge case')
test('works')
```

---

## Code Review Checklist

Before submitting code, verify:

- [ ] Read all files before modifying them
- [ ] No security vulnerabilities
- [ ] Tests pass (especially calculation tests)
- [ ] No over-engineering or unnecessary abstractions
- [ ] Unused code removed completely
- [ ] Error handling only at boundaries
- [ ] Comments explain WHY, not WHAT
- [ ] Consistent naming conventions
- [ ] Mathematical accuracy verified against known results
- [ ] Edge cases handled
- [ ] No console.log or debug statements left in

---

## Performance Considerations

### Calculation Optimization

**Cache results:**
```javascript
// Memoize expensive Erlang C calculations
const memoizedErlangC = memoize((agents, traffic) => erlangC(agents, traffic));
```

**Debounce real-time recalculations:**
```javascript
// Don't recalculate on every keystroke
const debouncedCalculate = debounce(calculateStaffing, 300);
```

**Use Web Workers for heavy computations:**
```javascript
// Erlang X calculations in background thread
const worker = new Worker('erlangX-worker.js');
worker.postMessage({ agents, traffic, theta });
```

**Consider WebAssembly for Erlang X:**
- Most computationally intensive
- Can be 2-10x faster than JavaScript
- Worth exploring for professional-grade accuracy

### UI Performance

**Virtualize long lists:**
- Don't render 1000+ intervals at once
- Use react-window or similar

**Lazy load charts:**
- Only render visible charts
- Defer expensive visualizations

---

## Tooling Recommendations

### Recommended Stack (TBD)
- **Framework:** React / Vue / Svelte
- **TypeScript:** Recommended for type safety in calculations
- **Build Tool:** Vite (fast) or Create React App (batteries-included)
- **Styling:** CSS Modules / Tailwind CSS / styled-components
- **Charts:** Chart.js (simple) / Recharts (React) / D3.js (powerful)
- **CSV:** Papa Parse (robust, well-tested)
- **State:** Context API / Zustand / Redux / Pinia
- **Testing:** Vitest (modern) / Jest (established)
- **Decimal Math:** decimal.js or big.js

### Linting
Consider adding:
- ESLint for code quality
- Prettier for formatting
- Husky for pre-commit hooks

---

**Remember:** Keep it simple, test calculations thoroughly, and always read code before changing it!

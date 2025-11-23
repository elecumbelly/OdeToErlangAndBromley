# Contributing to OdeToErlang

Thank you for your interest in contributing to OdeToErlang! This document provides guidelines and instructions for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Mathematical Accuracy](#mathematical-accuracy)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior
- ✅ Be respectful and considerate
- ✅ Welcome newcomers and help them learn
- ✅ Focus on constructive feedback
- ✅ Assume good intentions
- ✅ Accept responsibility for mistakes

### Unacceptable Behavior
- ❌ Harassment, discrimination, or offensive comments
- ❌ Personal attacks or trolling
- ❌ Publishing others' private information
- ❌ Spam or commercial solicitation

---

## 💡 How Can I Contribute?

### Reporting Bugs

**Before Submitting:**
1. Check [existing issues](https://github.com/elecumbelly/OdeToErlang/issues) to avoid duplicates
2. Try to reproduce the bug in the latest version
3. Gather as much information as possible

**Bug Report Template:**
```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Enter values '...'
3. Click on '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- OdeToErlang Version: [e.g., v0.1.0]

**Additional Context**
Any other relevant information.
```

### Suggesting Features

**Feature Request Template:**
```markdown
**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
Describe your proposed solution.

**Alternatives Considered**
What alternatives have you considered?

**Use Case**
Describe a specific scenario where this would be useful.

**Priority**
Low / Medium / High

**Additional Context**
Mockups, examples, references.
```

### Contributing Code

We welcome code contributions! See [Development Setup](#development-setup) and [Development Workflow](#development-workflow) below.

### Improving Documentation

Documentation improvements are always appreciated:
- Fix typos or clarify confusing sections
- Add examples or tutorials
- Improve JSDoc comments
- Update technical references
- Translate content (future)

### Sharing Knowledge

- Answer questions in [Discussions](https://github.com/elecumbelly/OdeToErlang/discussions)
- Write blog posts or tutorials
- Create video walkthroughs
- Share use cases from your contact center

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and npm (or yarn/pnpm)
- **Git** 2.30+
- Modern code editor (VS Code recommended)
- Basic understanding of TypeScript and React

### Initial Setup

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/OdeToErlang.git
cd OdeToErlang/odetoerlang

# Add upstream remote
git remote add upstream https://github.com/elecumbelly/OdeToErlang.git

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 to see the app.

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Project Commands

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # Run TypeScript compiler

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
# Ensure you're on main and up-to-date
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions:**
- `feature/` - New features (e.g., `feature/erlang-b-model`)
- `fix/` - Bug fixes (e.g., `fix/csv-parsing-error`)
- `docs/` - Documentation updates (e.g., `docs/add-examples`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-calculations`)
- `test/` - Adding tests (e.g., `test/erlang-c-validation`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### 2. Make Your Changes

- Write clear, focused code
- Follow [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed
- Keep commits atomic and well-described

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Manual testing
npm run dev
# Test in browser at http://localhost:5173
```

### 4. Commit Your Changes

Follow the [Commit Message Format](#commit-message-format).

```bash
git add .
git commit -m "feat: add Erlang B blocking probability calculation"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

See [Pull Request Process](#pull-request-process) below.

---

## 📏 Coding Standards

### TypeScript Style Guide

#### Naming Conventions

```typescript
// PascalCase for types, interfaces, components
interface CalculationInputs { }
type ErlangModel = 'erlangC' | 'erlangA' | 'erlangX';
function InputPanel() { }

// camelCase for variables, functions, parameters
const trafficIntensity = calculateTraffic(volume, aht);
function calculateServiceLevel(agents: number, traffic: number) { }

// UPPER_SNAKE_CASE for constants
const DEFAULT_SHRINKAGE_PERCENT = 25;
const MAX_OCCUPANCY = 0.90;

// Prefix boolean variables with is/has/should
const isStable = agents > trafficIntensity;
const hasAbandonment = model !== 'erlangC';
```

#### File Organization

```typescript
// 1. Imports (external, then internal)
import { useState, useEffect } from 'react';
import { calculateErlangC } from '../lib/calculations/erlangC';

// 2. Type definitions
interface ComponentProps {
  value: number;
}

// 3. Constants
const DEFAULT_VALUE = 100;

// 4. Component or function
export default function MyComponent({ value }: ComponentProps) {
  // Component logic
}

// 5. Helper functions (if needed)
function helperFunction() {
  // Helper logic
}
```

#### Code Formatting

- **Indentation:** 2 spaces (no tabs)
- **Line length:** 100 characters max
- **Quotes:** Single quotes for strings, template literals for interpolation
- **Semicolons:** Required (ESLint enforced)
- **Trailing commas:** Use for multi-line arrays/objects

```typescript
// Good
const config = {
  volume: 1000,
  aht: 240,
  model: 'erlangC',
};

// Bad
const config = {
  volume: 1000,
  aht: 240,
  model: 'erlangC'
}
```

### React Component Guidelines

#### Component Structure

```typescript
import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onSave: (data: Data) => void;
}

export default function MyComponent({ title, onSave }: MyComponentProps) {
  // 1. State hooks
  const [value, setValue] = useState(0);

  // 2. Other hooks (useEffect, useCallback, etc.)
  useEffect(() => {
    // Effect logic
  }, [value]);

  // 3. Event handlers
  const handleChange = (newValue: number) => {
    setValue(newValue);
  };

  // 4. Helper functions
  const formatValue = (val: number) => {
    return val.toFixed(2);
  };

  // 5. Render
  return (
    <div>
      <h2>{title}</h2>
      <input
        type="number"
        value={value}
        onChange={(e) => handleChange(Number(e.target.value))}
      />
    </div>
  );
}
```

#### Component Best Practices

- ✅ Use functional components with hooks
- ✅ Extract reusable logic into custom hooks
- ✅ Keep components focused (single responsibility)
- ✅ Prop destructuring in function signature
- ✅ TypeScript interfaces for props
- ❌ Avoid inline styles (use Tailwind classes)
- ❌ Don't mutate props
- ❌ Avoid nested ternaries (extract to variables)

### Mathematical Code Standards

#### Precision and Validation

```typescript
// Always validate inputs
function calculateTrafficIntensity(
  volume: number,
  aht: number,
  intervalSeconds: number
): number {
  if (volume <= 0 || aht <= 0 || intervalSeconds <= 0) {
    return 0; // Handle edge cases explicitly
  }

  return (volume * aht) / intervalSeconds;
}

// Use safe iteration for factorials
function erlangC(agents: number, traffic: number): number {
  if (agents <= traffic) {
    return 1.0; // Unstable queue
  }

  // Iterative method (avoids factorial overflow)
  let inverseProbability = 1.0;
  for (let k = 1; k < agents; k++) {
    inverseProbability = 1 + (k / traffic) * inverseProbability;
  }

  const pwait = 1 / (1 + (1 - traffic / agents) * inverseProbability);
  return Math.min(1.0, Math.max(0.0, pwait)); // Clamp to [0, 1]
}
```

#### Documentation for Formulas

```typescript
/**
 * Calculates service level using Erlang C formula.
 *
 * The probability that a contact waits longer than the threshold time:
 * P(wait > t) = P(wait > 0) × e^(-(c-A)×t/AHT)
 *
 * Service Level = 1 - P(wait > t)
 *
 * @param agents - Number of available agents (c)
 * @param trafficIntensity - Traffic in Erlangs (A)
 * @param aht - Average Handle Time in seconds
 * @param thresholdSeconds - Service level threshold (e.g., 20 for 80/20)
 * @returns Service level as decimal (0-1)
 *
 * @example
 * calculateServiceLevel(14, 10, 180, 20) // Returns ~0.80 (80%)
 */
export function calculateServiceLevel(
  agents: number,
  trafficIntensity: number,
  aht: number,
  thresholdSeconds: number
): number {
  // Implementation
}
```

---

## 🧪 Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { calculateServiceLevel } from './erlangC';

describe('calculateServiceLevel', () => {
  it('should return ~80% service level for standard 80/20 scenario', () => {
    const sl = calculateServiceLevel(14, 10, 180, 20);
    expect(sl).toBeCloseTo(0.80, 2); // Within 0.01
  });

  it('should handle zero traffic', () => {
    const sl = calculateServiceLevel(10, 0, 180, 20);
    expect(sl).toBe(1.0); // 100% service level with no calls
  });

  it('should return 100% when agents exceed threshold', () => {
    const sl = calculateServiceLevel(1000, 10, 180, 20);
    expect(sl).toBeGreaterThanOrEqual(0.99);
  });

  it('should handle unstable queue (agents < traffic)', () => {
    const sl = calculateServiceLevel(5, 10, 180, 20);
    expect(sl).toBeLessThan(0.5); // Very low service level
  });
});
```

### Test Coverage Requirements

- **Unit Tests:** All calculation functions must have >90% coverage
- **Component Tests:** Critical user flows must be tested
- **Integration Tests:** CSV import → calculation → display flow
- **Edge Cases:** Test boundary conditions (0, negative, very large values)

### Mathematical Validation

**Critical:** All Erlang formulas must be validated against published references.

```typescript
// Test against known Erlang C table values
describe('Erlang C validation against published tables', () => {
  const testCases = [
    { agents: 13, traffic: 10, aht: 180, threshold: 20, expectedSL: 0.80 },
    { agents: 58, traffic: 50, aht: 240, threshold: 30, expectedSL: 0.90 },
    { agents: 145, traffic: 133, aht: 300, threshold: 20, expectedSL: 0.80 },
  ];

  testCases.forEach(({ agents, traffic, aht, threshold, expectedSL }) => {
    it(`A=${traffic}, c=${agents} should give SL≈${expectedSL * 100}%`, () => {
      const actual = calculateServiceLevel(agents, traffic, aht, threshold);
      expect(actual).toBeCloseTo(expectedSL, 2);
    });
  });
});
```

---

## 📝 Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring (no feature change)
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Maintenance tasks (dependencies, build config)

### Examples

```bash
# Feature
git commit -m "feat(erlangA): add abandonment probability calculation"

# Bug fix
git commit -m "fix(csv): handle empty rows in import"

# Documentation
git commit -m "docs(readme): add installation instructions"

# Detailed commit with body
git commit -m "feat(multichannel): add concurrent chat handling

Implements concurrent chat capacity where agents can handle
multiple chats simultaneously. Adds concurrency parameter to
channel configuration.

Closes #42"
```

### Scope Examples

- `erlangC`, `erlangA`, `erlangX` - Formula implementations
- `csv` - CSV import/export
- `ui` - User interface
- `charts` - Visualizations
- `multichannel` - Multi-channel features
- `docs` - Documentation
- `build` - Build system
- `deps` - Dependencies

---

## 🔍 Pull Request Process

### Before Submitting

- ✅ All tests pass (`npm test`)
- ✅ No linting errors (`npm run lint`)
- ✅ TypeScript compiles (`npm run type-check`)
- ✅ Code is formatted consistently
- ✅ Documentation is updated
- ✅ Commit messages follow convention
- ✅ Branch is up-to-date with main

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Changes Made
- Bullet list of specific changes
- Each change on a separate line
- Focus on WHAT changed, not HOW

## Testing
Describe how you tested your changes:
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] Tested in multiple browsers

## Screenshots (if applicable)
Add screenshots showing the change

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues
Closes #123
Relates to #456
```

### Review Process

1. **Automated Checks:** CI/CD runs tests, linting, type-checking
2. **Code Review:** Maintainer reviews code for quality and correctness
3. **Mathematical Review:** For formula changes, verify against references
4. **Feedback:** Address any requested changes
5. **Approval:** Once approved, PR will be merged
6. **Release:** Changes will be included in next release

### Review Criteria

- ✅ Code quality and readability
- ✅ Mathematical accuracy (for calculations)
- ✅ Test coverage
- ✅ Documentation completeness
- ✅ Performance impact
- ✅ Security considerations
- ✅ Backwards compatibility

---

## 🔬 Mathematical Accuracy

### Validation Requirements

All mathematical implementations must be:

1. **Validated against published references**
   - Academic papers
   - Published Erlang tables
   - Commercial WFM tool outputs

2. **Tested with known scenarios**
   ```typescript
   // Standard test case from Erlang C tables
   // A=10 Erlangs, SL=80/20 → requires 13-14 agents
   expect(solveAgents(10, 180, 0.80, 20)).toBe(13);
   ```

3. **Documented with formulas**
   - Include mathematical notation in comments
   - Reference original papers
   - Explain any approximations used

### Accuracy Standards

| Model | Target Accuracy | Validation Method |
|-------|----------------|-------------------|
| Erlang C | ±2% vs. published tables | Compare against textbook values |
| Erlang A | ±5% vs. academic papers | Cross-reference with research |
| Erlang X | ±2% vs. commercial tools | Validate against NICE, Verint |

### Edge Cases to Test

```typescript
// Always test these scenarios
describe('Edge cases', () => {
  it('handles zero volume', () => { /* ... */ });
  it('handles zero AHT', () => { /* ... */ });
  it('handles 100% shrinkage', () => { /* ... */ });
  it('handles impossible SLA (99.9/5)', () => { /* ... */ });
  it('handles very large volume (1M calls)', () => { /* ... */ });
  it('handles single agent queue', () => { /* ... */ });
  it('handles unstable queue (agents < traffic)', () => { /* ... */ });
});
```

---

## 📚 Documentation

### Code Documentation (JSDoc)

```typescript
/**
 * Solves for minimum agents required to meet service level target.
 *
 * Iteratively tests agent counts starting from minimum viable (based on
 * traffic and occupancy) until service level target is achieved.
 *
 * @param trafficIntensity - Workload in Erlangs (calls×AHT/interval)
 * @param aht - Average Handle Time in seconds
 * @param targetSL - Target service level as decimal (e.g., 0.80 for 80%)
 * @param thresholdSeconds - SL threshold in seconds (e.g., 20 for 80/20)
 * @param maxOccupancy - Maximum allowed occupancy as decimal (default 0.90)
 * @returns Minimum agents required, or null if target cannot be achieved
 *
 * @example
 * // For 10 Erlangs, 180s AHT, 80/20 SL target:
 * const agents = solveAgents(10, 180, 0.80, 20, 0.90);
 * console.log(agents); // 13
 *
 * @throws {Error} If inputs are invalid (negative values, etc.)
 *
 * @see {@link https://en.wikipedia.org/wiki/Erlang_(unit)#Erlang_C_formula}
 */
export function solveAgents(
  trafficIntensity: number,
  aht: number,
  targetSL: number,
  thresholdSeconds: number,
  maxOccupancy: number = 0.90
): number | null {
  // Implementation
}
```

### README and Guides

- Keep user-facing documentation simple and clear
- Use examples and screenshots
- Explain contact center concepts for newcomers
- Provide both quick-start and detailed guides

### Updating Documentation

When changing functionality, update:
- ✅ JSDoc comments in code
- ✅ README.md (if user-facing)
- ✅ CLAUDE.md (if affecting AI development)
- ✅ docs/FORMULAS.md (if mathematical)
- ✅ CHANGELOG.md (for releases)

---

## ❓ Questions?

- **General Questions:** [GitHub Discussions](https://github.com/elecumbelly/OdeToErlang/discussions)
- **Bug Reports:** [GitHub Issues](https://github.com/elecumbelly/OdeToErlang/issues)
- **Security Concerns:** Email maintainers privately (see GitHub profile)

---

## 🎉 Thank You!

Every contribution, no matter how small, makes OdeToErlang better for contact center professionals worldwide. We appreciate your time and effort!

**Happy Contributing!** 🚀

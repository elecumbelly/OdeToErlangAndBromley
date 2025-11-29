# JavaScript/TypeScript Conventions

Load this context when writing code in this project.

---

## Code Style

### Formatting
- **Indentation:** 2 spaces
- **Line length:** 100 characters max
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Trailing commas:** Yes, for multiline

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase | `calculateServiceLevel` |
| Components | PascalCase | `ServiceLevelChart` |
| Constants | UPPER_SNAKE_CASE | `MAX_AGENTS` |
| Variables | camelCase | `trafficIntensity` |
| Types/Interfaces | PascalCase | `CalculationResult` |
| Files | Match export | `ServiceLevelChart.tsx` |

---

## TypeScript

### Use Strict Types
```typescript
// Good
function calculate(agents: number, traffic: number): number {
  return agents / traffic;
}

// Bad - implicit any
function calculate(agents, traffic) {
  return agents / traffic;
}
```

### Interface vs Type
```typescript
// Use interfaces for objects
interface CalculationInput {
  agents: number;
  trafficIntensity: number;
  aht: number;
}

// Use types for unions, primitives
type Channel = 'voice' | 'chat' | 'email';
type Percentage = number; // 0-1 or 0-100 depending on context
```

### Export Named, Not Default
```typescript
// Good
export const ServiceLevelChart: FC = () => { };
export function calculateErlangC() { }

// Avoid
export default function calculateErlangC() { }
```

---

## React Patterns

### Functional Components Only
```typescript
// Always use FC with explicit props interface
interface Props {
  value: number;
  onChange: (value: number) => void;
}

export const NumberInput: FC<Props> = ({ value, onChange }) => {
  return <input type="number" value={value} onChange={e => onChange(+e.target.value)} />;
};
```

### Hooks Order
```typescript
export const Component: FC<Props> = (props) => {
  // 1. State hooks
  const [value, setValue] = useState(0);

  // 2. Context hooks
  const config = useContext(ConfigContext);

  // 3. Effect hooks
  useEffect(() => { }, []);

  // 4. Memos and callbacks
  const computed = useMemo(() => { }, []);
  const handler = useCallback(() => { }, []);

  // 5. Render
  return <div />;
};
```

---

## Mathematical Precision

### Use Appropriate Precision
```typescript
// For display: round appropriately
const displayFTE = Math.round(fte * 100) / 100; // 2 decimal places
const displayPercent = Math.round(percent * 10) / 10; // 1 decimal place

// For calculations: keep full precision
const internalValue = rawCalculation; // Don't round intermediate values
```

### Handle Edge Cases
```typescript
function calculateTrafficIntensity(volume: number, aht: number, interval: number): number {
  if (interval === 0) throw new Error('Interval cannot be zero');
  if (volume < 0) throw new Error('Volume cannot be negative');
  if (aht < 0) throw new Error('AHT cannot be negative');

  return (volume * aht) / interval;
}
```

---

## Testing

### Test File Location
```
src/lib/calculations/erlangC.ts
src/lib/calculations/erlangC.test.ts  # Co-located
```

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';
import { serviceLevel } from './erlangC';

describe('erlangC', () => {
  describe('serviceLevel', () => {
    it('returns ~80% for known Erlang C case', () => {
      const sl = serviceLevel(13, 10, 180, 20);
      expect(sl).toBeCloseTo(0.80, 2);
    });

    it('throws for invalid agents', () => {
      expect(() => serviceLevel(0, 10, 180, 20)).toThrow();
    });
  });
});
```

### Test Naming
- Describe WHAT not HOW
- Use "should" or simple assertion
- Include input/output context

---

## Imports

### Order
```typescript
// 1. React/framework
import { FC, useState, useEffect } from 'react';

// 2. Third-party libraries
import { Chart } from 'recharts';

// 3. Internal modules (absolute paths)
import { calculateErlangC } from '@/lib/calculations/erlangC';

// 4. Relative imports
import { Button } from './Button';

// 5. Styles
import styles from './Component.module.css';
```

### Path Aliases
```typescript
// Use @ alias for src/
import { utils } from '@/lib/utils';  // Good
import { utils } from '../../../lib/utils';  // Avoid deep relative
```

---

## Error Handling

### Validation at Boundaries
```typescript
// Validate user input
function parseVolume(input: string): number {
  const value = parseInt(input, 10);
  if (isNaN(value) || value < 0) {
    throw new Error('Volume must be a non-negative integer');
  }
  return value;
}

// Trust internal types
function calculate(input: CalculationInput): CalculationResult {
  // No need to re-validate - TypeScript guarantees the shape
  return { ... };
}
```

### Error Messages
- Be specific about what went wrong
- Suggest how to fix it
- Include relevant values

```typescript
throw new Error(
  `Shrinkage must be between 0 and 1, got ${shrinkage}`
);
```

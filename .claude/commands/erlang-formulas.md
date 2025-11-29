# Erlang Formulas Reference

Load this context when implementing or testing Erlang calculations.

---

## The Erlang Formula Family

### Erlang B (1917)
**Use Case:** Blocking systems with no queue (trunk lines, busy signals)
**Assumptions:**
- Blocked calls are lost (no retry)
- No queue/waiting
- Exponential service times

**Formula:** Calculates blocking probability P(block)
**Application:** Rarely used in modern contact centers (most have queues)

---

### Erlang C (1917)
**Use Case:** Basic queuing with infinite patience
**Assumptions:**
- Customers wait indefinitely (never abandon)
- Poisson arrival process
- Exponential service times
- Homogeneous agents (all same skill level)

**Limitations:** Overestimates service level (ignores abandonment)

**Formulas:**
```
P(wait > 0) = Erlang C formula
P(wait > t) = P(wait > 0) × e^(-(c-A)×t/AHT)
where: c = agents, A = traffic intensity (Erlangs)
```

---

### Erlang A (2004)
**Use Case:** Queuing with abandonment/patience
**Assumptions:**
- Customers abandon if wait exceeds patience threshold
- Exponential patience distribution
- Exponential service times
- No retrials

**Improvements over C:**
- More realistic service level predictions
- Accounts for abandonment behavior
- Better for modern contact centers

**Formula:** Extension of Erlang C with abandonment parameter θ (theta)

---

### Erlang X (2012+)
**Use Case:** Most accurate model for modern contact centers
**Assumptions:**
- Realistic abandonment behavior (time-dependent)
- Customer retrials modeled
- Virtual waiting time concept
- Accounts for non-exponential distributions

**Advantages:**
- Most accurate predictions (typically ±2% vs. ±10-15% for Erlang C)
- Handles complex abandonment patterns
- Models customer retrial behavior
- Works with time-varying arrival rates

**Complexity:** More computationally intensive than C or A

---

## Implementation Priority

1. **Phase 1:** Erlang C (simplest, widely understood baseline)
2. **Phase 2:** Erlang A (improved accuracy with abandonment)
3. **Phase 3:** Erlang X (professional-grade accuracy)
4. **Optional:** Erlang B (for specialized trunk/blocking scenarios)

**CRITICAL:** Allow users to choose which formula to use.

---

## Erlang C Implementation

### Core Formula (Iterative Method)
```javascript
// Calculate Erlang C probability (probability of waiting)
function erlangC(agents, trafficIntensity) {
  if (agents <= trafficIntensity) return 1.0; // Unstable queue

  // Calculate using iterative method to avoid factorial overflow
  let inverseProbability = 1.0;
  for (let k = 1; k < agents; k++) {
    inverseProbability = 1 + (k / trafficIntensity) * inverseProbability;
  }

  const pwait = 1 / (1 + (1 - trafficIntensity / agents) * inverseProbability);
  return pwait;
}

// Probability wait time exceeds threshold
function probabilityWaitExceedsThreshold(agents, trafficIntensity, aht, threshold) {
  const pwait = erlangC(agents, trafficIntensity);
  const result = pwait * Math.exp(-(agents - trafficIntensity) * (threshold / aht));
  return result;
}

// Service level calculation
function serviceLevel(agents, trafficIntensity, aht, targetSeconds) {
  return 1 - probabilityWaitExceedsThreshold(agents, trafficIntensity, aht, targetSeconds);
}
```

### Agent Solver
```javascript
// Find minimum agents to meet service level target
function solveAgents(trafficIntensity, aht, targetSL, thresholdSeconds) {
  let agents = Math.ceil(trafficIntensity); // Start at minimum
  const maxAgents = Math.ceil(trafficIntensity * 3); // Safety limit

  while (agents < maxAgents) {
    const sl = serviceLevel(agents, trafficIntensity, aht, thresholdSeconds);
    if (sl >= targetSL) return agents;
    agents++;
  }

  return null; // Cannot achieve target
}
```

---

## Erlang A Implementation Notes

**Key Differences from Erlang C:**
- Requires patience parameter θ (theta) = AveragePatience / AHT
- Accounts for abandonment in queue
- More complex calculation (use numerical methods)

```javascript
// Simplified Erlang A (requires numerical integration for full accuracy)
function erlangA(agents, trafficIntensity, theta) {
  // theta = average patience time / AHT
  // Use approximation or numerical solver
  // Reference: Garnett, Mandelbaum & Reiman (2002)

  // Implementation requires solving transcendental equations
  // Consider using numerical libraries (e.g., numeric.js)
}
```

---

## Erlang X Implementation Notes

**Complexity:**
- Most accurate but computationally intensive
- Requires iterative equilibrium solver
- Models retrials and virtual waiting time

**Recommended Approach:**
1. Start with Erlang C for MVP
2. Add Erlang A for moderate accuracy improvement
3. Implement Erlang X for professional-grade accuracy
4. Allow user to toggle between models

**Performance Considerations:**
- Cache calculation results
- Use Web Workers for heavy computations
- Consider WebAssembly for Erlang X
- Debounce real-time recalculations

---

## Mathematical Accuracy Requirements

### Precision
- Use at least double-precision floating point
- Consider decimal.js or big.js for financial calculations
- Round FTE to 2 decimal places, percentages to 1 decimal place

### Validation
- Test against published Erlang tables (e.g., A=10, SL=80/20 should give ~13-14 agents)
- Cross-reference with commercial tools (Aspect, NICE IEX, Verint)
- Document any approximations or simplifications used

### Edge Cases
- Zero volume: Return 0 FTE
- AHT = 0: Handle division by zero
- 100% shrinkage: Infinite FTE required (error condition)
- Impossible SLA (e.g., 99.9/5 with low agents): Return realistic "cannot achieve" message

---

## Testing Strategy

### Unit Test Cases
```javascript
// Test against known Erlang C results
test('Erlang C: Traffic=10, Agents=13, SL 80/20', () => {
  const sl = serviceLevel(13, 10, 180, 20);
  expect(sl).toBeCloseTo(0.80, 2); // Within 2 decimal places
});

test('Erlang C: Traffic=50, Agents=58, SL 90/30', () => {
  const sl = serviceLevel(58, 50, 240, 30);
  expect(sl).toBeCloseTo(0.90, 2);
});
```

### Validation Resources
- Published Erlang C tables (numerous textbooks)
- Online calculators (verify their accuracy first!)
- Commercial WFM tool outputs (if available)

---

## Common Pitfalls

1. **Factorial Overflow:** Never use `factorial(n)` directly - use iterative methods
2. **Division by Zero:** Check for AHT=0, agents=0, trafficIntensity=0
3. **Unstable Queues:** When agents < trafficIntensity, queue grows infinitely
4. **Rounding Errors:** Use consistent rounding (e.g., always round FTE to 2 decimals)
5. **Unit Mismatches:** Keep time in consistent units (seconds recommended)
6. **Floating Point Precision:** Use decimal libraries for financial/FTE calculations

---

## Basic Calculation Flow

### Erlang C Flow
```
1. Traffic Intensity (A) = (Call Volume × AHT) / Interval Length
2. Calculate Erlang C(A, c) for different agent counts (c)
3. Find minimum c where Service Level >= Target
4. Apply shrinkage: Total FTE = c / (1 - Shrinkage%)
```

### With Erlang A (Abandonment)
```
1. Calculate traffic intensity (A)
2. Define patience parameter θ = Average Patience Time / AHT
3. Calculate Erlang A(A, c, θ) iteratively
4. Find minimum c for target service level accounting for abandonment
5. Apply shrinkage
```

### With Erlang X
```
1. Calculate offered load including retrials
2. Model virtual waiting time distribution
3. Calculate abandonment probability function
4. Iterate to find equilibrium staffing level
5. Apply shrinkage and occupancy constraints
```

---

## Academic References

### Erlang B & C (Classical)
- Erlang, A.K. (1917) - "Solution of some Problems in the Theory of Probabilities"
- Reference implementations: Published Erlang C tables for verification

### Erlang A
- Garnett, Mandelbaum & Reiman (2002) - "Designing a Call Center with Impatient Customers"
- Palm (1953) - "Research on Telephone Traffic Carried by Full Availability Groups"

### Erlang X
- Janssen, Koole & Pot (2011) - "Erlang Loss Models with Delayed Feedback"
- Baccelli & Hebuterne (1981) - "On Queues with Impatient Customers"
- Koole & Mandelbaum (2002) - "Queueing Models of Call Centers: An Introduction"

### Implementation Algorithms
- Use iterative methods for Erlang C (avoid factorial overflow)
- Newton-Raphson method for solving agent count
- Numerical integration for Erlang A patience distributions
- Monte Carlo simulation for validation

# Mathematical Formulas Reference

**OdeToErlangAndBromley Formula Documentation**

This document provides mathematical reference for the formulas used in the OdeToErlangAndBromley engine. Implementations are validated against academic references (Garnett et al., 2002) and industry standards.

---

## Notation Standards

We use the following standard notation:

- `A`: Traffic Intensity (Erlangs) = `(Volume × AHT) / Interval`
- `c`: Number of Agents (Servers)
- `AHT`: Average Handle Time (seconds)
- `t`: Target Service Level Threshold (seconds)
- `SL`: Service Level (Probability of answer within `t`)

### Erlang A Parameters

Erlang A introduces customer patience.

- **θ (Theta)**: **Abandonment Rate** = `1 / Average Patience`. This is the standard academic definition (rate of the exponential distribution).
- **τ (Tau)**: **Patience Ratio** = `Average Patience / AHT`. This dimensionless ratio is used in internal calculations to normalize patience against service time.

> **Note on Implementation:**
> The codebase uses the variable name `theta` in `ErlangAMetrics` to return the **Patience Ratio (τ)** (`Patience/AHT`) for easier interpretation by WFM professionals (who think in terms of "how many times the AHT will they wait?"). Internally, the calculation engine respects the standard rate-based math.

---

## Core Formulas

### 1. Erlang C (Infinite Patience)

Probability that a call waits:

```math
P(wait > 0) = \frac{\frac{A^c}{c!} \frac{c}{c-A}}{\sum_{k=0}^{c-1} \frac{A^k}{k!} + \frac{A^c}{c!} \frac{c}{c-A}}
```

Service Level:

```math
SL_{C} = 1 - P(wait > 0) \cdot e^{-(c-A)\frac{t}{AHT}}
```

### 2. Erlang A (Finite Patience)

Models abandonment.

Service Level (Answered within `t`):

```math
SL_{A} = 1 - P(wait > 0) \cdot \frac{c-A}{c-A + \tau^{-1}} \cdot e^{-\gamma t}
```

Where `γ` (effective service rate) is:

```math
\gamma = \frac{c - A + \tau^{-1}}{AHT}
```

Abandonment Probability:

```math
P(Ab) = \frac{P(wait > 0)}{1 + \tau(c-A)}
```

*(Note: This uses the Tau notation where `τ = Patience/AHT`)*

### 3. Erlang B (Loss / Blocking)

Erlang B models a pure loss system (no queue): contacts are blocked when all servers/lines are busy.

```math
B(c, A) = \frac{\frac{A^c}{c!}}{\sum_{k=0}^{c} \frac{A^k}{k!}}
```

Where:
- `A` is traffic intensity (Erlangs)
- `c` is servers/lines/agents
- `B(c, A)` is blocking probability

---

## Inverse Calculation Logic ("Solve For" Mode)

Standard capacity planning solves for `c` (Agents) given a target `SL`. OdeToErlang supports **Inverse Calculation** where `c` is fixed and we solve for the achieved `SL`.

### 1. Requirements Mode (Forward)
The engine uses **Binary Search** to find the minimum integer `c` such that `SL(c, A, t, AHT) >= TargetSL`. 
- **Complexity:** `O(log N)` where N is the maximum possible agent count (capped at 10,000).
- **Efficiency:** Much faster than linear iterative loops for large contact centres.

### 2. Constraint Mode (Inverse)
When "Fixed Headcount" is selected:
1.  **Productive FTE:** Calculate `c_effective = Headcount * (1 - Shrinkage)`.
2.  **Achieved Metrics:** The engine directly evaluates the Erlang A/B/C formula using `c_effective`.
3.  **Real-world Impact:** This reveals the performance "cliff" during demand spikes, as Service Level decreases non-linearly when volume increases against a fixed staff count.

---

## Validation

All formulas are unit-tested against:
1.  **Standard Tables:** Erlang C tables for A=10..100.
2.  **Academic Papers:** Garnett et al. (2002) for Erlang A.
3.  **Edge Cases:** Zero volume, single agent, unstable queues (`c < A`), and loss systems.

See `src/lib/calculations/*.test.ts` for the exact test suites.

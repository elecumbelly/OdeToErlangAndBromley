# Ultrathink Plan: Shared Math Model & Architecture

**Objective:** Unify all staffing calculations under a single, orchestrated math model that drives every page of the application consistently.

## 1. Scope Analysis: Erlang Core Status

| Model | Status | Current Usage | Gap Analysis |
|-------|--------|---------------|--------------|
| **Erlang C** | ✅ `implemented_core` | Primary driver in Calculator UI | Lacks consistent validation across pages |
| **Erlang A** | ✅ `implemented_core` | Available via Model Selector | Inputs (patience) not rigorously enforced via shared API |
| **Erlang X** | ✅ `implemented_core` | Available via Model Selector | "Ghost" to some parts of the system; needs first-class citizen status |

**Conclusion:** We have the *engines* (the formulas in `src/lib/calculations/`), but we lack the *chassis* (a single orchestrating model) that drives the car. Pages currently manually assemble inputs and call specific functions, leading to potential inconsistency.

## 2. Recommendations

### R1. Math API Unification (`ErlangMathEngine`)
**Goal:** Create a canonical entry point for all Erlang math.
*   **Action:** Refactor `src/lib/calculations/modelRunner.ts` into a robust `ErlangMathEngine`.
*   **API Signature:**
    ```typescript
    interface ErlangEngineInput {
      model: 'C' | 'A' | 'X';
      workload: { volume: number; aht: number; intervalSeconds: number };
      constraints: { targetSL: number; targetTime: number; maxOccupancy: number };
      behavior: { shrinkage: number; patience?: number; retrialRate?: number };
    }

    interface ErlangEngineOutput {
      agents: number;
      metrics: { sl: number; asa: number; occupancy: number; abandonRate: number };
      diagnostics: { traffic: number; utilization: number };
    }

    function calculateStaffing(input: ErlangEngineInput): ErlangEngineOutput;
    ```
*   **Benefit:** Decouples the "What" (I need staffing) from the "How" (using Erlang X with these specific parameters).

### R2. Scenario Model Awareness
**Goal:** Make the choice of mathematical model persistent and reproducible.
*   **Action:** Update Database Schema.
    *   Table: `Scenarios` (or `Forecasts`)
    *   Add Column: `erlang_model TEXT DEFAULT 'erlangC'`
*   **App Flow:**
    *   Scenario Editor requires model selection.
    *   `ForecastEngine` reads this model type from the DB, not from UI state.
    *   Prevents "drift" where a saved scenario produces different results depending on what the user last clicked in the calculator tab.

### R3. Time-Bound Assumption Pipeline (`AssumptionResolver`)
**Goal:** A single source of truth for converting "Business Assumptions" into "Math Inputs".
*   **Action:** Create `src/lib/forecasting/assumptionResolver.ts`.
*   **Logic:**
    *   Input: `CampaignID`, `DateRange`
    *   Process: Fetch all `Assumptions` rows valid for that range.
    *   Output: A normalized stream of `ErlangEngineInput` objects (one per interval).
*   **Benefit:** Changing the "Jan 2026 AHT" assumption in the DB automatically propagates to every forecast using that date range, regardless of whether it's viewed in the Calculator, Forecast, or Budget page.

### R4. Consistent Validation Layer
**Goal:** Guardrails that apply everywhere.
*   **Action:** Centralize validation in `src/lib/calculations/inputValidation.ts`.
*   **Features:**
    *   Clamp `occupancy` (0-1).
    *   Enforce `patience > 0` for Erlang A/X.
    *   Warn on unrealistic `aht` (<10s or >3600s).
*   **Integration:** `ErlangMathEngine` calls this *before* attempting any math.

### R5. Forecast Engine Abstraction
**Goal:** Separation of concerns.
*   **Layer 1 (Math):** `ErlangMathEngine` (Stateless, Pure Math)
*   **Layer 2 (Data Prep):** `AssumptionResolver` (DB -> Math Inputs)
*   **Layer 3 (Orchestration):** `ForecastEngine` (Iterates intervals, calls Layer 1 & 2, persists results)

### R6. Cross-Model Test Matrix
**Goal:** Prove parity and correctness.
*   **Action:** Expand test suite.
*   **Matrix:**
    *   Test Case 1: Low Volume, High Variance -> Compare C vs A vs X.
    *   Test Case 2: High Volume, High Stability -> Verify convergence.
    *   Test Case 3: Extreme Occupancy -> Verify failure modes match safely.

## 3. Implementation Plan (Immediate Steps)

1.  **Assumptions UI:** Build the UI to populate the `Assumptions` table (Pre-requisite for R3).
2.  **AssumptionResolver:** Build the resolver to read those assumptions (R3).
3.  **ForecastEngine:** Wire the resolver to the existing `modelRunner` (Proto-R5).
4.  **Refactor:** Upgrade `modelRunner` to full `ErlangMathEngine` (R1).

This plan ensures we build the *data* capabilities first (Assumptions), then the *orchestration* (Forecasting), and finally refine the *core* (Math API) without breaking existing features.

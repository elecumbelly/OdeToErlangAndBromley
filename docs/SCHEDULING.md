# Automated Scheduling Engine

OdeToErlang includes a sophisticated scheduling engine designed to bridge the gap between forecasted volume and individual staff rosters.

## 📐 Core Algorithm: The "Greedy Skill-Match"

The primary scheduling algorithm follows a multi-stage optimization process:

### 1. Coverage Requirements Generation
Before scheduling, the engine converts your **Forecast Volume** and **AHT** into interval-level demand. 
- It uses the selected Erlang model (A, B, or C) to calculate the **Required Productive Agents** for every 15/30/60 minute interval.
- These requirements are tagged by **Skill ID**.

### 2. Staff Allocation (Greedy Pass)
The engine iterates through the scheduling period (e.g., 7 days) and assigns shifts based on:
- **Skill Priority:** High-volume skills are filled first.
- **Availability:** Only staff marked as "Active" and possessing the required skills are considered.
- **Multi-Skilling:** Staff with multiple skills are prioritized for "blended" intervals if "Skill Switching" is enabled in the plan.

### 3. Constraint Validation
Every assigned shift is validated against your **Plan Rules**:
- **Max Weekly Hours:** Defaults to 40h. The engine stops assigning shifts to an individual once this is reached.
- **Min Rest Hours:** Ensures a legal gap (e.g., 11h) between the end of one shift and the start of the next.
- **Shift Templates:** Shifts are only created using valid templates (e.g., 8h work + 1h lunch).

## 🧩 Optimization Methods

In the **Scheduling Tab**, you can run an **A/B Comparison** between different methods:

| Method | Logic | Best For |
|--------|-------|----------|
| **Greedy Fill** | Fills intervals chronologically. Fast and predictable. | Simple, stable environments. |
| **Local Search** | Generates a baseline then iteratively swaps staff to reduce "Gaps" and "Overstaffing". | Complex multi-skill environments. |
| **Solver (Alpha)** | Mathematical optimization targeting the lowest overall cost. | Large-scale operations. |

## 🍱 Shift Structure
The engine doesn't just create "Start/End" times; it builds a full shift sequence:
1. **Work Blocks:** Based on demand intervals.
2. **Break Logic:** Automatically inserts 15m breaks into valid windows (e.g., between hour 2 and 4).
3. **Lunch Logic:** Automatically inserts 30-60m unpaid segments into the midday window.

## 📊 Performance Metrics
After a run, the engine calculates:
- **Coverage %:** What percentage of total required minutes are actually manned.
- **Gap Minutes:** Total minutes where the queue is understaffed.
- **Overstaff Minutes:** "Waste" where you have more agents than required.
- **Cost Estimate:** Calculated based on the `HOURLY_RATE` defined in the engine.

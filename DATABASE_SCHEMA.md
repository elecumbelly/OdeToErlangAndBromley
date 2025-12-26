# OdeToErlangAndBromley - Database Schema

**Platform:** Web (SQLite via `sql.js`, persisted in IndexedDB)  
**Source of truth:** `odetoerlang/src/lib/database/schema.sql`  
**Migrations:** `odetoerlang/src/lib/database/initDatabase.ts` (`CURRENT_SCHEMA_VERSION = 3`)

This file is a human-readable overview. For exact DDL (columns, constraints, indexes), use `odetoerlang/src/lib/database/schema.sql`.

---

## Tables (31 total)

### Schema Versioning
- `schema_version` — applied schema versions.

### Staff & Organization
- `Staff` — employee records (includes `primary_role_id`, `employment_type`, `manager_id`, `site_id`).
- `Roles` — role definitions and reporting hierarchy.
- `Skills` — skill catalog.
- `StaffSkills` — staff ↔ skills with proficiency and acquisition date.
- `StaffSecondaryRoles` — staff ↔ additional roles.
- `Sites` — physical locations and capacities.

### Clients & Commercials
- `Clients` — BPO customers.
- `Campaigns` — work units per client (includes SLA targets and `concurrency_allowed`).
- `Contracts` — commercial agreements.
- `BillingRules` — billing models/rates, optionally scoped to a campaign and date range.

### Planning & Assumptions
- `Assumptions` — time-bound planning parameters (AHT, shrinkage, SLA, occupancy, patience).
- `CalendarEvents` — capacity-impacting events with `productivity_modifier` and optional filters.
- `ProductivityCurves` — productivity by tenure or other curve definition.
- `EventAssignments` — event ↔ staff assignments (for scoped impacts).

### Scenarios, Forecasts, Historical
- `Scenarios` — scenario definitions (includes `erlang_model` = `'B' | 'C' | 'A'`).
- `Forecasts` — stored forecast outputs tied to scenario/campaign/date.
- `HistoricalData` — imported interval-level historical performance data.

### Scheduling & Optimization
- `SchedulePlans` — planning horizons with interval size and scheduling rules.
- `CoverageRequirements` — interval-level demand by skill.
- `ShiftTemplates` — standard shift definitions (paid/unpaid minutes + breaks).
- `OptimizationMethods` — scheduling engines and versions.
- `ScheduleRuns` — optimization runs (supports A/B comparisons).
- `Shifts` — assigned shifts per staff member.
- `ShiftSegments` — work/break/lunch segments with skill assignments.
- `ScheduleMetrics` — run-level coverage and cost KPIs.
- `ScheduleViolations` — constraint violations by run/staff/date.

### Resources, Attrition, Recruitment
- `SupportingResources` — seat/licenses/facility constraints.
- `AttritionCurves` — attrition models by tenure ranges.
- `RecruitmentPipeline` — hiring funnel stages.
- `RecruitmentRequests` — hiring demand tracking.

---

## Notes

- Database initialization and persistence are handled in-browser; there is no server-side database.
- If you change `schema.sql`, update the migration logic and bump `CURRENT_SCHEMA_VERSION`.

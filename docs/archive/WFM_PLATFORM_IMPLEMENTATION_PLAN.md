# OdeToErlang WFM Platform - Implementation Plan
**Comprehensive Workforce Management System for BPO/Contact Centres**

**Date:** 2025-11-23
**Scope:** Transform simple calculator into enterprise-grade offline WFM platform
**Target Platform:** iOS (SwiftUI + Swift + SQLite + CoreML)
**License:** MIT
**Copyright:** 2025 SteS

---

## 🎯 Executive Summary

### Transformation Scope

**FROM:** Simple Erlang calculator (single page, no persistence, basic calculations)
**TO:** Full enterprise WFM platform (6+ pages, historical data, forecasting, workforce planning, client management)

**Complexity Level:** This is **enterprise-grade WFM software** competing with commercial tools like:
- NICE IEX WFM
- Verint Monet WFM
- Aspect Workforce Management
- Calabrio WFM
- Genesys PureCloud WFM

**Development Effort Estimate:** 800-1200 hours (6-9 months full-time equivalent)

---

## 📊 Scope Comparison

| Feature | Current (Simple Calculator) | Redesigned (WFM Platform) |
|---------|---------------------------|---------------------------|
| **Pages** | 1 calculator + 8 supporting | 6 core dashboards + calendar + supporting |
| **Data Storage** | None (ephemeral) | SQLite database (persistent) |
| **Forecasting** | None | Prophet ML + Classical Erlang |
| **Time Horizon** | Single interval | Historical (3 years) + Future (12+ months) |
| **Workforce Planning** | Agents only | Agents + TLs + QA + Trainers + Managers |
| **Client Management** | None | Multi-client BPO with contracts & billing |
| **Calendar System** | None | Multi-resolution event planning |
| **Assumptions** | Global static | Time-bound dynamic |
| **Shrinkage** | Single % | Base + Planned + Dynamic (decomposed) |
| **Resources** | None | IT licences, seats, facilities |
| **Attrition** | None | Time-based + tenure-weighted curves |
| **Recruitment** | None | Pipeline modelling with lead times |
| **Scenario Comparison** | Basic | A/B testing with versioning |
| **Data Model Tables** | 0 | 10+ core tables |

---

## 🏗️ System Architecture Overview

### Technology Stack

**Platform:** iOS 16+ (SwiftUI)

**Core Technologies:**
- **UI:** SwiftUI (declarative, modern)
- **Database:** SQLite (Core Data or GRDB.swift wrapper)
- **Forecasting:**
  - CoreML (for Prophet model inference)
  - Custom Swift (for Erlang calculations)
- **State Management:** SwiftUI @Observable or Combine
- **Charts:** Swift Charts (native visualisation)
- **Calendar:** Custom EventKit-style implementation
- **CSV Import/Export:** TabularData framework or custom parser
- **PDF Generation:** PDFKit (for reporting)

**Key Design Principles:**
1. **Offline-First:** No internet required (all calculations local)
2. **Time-Bound Everything:** No permanent global settings
3. **Scenario Versioning:** Save/compare multiple "what-if" scenarios
4. **Multi-Resolution:** Individual → Team → Campaign → Client → Site → Global
5. **Event-Driven:** Calendar events drive capacity changes

---

## 📋 Application Pages (Detailed Requirements)

### 1. Calculator (Assumptions + Historical View)

**Purpose:** Back-of-envelope calculations + historical analysis

**Features:**
- **CSV Import:** Upload 3+ years historical data (optional)
  - Columns: Date, Time, Channel, Volume, AHT, Abandons, SLA Achieved, Actual FTE
  - Validation: Check for missing data, outliers, format errors

- **Assumptions Panel:**
  - AHT (seconds) - time-bound by date range
  - Occupancy policy (%) - time-bound
  - SLA target (80/20 format) - time-bound
  - Abandon curve (average patience) - time-bound
  - Shrinkage baseline (%) - time-bound
  - Concurrency rules (for future MLM - multi-line messaging)
  - Model selection: Erlang C / A / X

- **Instant Staffing Calculator:**
  - Input: Volume, AHT, SLA target
  - Output: Required agents, FTE, occupancy, ASA
  - Real-time recalculation

- **Historical Analysis Panel (if data imported):**
  - Chart: Historical demand by day/week/month
  - Chart: SLA achievement over time
  - Chart: Abandon rate trends
  - Chart: Required FTE vs Actual FTE (staffing gap)
  - Table: Summary statistics (mean, median, p90, p95)

**UI Layout:**
- Top: Import button + status indicator
- Left: Assumptions panel (scrollable)
- Middle: Instant calculator
- Right: Historical charts (if data exists)

**Technical Notes:**
- Store imported data in `HistoricalData` table
- Store assumptions in `Assumptions` table with `valid_from` and `valid_to` dates
- Index by date for fast querying

---

### 2. Forecasting (Demand & Capacity)

**Purpose:** Predict future demand and required headcount

**Features:**
- **Forecast Demand:**
  - Classical Erlang queueing model (baseline)
  - Prophet/ML time series (if historical data exists)
  - Manual adjustment (user overrides)

- **Forecast Required Headcount:**
  - Apply Erlang C/A/X to forecasted demand
  - Apply occupancy policy
  - Apply dynamic shrinkage from calendar events
  - Output: Daily required productive hours + required FTE

- **A/B Scenario Comparison:**
  - Model vs Model (Erlang C vs Prophet)
  - Client Forecast vs System Forecast
  - Assumption Change vs Assumption Change (e.g., "What if AHT improves 10%?")
  - Side-by-side charts + difference highlighting

- **Capacity Constraint Toggle:**
  - "Respect current capacity?" Yes/No
  - If Yes: Show SLA risk when demand exceeds capacity
  - If No: Show unconstrained FTE requirement

**UI Layout:**
- Top: Forecast controls (date range, model selector, scenario selector)
- Main: Large chart showing forecasted demand + required FTE over time
- Bottom: Scenario comparison panel (split view)
- Right: Capacity constraint settings + warnings

**Technical Notes:**
- Store forecasts in `Forecasts` table with `model_type`, `scenario_id`, `created_at`
- Store scenarios in `Scenarios` table (versioned)
- Prophet model: Train offline (Python) → Export to CoreML → Inference in Swift
- Cache forecast results for performance

---

### 3. Strategic Workforce Planning

**Purpose:** Model future organisational structure and recruitment needs

**Features:**
- **Staffing Structure Builder:**
  - Roles: Agents, Team Leaders, QA, Trainers, Managers, Specialists
  - Define role ratios (e.g., 1 TL per 10 agents)
  - OR: Workload-based QA modelling:
    - QA sample rate (e.g., 5% of contacts)
    - QA handling time per sample
    - Calculate required QA FTE

- **Attrition Modelling:**
  - Time-bound attrition curves (higher churn for new hires)
  - Formula: `Attrition(tenure) = base_rate × tenure_multiplier(months)`
  - Example: New hires (0-3 months): 40% annual, Tenured (12+ months): 15% annual
  - Input: Historical attrition data by tenure bracket

- **Recruitment Pipeline Modelling:**
  - Lead time distribution (time from requisition to start date)
  - Probability of failure/rejection at each stage:
    - Application → Screen: 70% pass
    - Screen → Interview: 50% pass
    - Interview → Offer: 40% pass
    - Offer → Acceptance: 80% pass
    - Acceptance → Start: 90% show up
  - Hiring capacity limits (max recruits per month)

- **Outputs:**
  - Monthly hiring plan (FTE to recruit)
  - Attrition forecast (expected losses by role)
  - Net headcount projection (hires - attrition)
  - Role distribution over time (pyramid chart)

**UI Layout:**
- Top: Organisational structure builder (drag-drop roles)
- Left: Attrition curve editor (chart + table)
- Middle: Recruitment pipeline visualisation (funnel chart)
- Right: Hiring plan timeline (Gantt-style)

**Technical Notes:**
- Store roles in `Roles` table
- Store staff in `Staff` table with `role_id`, `tenure_start_date`, `attrition_probability`
- Store recruitment pipeline in `RecruitmentPipeline` table
- Calculate monthly: `RequiredHires = (ForecastedFTE - CurrentFTE + ExpectedAttrition) / (Pipeline Success Rate)`

---

### 4. Future Planned Shrinkage

**Purpose:** Plan events that reduce productive capacity

**Features:**
- **Event Types:**
  - Training (multi-day courses)
  - Onboarding (new hire ramp-up)
  - Town halls, compliance days, mass absence days
  - System downtime (planned maintenance)
  - Partial productivity periods (e.g., "Learning new system: 50% productivity for 2 weeks")

- **Training Productivity Curve:**
  - Apply learning curve after training event
  - Example: Day 1 post-training = 40%, Day 7 = 70%, Day 30 = 100%
  - User-configurable curve (S-curve, linear, exponential)

- **Rule-Based Event Assignment:**
  - Filter criteria:
    - By skill (e.g., "All chat agents")
    - By tenure (e.g., "Hired after 2024-06-01")
    - By start date (e.g., "Started in last 90 days")
    - By campaign (e.g., "Campaign X only")
    - By client (e.g., "Client ABC staff")
    - By location (e.g., "London site")
  - Boolean logic: AND, OR, NOT

- **Event Scheduling:**
  - Drag-drop on calendar
  - Conflict detection (e.g., "Trainer double-booked")
  - Capacity warnings (e.g., "Training 50% of staff will breach SLA")

**UI Layout:**
- Top: Event library (templates for common events)
- Left: Rule builder (filter criteria selector)
- Centre: Calendar view (day/week/month resolution)
- Right: Event details panel + productivity curve editor

**Technical Notes:**
- Store events in `CalendarEvents` table with `event_type`, `start_date`, `end_date`, `productivity_modifier`
- Store event rules in `EventRules` table (JSON or relational)
- Store productivity curves in `ProductivityCurves` table
- Calculate daily productive hours: `BaseHours × (1 - Shrinkage) × ProductivityModifier × (1 - EventImpact)`

---

### 5. Supporting Resources

**Purpose:** Model non-people constraints (IT, facilities)

**Features:**
- **IT Licences:**
  - ACD seats (phone system)
  - CRM licences (Salesforce, Zendesk, etc.)
  - Telephony licences (SIP trunks)
  - AI licences (bots, sentiment analysis)
  - Cost per licence per month

- **Facility Constraints:**
  - Desks (total available by site)
  - Building capacity (max occupancy)
  - Multi-site modelling (distribute FTE across locations)

- **Breach Warnings:**
  - If `ForecastedFTE > AvailableSeats`: Alert user
  - If `ForecastedFTE > Building Capacity`: Alert user
  - Suggest: "Need 50 more seats by Q2 2025"

**UI Layout:**
- Top: Resource type selector (IT / Facilities)
- Left: Resource inventory (current counts by site)
- Centre: Utilisation chart (current vs forecasted)
- Right: Breach warnings + recommendations

**Technical Notes:**
- Store resources in `SupportingResources` table with `resource_type`, `quantity`, `site_id`, `cost_per_unit`
- Store sites in `Sites` table with `location`, `building_capacity`, `desk_count`
- Calculate utilisation: `ForecastedFTE / AvailableResources`

---

### 6. BPO Client & Contract Management

**Purpose:** Model commercial relationships and billing

**Features:**
- **Client → Campaign Structure:**
  - One client can have many campaigns (one-to-many)
  - Example: Client "ACME Corp" has campaigns: "Sales Inbound", "Support Chat", "Email Queries"

- **Billing Models Supported:**
  1. **Per Seat / Per FTE** (e.g., £2000/month per FTE)
  2. **Per Productive Hour** (e.g., £15/hour)
  3. **Per Handle Minute** (e.g., £0.50/min of AHT)
  4. **Per Transaction** (e.g., £2 per call handled)
  5. **Outcome/Performance Based** (e.g., £5 per sale, £50 penalty per missed SLA point)
  6. **Hybrid Models** (e.g., base fee + performance bonus)

- **Contract Fields:**
  - Payment terms (30/45/60/90 days)
  - Invoice frequency (monthly, quarterly)
  - Contract start/end dates (time-bound)
  - SLA target (e.g., 80/20) + penalty/reward structure
  - Ramp-up learning curve (new contracts start at lower productivity)

- **Financial Outputs:**
  - Monthly revenue by client
  - Expected SLA penalties/rewards
  - Cost per contract (FTE cost × FTE allocated)
  - Profitability (revenue - cost)

**UI Layout:**
- Top: Client selector (dropdown or searchable list)
- Left: Client details + contract terms
- Centre: Campaign list (table with billing model per campaign)
- Right: Financial summary (revenue, cost, profit)

**Technical Notes:**
- Store clients in `Clients` table
- Store campaigns in `Campaigns` table with `client_id` (foreign key)
- Store contracts in `Contracts` table with `billing_model`, `start_date`, `end_date`, `payment_terms`
- Store billing rules in `BillingRules` table (JSON or relational)
- Calculate revenue: Apply billing model to forecasted volume/FTE

---

### 6.1. Calendar Page (Multi-Resolution Capacity Control)

**Purpose:** Unified view of all capacity-impacting events

**Features:**
- **Resolution Zoom:**
  - Individual (single agent view)
  - Team/Skill (e.g., "Chat Team")
  - Campaign (e.g., "Campaign X")
  - Client (e.g., "Client ABC")
  - Site (e.g., "London Office")
  - Global (entire operation)
  - Filter toggle (show only selected resolution)

- **Event Types Displayed:**
  - Training, onboarding, holidays (national + personal)
  - System downtime (planned outages)
  - Mass events (town halls, compliance days)
  - Client ramp-up milestones (go-live dates)
  - Productivity states (full, partial, non-productive)

- **Event Rules Engine:**
  - Assign events to filtered groups:
    - Example: "Everyone hired after 2024-06-01 with Skill=Chat"
  - Drag-drop editing (move events, resize duration)
  - Conflict resolution:
    - Warn: "Trainer already assigned to another session"
    - Suggest: "Find alternative trainer" or "Reschedule"

- **Auto-Feed to Forecasting:**
  - Calendar events automatically update productive hours in forecasting
  - If "Training event for 20 agents on 2025-03-15": Reduce capacity by 20 FTE that day
  - If "Partial productivity event (50%) for 10 agents, 5 days": Reduce capacity accordingly

**UI Layout:**
- Top: Resolution filter (dropdown) + date range selector
- Left: Event list (filterable by type, status)
- Centre: Calendar grid (day/week/month views)
- Right: Event details panel (edit form)

**Technical Notes:**
- Store calendar events in `CalendarEvents` table
- Store event assignments in `EventAssignments` table (many-to-many with staff)
- Index by `start_date`, `end_date`, `resolution_level` for fast filtering
- Trigger recalculation in forecasting when calendar events change

---

## 🧠 Core Modelling Rules (Technical Implementation)

### 1. Time-Bound Assumptions

**Rule:** Every assumption must have `valid_from` and `valid_to` dates.

**Database Schema:**
```sql
CREATE TABLE Assumptions (
  id INTEGER PRIMARY KEY,
  assumption_type TEXT NOT NULL, -- 'AHT', 'Shrinkage', 'Occupancy', 'SLA'
  value REAL NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE,
  campaign_id INTEGER, -- NULL = global
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);
```

**Logic:**
- Query: `SELECT value FROM Assumptions WHERE assumption_type='AHT' AND valid_from <= '2025-03-01' AND (valid_to >= '2025-03-01' OR valid_to IS NULL)`
- No permanent global settings (forces users to think about time ranges)

---

### 2. Attrition Modelling

**Rule:** Attrition rate varies by tenure.

**Formula:**
```
MonthlyAttritionRate(tenure_months) = BaseRate × TenureMultiplier(tenure_months)
```

**Example Tenure Multipliers:**
- 0-3 months (new hires): 1.5× base rate
- 3-6 months: 1.2× base rate
- 6-12 months: 1.0× base rate
- 12+ months: 0.7× base rate

**Database Schema:**
```sql
CREATE TABLE AttritionCurves (
  id INTEGER PRIMARY KEY,
  tenure_min_months INTEGER NOT NULL,
  tenure_max_months INTEGER,
  multiplier REAL NOT NULL,
  base_rate REAL NOT NULL -- annual attrition %
);
```

**Calculation:**
```swift
func calculateExpectedAttrition(staff: [Staff], date: Date) -> Double {
  var totalAttrition = 0.0
  for person in staff {
    let tenureMonths = date.monthsSince(person.startDate)
    let curve = getAttritionCurve(tenure: tenureMonths)
    let annualRate = curve.baseRate * curve.multiplier
    let monthlyRate = annualRate / 12.0
    totalAttrition += monthlyRate
  }
  return totalAttrition
}
```

---

### 3. Shrinkage Decomposition

**Rule:** Shrinkage = Base + Planned + Dynamic

**Components:**
1. **Base Shrinkage (Daily):**
   - Breaks, lunch, bio breaks
   - Typical: 10-15% of scheduled time
   - Stored in `Assumptions` table

2. **Planned Shrinkage (Calendar):**
   - Training, meetings, town halls
   - Events in `CalendarEvents` table
   - Reduces productive hours for specific days

3. **Dynamic Shrinkage (Probabilistic):**
   - Illness, absenteeism (random)
   - Model as probability: `P(absent) = historical absence rate`
   - Apply Monte Carlo simulation for forecasting

**Formula:**
```
ProductiveHours = ScheduledHours
                  × (1 - BaseShrinkage)
                  × (1 - PlannedShrinkageToday)
                  × (1 - DynamicShrinkage)
```

**Database Schema:**
```sql
CREATE TABLE ShrinkageComponents (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  campaign_id INTEGER,
  base_shrinkage REAL DEFAULT 0.15,
  planned_shrinkage REAL DEFAULT 0.0, -- calculated from calendar
  dynamic_shrinkage REAL DEFAULT 0.05, -- historical average
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);
```

---

### 4. Callback Queues & Capacity Maths

**Rule:** Callbacks still obey queueing theory.

**Scenario:** Customer requests callback during off-hours.

**Implementation:**
- Treat callback volume as additional demand at callback time
- Apply Erlang C/A/X to combined volume (inbound + callbacks)
- Model callback acceptance rate (not all customers answer)

**Formula:**
```
EffectiveVolume(t) = InboundVolume(t) + CallbackVolume(t) × AnswerRate
```

**Database Schema:**
```sql
CREATE TABLE CallbackQueue (
  id INTEGER PRIMARY KEY,
  requested_datetime DATETIME NOT NULL,
  scheduled_datetime DATETIME NOT NULL,
  campaign_id INTEGER,
  answered BOOLEAN DEFAULT 0,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);
```

---

### 5. Occupancy Constraints

**Rule:** Occupancy policy overrides raw Erlang output.

**Logic:**
```swift
func applyOccupancyConstraint(requiredAgents: Int, trafficIntensity: Double, maxOccupancy: Double) -> Int {
  let minAgentsForOccupancy = Int(ceil(trafficIntensity / maxOccupancy))
  return max(requiredAgents, minAgentsForOccupancy)
}
```

**Example:**
- Erlang C says: 18 agents required for 80/20 SLA
- Traffic intensity: 13.33 Erlangs
- Max occupancy: 90%
- Min agents for occupancy: 13.33 / 0.90 = 14.8 → 15 agents
- Final result: max(18, 15) = **18 agents** (SLA drives staffing, not occupancy)

**But if traffic increases:**
- Traffic intensity: 17 Erlangs
- Erlang C: 20 agents
- Min agents for occupancy: 17 / 0.90 = 18.9 → 19 agents
- Final result: max(20, 19) = **20 agents**

---

## 💾 Database Schema (Detailed)

### Core Tables

#### 1. Staff
```sql
CREATE TABLE Staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if active
  site_id INTEGER,
  attrition_probability REAL DEFAULT 0.15, -- annual
  FOREIGN KEY (role_id) REFERENCES Roles(id),
  FOREIGN KEY (site_id) REFERENCES Sites(id)
);

CREATE INDEX idx_staff_start_date ON Staff(start_date);
CREATE INDEX idx_staff_role ON Staff(role_id);
```

#### 2. Skills (Many-to-Many with Staff)
```sql
CREATE TABLE Skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT UNIQUE NOT NULL,
  skill_type TEXT, -- 'Voice', 'Chat', 'Email', 'Technical', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE StaffSkills (
  staff_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency_level INTEGER DEFAULT 1, -- 1=Novice, 5=Expert
  acquired_date DATE,
  PRIMARY KEY (staff_id, skill_id),
  FOREIGN KEY (staff_id) REFERENCES Staff(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES Skills(id) ON DELETE CASCADE
);
```

#### 3. Clients
```sql
CREATE TABLE Clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT UNIQUE NOT NULL,
  industry TEXT,
  contract_start DATE,
  contract_end DATE,
  payment_terms INTEGER DEFAULT 30, -- days
  invoice_frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Campaigns (Work Units per Client)
```sql
CREATE TABLE Campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  channel_type TEXT NOT NULL, -- 'Voice', 'Chat', 'Email', 'Video', 'Social'
  start_date DATE NOT NULL,
  end_date DATE,
  sla_target_percent REAL DEFAULT 80.0,
  sla_threshold_seconds INTEGER DEFAULT 20,
  FOREIGN KEY (client_id) REFERENCES Clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaigns_client ON Campaigns(client_id);
CREATE INDEX idx_campaigns_dates ON Campaigns(start_date, end_date);
```

#### 5. CalendarEvents
```sql
CREATE TABLE CalendarEvents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'Training', 'Onboarding', 'Holiday', 'Downtime', 'Meeting'
  event_name TEXT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  productivity_modifier REAL DEFAULT 1.0, -- 1.0 = full, 0.5 = 50%, 0.0 = non-productive
  applies_to_filter TEXT, -- JSON: {"skill": "Chat", "tenure_min": 90}
  campaign_id INTEGER, -- NULL = global
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_calendar_dates ON CalendarEvents(start_datetime, end_datetime);
CREATE INDEX idx_calendar_campaign ON CalendarEvents(campaign_id);
```

#### 6. Forecasts
```sql
CREATE TABLE Forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forecast_name TEXT NOT NULL,
  scenario_id INTEGER,
  model_type TEXT NOT NULL, -- 'ErlangC', 'ErlangA', 'ErlangX', 'Prophet', 'Manual'
  campaign_id INTEGER NOT NULL,
  forecast_date DATE NOT NULL,
  forecasted_volume REAL NOT NULL,
  forecasted_aht REAL, -- seconds
  required_agents INTEGER,
  required_fte REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES Scenarios(id),
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_forecasts_date ON Forecasts(forecast_date);
CREATE INDEX idx_forecasts_scenario ON Forecasts(scenario_id);
```

#### 7. Scenarios (Versioning System)
```sql
CREATE TABLE Scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_baseline BOOLEAN DEFAULT 0 -- One scenario marked as baseline
);
```

#### 8. SupportingResources
```sql
CREATE TABLE SupportingResources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_type TEXT NOT NULL, -- 'ACD_Seat', 'CRM_Licence', 'Desk', 'Building_Capacity'
  site_id INTEGER,
  quantity INTEGER NOT NULL,
  cost_per_unit REAL,
  valid_from DATE NOT NULL,
  valid_to DATE,
  FOREIGN KEY (site_id) REFERENCES Sites(id)
);
```

#### 9. BillingRules
```sql
CREATE TABLE BillingRules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  campaign_id INTEGER,
  billing_model TEXT NOT NULL, -- 'PerSeat', 'PerHour', 'PerTransaction', 'Outcome', 'Hybrid'
  rate REAL NOT NULL, -- £ per unit
  penalty_per_sla_point REAL DEFAULT 0.0,
  reward_per_sla_point REAL DEFAULT 0.0,
  valid_from DATE NOT NULL,
  valid_to DATE,
  FOREIGN KEY (contract_id) REFERENCES Contracts(id),
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);
```

#### 10. HistoricalData
```sql
CREATE TABLE HistoricalData (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_id INTEGER, -- Track which CSV import this came from
  campaign_id INTEGER,
  date DATE NOT NULL,
  interval_start TIME, -- e.g., '09:00:00' for intraday data
  interval_end TIME,
  volume INTEGER NOT NULL,
  aht REAL, -- seconds
  abandons INTEGER,
  sla_achieved REAL, -- 0.0-1.0
  actual_fte REAL,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_historical_date ON HistoricalData(date);
CREATE INDEX idx_historical_campaign ON HistoricalData(campaign_id);
```

---

### Relationships Diagram (ASCII)

```
Clients (1) ────┬──── (N) Campaigns ────┬──── (N) Forecasts
                │                        │
                │                        └──── (N) BillingRules
                │
                └──── (1) Contracts

Staff (N) ────── (M) Skills (via StaffSkills)
  │
  ├──── (N) CalendarEvents (via EventAssignments)
  │
  └──── (1) Roles

Sites (1) ────┬──── (N) Staff
              │
              └──── (N) SupportingResources

Scenarios (1) ──── (N) Forecasts
```

---

## 🚀 Implementation Phases (Recommended)

### Phase 0: Foundation (2-3 weeks)
**Goal:** Set up project structure, database, core architecture

**Tasks:**
1. Create Xcode project (SwiftUI, iOS 16+)
2. Set up SQLite database (GRDB.swift or Core Data)
3. Implement all database tables (schema above)
4. Create core data models (Swift structs/classes matching tables)
5. Set up state management (ObservableObject or @Observable)
6. Create app navigation structure (TabView with 6 main tabs)
7. Port existing Erlang C/A/X calculations from web version
8. Write unit tests for calculations (validate against published tables)

**Deliverables:**
- ✅ Empty iOS app with 6 tabs (shells)
- ✅ SQLite database with all tables created
- ✅ Erlang C/A/X calculations working and tested
- ✅ Basic data import/export (CSV)

---

### Phase 1: Calculator Page (3-4 weeks)
**Goal:** Replicate and enhance current calculator functionality

**Tasks:**
1. Build CSV import UI + parser (validate format)
2. Create Assumptions panel (time-bound inputs)
3. Build instant staffing calculator (real-time recalc)
4. If historical data imported:
   - Chart: Historical demand
   - Chart: SLA achievement
   - Chart: Required vs Actual FTE gap
5. Store imported data in HistoricalData table
6. Store assumptions in Assumptions table with date ranges

**Deliverables:**
- ✅ Working calculator with historical analysis
- ✅ CSV import functional
- ✅ Charts rendering (Swift Charts)
- ✅ Assumptions persisted to database

---

### Phase 2: Forecasting Page (4-5 weeks)
**Goal:** Predict future demand and staffing needs

**Tasks:**
1. Implement classical Erlang forecasting (apply C/A/X to future dates)
2. Train Prophet model offline (Python) using historical data
3. Export Prophet model to CoreML format
4. Implement CoreML inference in Swift
5. Build scenario comparison UI (side-by-side charts)
6. Implement capacity constraint toggle
7. Store forecasts in Forecasts table with scenario_id
8. Build scenario versioning system

**Deliverables:**
- ✅ Forecasting engine (Erlang + Prophet)
- ✅ A/B scenario comparison working
- ✅ Scenarios saved and loadable
- ✅ Capacity constraint warnings

**Technical Challenge:**
- Prophet model training requires Python environment
- Need to create training pipeline: Historical CSV → Python → CoreML → iOS
- Consider: Pre-trained models or on-device training (if feasible)

---

### Phase 3: Strategic Workforce Planning (3-4 weeks)
**Goal:** Model organisational structure and recruitment

**Tasks:**
1. Build roles management UI (create/edit roles)
2. Implement role ratio logic (1 TL per 10 agents)
3. Build attrition curve editor (chart + table)
4. Implement attrition calculation by tenure
5. Build recruitment pipeline UI (funnel visualisation)
6. Calculate monthly hiring plan
7. Store roles in Roles table
8. Store staff in Staff table with tenure tracking

**Deliverables:**
- ✅ Organisational structure builder
- ✅ Attrition modelling working
- ✅ Recruitment pipeline functional
- ✅ Hiring plan generated

---

### Phase 4: Calendar & Shrinkage Planning (4-5 weeks)
**Goal:** Event-driven capacity management

**Tasks:**
1. Build calendar UI (day/week/month views)
2. Implement event creation/editing (drag-drop)
3. Build event rules engine (filter by skill/tenure/campaign)
4. Implement conflict detection (trainer double-booking)
5. Build productivity curve editor (S-curve, linear, exponential)
6. Connect calendar events to forecasting (auto-update capacity)
7. Store events in CalendarEvents table
8. Implement multi-resolution filtering (Individual → Global)

**Deliverables:**
- ✅ Calendar page fully functional
- ✅ Event-driven shrinkage working
- ✅ Productivity curves applied
- ✅ Forecasting reflects calendar events

**Technical Challenge:**
- Calendar UI is complex (similar to Apple Calendar app)
- Drag-drop interactions require careful state management
- Conflict detection requires efficient querying

---

### Phase 5: Client/Contract Management (2-3 weeks)
**Goal:** BPO commercial modelling

**Tasks:**
1. Build client management UI (CRUD operations)
2. Build campaign management UI (one-to-many with clients)
3. Implement billing models (6 types + hybrid)
4. Build contract terms editor
5. Calculate revenue/cost/profitability
6. Store clients in Clients table
7. Store campaigns in Campaigns table
8. Store billing rules in BillingRules table

**Deliverables:**
- ✅ Client/campaign management working
- ✅ Billing calculations correct
- ✅ Financial reporting functional

---

### Phase 6: Supporting Resources (1-2 weeks)
**Goal:** IT and facility constraints

**Tasks:**
1. Build resource inventory UI (seats, licences)
2. Implement utilisation calculations
3. Build breach warning system
4. Store resources in SupportingResources table
5. Store sites in Sites table

**Deliverables:**
- ✅ Resource management working
- ✅ Breach warnings functional

---

### Phase 7: Polish & Integration (3-4 weeks)
**Goal:** Connect all pages, optimise, test

**Tasks:**
1. Cross-page navigation and data flow
2. Performance optimisation (database indexing, lazy loading)
3. UI/UX polish (animations, transitions, error states)
4. Accessibility audit (VoiceOver, Dynamic Type)
5. Comprehensive testing (unit + integration + UI tests)
6. Documentation (user guide, technical docs)
7. Export functionality (PDF reports, CSV)

**Deliverables:**
- ✅ Fully integrated system
- ✅ Performance benchmarks met
- ✅ Accessibility compliant
- ✅ Test coverage >80%
- ✅ User documentation complete

---

## ⏱️ Timeline Summary

| Phase | Duration | Cumulative | Key Deliverable |
|-------|----------|-----------|-----------------|
| 0: Foundation | 2-3 weeks | 3 weeks | Database + Erlang calculations |
| 1: Calculator | 3-4 weeks | 7 weeks | Historical analysis working |
| 2: Forecasting | 4-5 weeks | 12 weeks | Prophet + scenario comparison |
| 3: Workforce Planning | 3-4 weeks | 16 weeks | Attrition + recruitment |
| 4: Calendar/Shrinkage | 4-5 weeks | 21 weeks | Event-driven capacity |
| 5: Client Management | 2-3 weeks | 24 weeks | BPO billing models |
| 6: Resources | 1-2 weeks | 26 weeks | IT/facility constraints |
| 7: Polish | 3-4 weeks | **30 weeks** | Fully integrated MVP |

**Total Estimated Effort:** 30 weeks (7.5 months) for single developer working full-time

**With 2 developers:** ~4-5 months (with parallelisation)
**With 3 developers:** ~3-4 months (with careful task distribution)

---

## 🚨 Technical Challenges & Risks

### 1. Prophet ML Model Integration
**Challenge:** Prophet is a Python library. CoreML conversion is non-trivial.

**Options:**
- **A) Offline Training:** Train models in Python, export to CoreML, bundle with app
  - Pro: Full Prophet capabilities
  - Con: Requires Python environment, manual model updates

- **B) On-Device Training:** Use Swift for Machine Learning (Create ML)
  - Pro: No Python dependency, models update automatically
  - Con: Limited compared to Prophet, may need simpler time series models

- **C) Hybrid:** Use simple ARIMA/exponential smoothing in Swift, offer Prophet as "advanced" offline feature
  - Pro: Best of both worlds
  - Con: More complex to maintain

**Recommendation:** Start with Option C (hybrid approach)

---

### 2. Database Performance at Scale
**Challenge:** 3 years of historical data × multiple campaigns = millions of rows

**Mitigation:**
- Aggressive indexing (see schema above)
- Lazy loading (fetch only visible date ranges)
- Aggregation tables (pre-calculate daily/monthly summaries)
- Background queue for heavy queries
- Consider: Archiving old data to separate tables

**Benchmarks to Target:**
- Query historical data (1 year, 1 campaign): <500ms
- Load calendar view (1 month, all campaigns): <300ms
- Run forecast (30 days, 5 campaigns): <2s

---

### 3. Calendar UI Complexity
**Challenge:** Building a drag-drop calendar like Apple Calendar is hard

**Options:**
- **A) Use Third-Party Library:** e.g., FSCalendar, JTAppleCalendar
  - Pro: Faster development
  - Con: Less control, may not support all requirements

- **B) Build Custom:** SwiftUI + Gesture recognizers
  - Pro: Full control, tailored to requirements
  - Con: Significant development time (2-3 weeks just for calendar)

**Recommendation:** Option A for MVP, migrate to Option B if needed

---

### 4. Conflict Detection Performance
**Challenge:** Checking for trainer double-bookings across thousands of events

**Mitigation:**
- Index CalendarEvents by start_datetime, end_datetime
- Query: `SELECT * FROM CalendarEvents WHERE start_datetime < ? AND end_datetime > ? AND trainer_id = ?`
- Use interval trees for complex overlap detection
- Cache results for frequently accessed trainers

---

### 5. Offline-Only Limitation
**Challenge:** No cloud sync, no collaboration

**Impact:**
- Single-user app (no team collaboration)
- No backup/restore (unless user manually exports)
- No cross-device sync

**Future Enhancement:**
- Add iCloud sync for scenarios/calendars
- Export/import via Files app
- AirDrop sharing between devices

---

## 📊 Deliverables Checklist

You asked: *"Which would you like next?"*

### Option 1: 📐 Database Schema Diagram
**What:** Visual ERD (Entity-Relationship Diagram) showing all tables, relationships, keys

**Format:** Mermaid diagram (rendered in Markdown) or PNG image

**Benefit:** Easy to validate data model before coding

**Effort:** 1-2 hours

---

### Option 2: 🎨 Page Wireframes
**What:** UI mockups for all 6 pages + calendar

**Format:** ASCII wireframes or Figma/Sketch designs

**Benefit:** Clarify UI/UX before implementation

**Effort:** 3-4 hours for ASCII, 1-2 days for high-fidelity

---

### Option 3: 💻 Engine Architecture (Swift + SQLite + CoreML Prophet)
**What:** Detailed Swift code structure:
- ViewModels
- Data access layer (repositories)
- Forecasting engine
- CoreML integration

**Format:** Code samples + architecture diagram

**Benefit:** Clear technical blueprint for developers

**Effort:** 4-6 hours

---

## 🎯 Recommended Next Steps

1. **Review this implementation plan** - Validate phases, timelines, scope
2. **Choose deliverable** - Schema diagram / Wireframes / Architecture
3. **Prioritise features** - Which pages are P0 (must-have) vs P1 (nice-to-have)?
4. **Allocate resources** - How many developers? Full-time or part-time?
5. **Set milestones** - Which phase do you want to reach first?

---

## ❓ Questions for You

Before I proceed with the next deliverable, please clarify:

1. **Priority:** Which pages are P0 (critical) vs P1 (later)?
   - Example: Is "BPO Client Management" critical, or can it wait?

2. **Timeline:** What's your target launch date?
   - 3 months? 6 months? 12 months?

3. **Resources:** How many developers will work on this?
   - Solo? Team of 2-3? Outsourced?

4. **Prophet ML:** Do you have Python capability, or should we use simpler forecasting?
   - If yes: I'll design full Prophet integration
   - If no: I'll design Swift-native time series forecasting

5. **MVP Scope:** For first release, what's the minimum?
   - Example: "Calculator + Forecasting + Calendar only, skip client management initially"

6. **Which deliverable next?**
   - A) Database schema diagram
   - B) Page wireframes
   - C) Swift architecture

---

**Let me know your thoughts, and I'll proceed with the appropriate deliverable!** 🚀

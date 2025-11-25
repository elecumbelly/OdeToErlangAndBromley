# OdeToErlang - Database Schema
**Platform:** Web (SQLite via sql.js)
**Version:** 1.0
**Date:** 2025-11-23

---

## 📊 Complete Table Definitions

### 1. **Staff** - Employee records
```sql
CREATE TABLE Staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,                          -- NULL if active
  site_id INTEGER,
  attrition_probability REAL DEFAULT 0.15, -- Annual attrition rate (0.0-1.0)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES Roles(id),
  FOREIGN KEY (site_id) REFERENCES Sites(id)
);

CREATE INDEX idx_staff_start_date ON Staff(start_date);
CREATE INDEX idx_staff_role ON Staff(role_id);
CREATE INDEX idx_staff_site ON Staff(site_id);
CREATE INDEX idx_staff_active ON Staff(end_date) WHERE end_date IS NULL;
```

**Fields:**
- `id` - Primary key
- `employee_id` - External employee ID (unique)
- `first_name`, `last_name` - Employee name
- `role_id` - FK to Roles table
- `start_date` - Hire date
- `end_date` - Termination date (NULL = active)
- `site_id` - FK to Sites table
- `attrition_probability` - Individual attrition risk (0-1)
- `created_at`, `updated_at` - Audit timestamps

---

### 2. **Roles** - Job roles (Agents, TLs, QA, Trainers, Managers)
```sql
CREATE TABLE Roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT UNIQUE NOT NULL,
  role_type TEXT NOT NULL,               -- 'Agent', 'TeamLeader', 'QA', 'Trainer', 'Manager', 'Specialist'
  base_salary REAL,
  reports_to_role_id INTEGER,            -- Organisational hierarchy
  span_of_control INTEGER,               -- How many direct reports (e.g., 1 TL per 10 agents)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reports_to_role_id) REFERENCES Roles(id)
);

CREATE INDEX idx_roles_type ON Roles(role_type);
```

**Fields:**
- `id` - Primary key
- `role_name` - Display name (e.g., "Senior Chat Agent")
- `role_type` - Category for calculations
- `base_salary` - Annual salary (optional)
- `reports_to_role_id` - Manager role (hierarchy)
- `span_of_control` - Ratio for automatic staffing (e.g., 1:10)

---

### 3. **Skills** - Agent capabilities
```sql
CREATE TABLE Skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT UNIQUE NOT NULL,
  skill_type TEXT,                       -- 'Voice', 'Chat', 'Email', 'Technical', 'Language'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_type ON Skills(skill_type);
```

**Fields:**
- `id` - Primary key
- `skill_name` - Skill identifier (e.g., "Spanish", "Technical Support")
- `skill_type` - Category
- `description` - Additional details

---

### 4. **StaffSkills** - Many-to-many: Staff ↔ Skills
```sql
CREATE TABLE StaffSkills (
  staff_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency_level INTEGER DEFAULT 1,   -- 1=Novice, 2=Intermediate, 3=Advanced, 4=Expert, 5=Master
  acquired_date DATE,
  PRIMARY KEY (staff_id, skill_id),
  FOREIGN KEY (staff_id) REFERENCES Staff(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES Skills(id) ON DELETE CASCADE
);

CREATE INDEX idx_staffskills_staff ON StaffSkills(staff_id);
CREATE INDEX idx_staffskills_skill ON StaffSkills(skill_id);
```

**Fields:**
- `staff_id`, `skill_id` - Composite primary key
- `proficiency_level` - 1-5 scale
- `acquired_date` - When skill was learned

---

### 5. **Sites** - Physical locations
```sql
CREATE TABLE Sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT UNIQUE NOT NULL,
  location TEXT,                         -- City, Country
  building_capacity INTEGER,             -- Max occupancy
  desk_count INTEGER,                    -- Available workstations
  timezone TEXT,                         -- IANA timezone (e.g., 'Europe/London')
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Primary key
- `site_name` - Display name
- `location` - Address/city
- `building_capacity` - Max people allowed
- `desk_count` - Physical desk limit
- `timezone` - For multi-site scheduling

---

### 6. **Clients** - BPO customers
```sql
CREATE TABLE Clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT UNIQUE NOT NULL,
  industry TEXT,                         -- 'Retail', 'Finance', 'Healthcare', etc.
  contract_start DATE,
  contract_end DATE,
  payment_terms INTEGER DEFAULT 30,     -- Days (30, 45, 60, 90)
  invoice_frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annual'
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_active ON Clients(active);
CREATE INDEX idx_clients_contract_dates ON Clients(contract_start, contract_end);
```

**Fields:**
- `id` - Primary key
- `client_name` - Customer name
- `industry` - Sector classification
- `contract_start`, `contract_end` - Contract dates
- `payment_terms` - Invoice payment window (days)
- `invoice_frequency` - Billing cadence
- `active` - Currently active (1) or terminated (0)

---

### 7. **Campaigns** - Work units per client (one-to-many)
```sql
CREATE TABLE Campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  channel_type TEXT NOT NULL,            -- 'Voice', 'Chat', 'Email', 'Video', 'Social', 'WhatsApp'
  start_date DATE NOT NULL,
  end_date DATE,
  sla_target_percent REAL DEFAULT 80.0,
  sla_threshold_seconds INTEGER DEFAULT 20,
  concurrency_allowed INTEGER DEFAULT 1, -- For chat/email (how many simultaneous contacts)
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES Clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaigns_client ON Campaigns(client_id);
CREATE INDEX idx_campaigns_dates ON Campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_active ON Campaigns(active);
```

**Fields:**
- `id` - Primary key
- `campaign_name` - Display name
- `client_id` - FK to Clients
- `channel_type` - Communication channel
- `start_date`, `end_date` - Campaign lifecycle
- `sla_target_percent` - Target % (e.g., 80 for 80/20)
- `sla_threshold_seconds` - Target seconds (e.g., 20 for 80/20)
- `concurrency_allowed` - Multi-line capability (chat agents handling 3+ chats)
- `active` - Currently running

---

### 8. **Contracts** - Commercial agreements (links Clients to Billing)
```sql
CREATE TABLE Contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  contract_number TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  currency TEXT DEFAULT 'GBP',
  auto_renew BOOLEAN DEFAULT 0,
  notice_period_days INTEGER DEFAULT 90,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES Clients(id)
);

CREATE INDEX idx_contracts_client ON Contracts(client_id);
CREATE INDEX idx_contracts_dates ON Contracts(start_date, end_date);
```

**Fields:**
- `id` - Primary key
- `client_id` - FK to Clients
- `contract_number` - External reference
- `start_date`, `end_date` - Contract term
- `currency` - Billing currency
- `auto_renew` - Automatic renewal flag
- `notice_period_days` - Termination notice required

---

### 9. **BillingRules** - How clients are billed
```sql
CREATE TABLE BillingRules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  campaign_id INTEGER,                   -- NULL = applies to all campaigns for this contract
  billing_model TEXT NOT NULL,           -- 'PerSeat', 'PerFTE', 'PerHour', 'PerHandleMinute', 'PerTransaction', 'Outcome', 'Hybrid'
  rate REAL NOT NULL,                    -- £ per unit
  penalty_per_sla_point REAL DEFAULT 0.0,-- £ penalty if SLA drops 1%
  reward_per_sla_point REAL DEFAULT 0.0, -- £ bonus if SLA exceeds target by 1%
  valid_from DATE NOT NULL,
  valid_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES Contracts(id),
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_billingrules_contract ON BillingRules(contract_id);
CREATE INDEX idx_billingrules_campaign ON BillingRules(campaign_id);
CREATE INDEX idx_billingrules_dates ON BillingRules(valid_from, valid_to);
```

**Fields:**
- `id` - Primary key
- `contract_id` - FK to Contracts
- `campaign_id` - Optional FK to Campaigns (NULL = all campaigns)
- `billing_model` - 7 supported models
- `rate` - Price per unit (FTE, hour, transaction, etc.)
- `penalty_per_sla_point` - SLA penalty structure
- `reward_per_sla_point` - SLA bonus structure
- `valid_from`, `valid_to` - Time-bound pricing

---

### 10. **Assumptions** - Time-bound planning parameters
```sql
CREATE TABLE Assumptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assumption_type TEXT NOT NULL,         -- 'AHT', 'Shrinkage', 'Occupancy', 'SLA', 'AveragePatience'
  value REAL NOT NULL,
  unit TEXT,                             -- 'seconds', 'percent', 'ratio'
  valid_from DATE NOT NULL,
  valid_to DATE,                         -- NULL = currently valid
  campaign_id INTEGER,                   -- NULL = global assumption
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_assumptions_type ON Assumptions(assumption_type);
CREATE INDEX idx_assumptions_campaign ON Assumptions(campaign_id);
CREATE INDEX idx_assumptions_dates ON Assumptions(valid_from, valid_to);
```

**Fields:**
- `id` - Primary key
- `assumption_type` - Category (AHT, Shrinkage, etc.)
- `value` - Numeric value
- `unit` - Measurement unit for display
- `valid_from`, `valid_to` - Time bounds (enforces no permanent settings)
- `campaign_id` - Optional FK to Campaigns (NULL = global)
- `created_by` - Audit trail

**Example Data:**
```sql
-- AHT for Campaign 1, valid Jan-Mar 2025
INSERT INTO Assumptions (assumption_type, value, unit, valid_from, valid_to, campaign_id)
VALUES ('AHT', 240, 'seconds', '2025-01-01', '2025-03-31', 1);

-- Global shrinkage assumption from Feb 2025 onwards
INSERT INTO Assumptions (assumption_type, value, unit, valid_from, valid_to, campaign_id)
VALUES ('Shrinkage', 25, 'percent', '2025-02-01', NULL, NULL);
```

---

### 11. **CalendarEvents** - Capacity-impacting events
```sql
CREATE TABLE CalendarEvents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,              -- 'Training', 'Onboarding', 'Holiday', 'Downtime', 'Meeting', 'TownHall', 'Compliance'
  event_name TEXT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  all_day BOOLEAN DEFAULT 0,
  productivity_modifier REAL DEFAULT 1.0,-- 1.0 = full capacity, 0.5 = 50% capacity, 0.0 = non-productive
  applies_to_filter TEXT,                -- JSON: {"skill": "Chat", "tenure_min": 90, "site_id": 2}
  campaign_id INTEGER,                   -- NULL = global event
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_calendar_dates ON CalendarEvents(start_datetime, end_datetime);
CREATE INDEX idx_calendar_campaign ON CalendarEvents(campaign_id);
CREATE INDEX idx_calendar_type ON CalendarEvents(event_type);
```

**Fields:**
- `id` - Primary key
- `event_type` - Category
- `event_name` - Display name
- `start_datetime`, `end_datetime` - Event period
- `all_day` - Full day event flag
- `productivity_modifier` - Impact on capacity (0.0 - 1.0)
- `applies_to_filter` - JSON rule for who this affects
- `campaign_id` - Optional FK to Campaigns
- `created_by` - Audit trail

**Filter JSON Example:**
```json
{
  "skill": "Chat",
  "tenure_min": 90,
  "site_id": 2,
  "role_type": "Agent"
}
```
Applies to: Chat agents with 90+ days tenure at site 2

---

### 12. **ProductivityCurves** - Learning curves post-event
```sql
CREATE TABLE ProductivityCurves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curve_name TEXT UNIQUE NOT NULL,
  curve_type TEXT DEFAULT 'S-Curve',     -- 'Linear', 'S-Curve', 'Exponential', 'Custom'
  days_to_full_productivity INTEGER NOT NULL,
  day_1_percent REAL NOT NULL,           -- Productivity on day 1 (e.g., 40.0 for 40%)
  day_7_percent REAL,
  day_14_percent REAL,
  day_30_percent REAL,
  day_60_percent REAL,
  custom_curve_json TEXT,                -- For custom curves: JSON array of {day: X, percent: Y}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Primary key
- `curve_name` - Display name
- `curve_type` - Curve algorithm
- `days_to_full_productivity` - Ramp period
- `day_X_percent` - Productivity at key milestones
- `custom_curve_json` - Full custom curve data

**Example Data:**
```sql
-- Standard new hire ramp
INSERT INTO ProductivityCurves (curve_name, curve_type, days_to_full_productivity, day_1_percent, day_7_percent, day_30_percent)
VALUES ('New Hire Onboarding', 'S-Curve', 30, 40.0, 60.0, 100.0);

-- Post-training ramp
INSERT INTO ProductivityCurves (curve_name, curve_type, days_to_full_productivity, day_1_percent, day_7_percent, day_14_percent)
VALUES ('Post-Training Recovery', 'Linear', 14, 70.0, 85.0, 100.0);
```

---

### 13. **EventAssignments** - Many-to-many: CalendarEvents ↔ Staff
```sql
CREATE TABLE EventAssignments (
  event_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  productivity_curve_id INTEGER,         -- Optional FK to ProductivityCurves (post-event ramp)
  PRIMARY KEY (event_id, staff_id),
  FOREIGN KEY (event_id) REFERENCES CalendarEvents(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES Staff(id) ON DELETE CASCADE,
  FOREIGN KEY (productivity_curve_id) REFERENCES ProductivityCurves(id)
);

CREATE INDEX idx_eventassignments_event ON EventAssignments(event_id);
CREATE INDEX idx_eventassignments_staff ON EventAssignments(staff_id);
```

**Fields:**
- `event_id`, `staff_id` - Composite primary key
- `productivity_curve_id` - Optional ramp after event ends

---

### 14. **Scenarios** - Version control for forecasts
```sql
CREATE TABLE Scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_baseline BOOLEAN DEFAULT 0,         -- Only one scenario should be baseline
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX idx_scenarios_baseline ON Scenarios(is_baseline);
```

**Fields:**
- `id` - Primary key
- `scenario_name` - Display name
- `description` - Purpose/notes
- `is_baseline` - Default scenario for comparison
- `created_by` - Audit trail

---

### 15. **Forecasts** - Predicted demand and staffing
```sql
CREATE TABLE Forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forecast_name TEXT NOT NULL,
  scenario_id INTEGER NOT NULL,
  model_type TEXT NOT NULL,              -- 'ErlangC', 'ErlangA', 'ErlangX', 'Prophet', 'Manual'
  campaign_id INTEGER NOT NULL,
  forecast_date DATE NOT NULL,
  forecasted_volume REAL NOT NULL,
  forecasted_aht REAL,                   -- Seconds
  required_agents INTEGER,
  required_fte REAL,
  expected_sla REAL,                     -- Predicted service level (0.0-1.0)
  expected_occupancy REAL,               -- Predicted occupancy (0.0-1.0)
  expected_asa REAL,                     -- Predicted ASA (seconds)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES Scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_forecasts_scenario ON Forecasts(scenario_id);
CREATE INDEX idx_forecasts_campaign ON Forecasts(campaign_id);
CREATE INDEX idx_forecasts_date ON Forecasts(forecast_date);
CREATE INDEX idx_forecasts_model ON Forecasts(model_type);
```

**Fields:**
- `id` - Primary key
- `forecast_name` - Display name
- `scenario_id` - FK to Scenarios (for version control)
- `model_type` - Which algorithm was used
- `campaign_id` - FK to Campaigns
- `forecast_date` - Date this forecast applies to
- `forecasted_volume` - Predicted contact volume
- `forecasted_aht` - Predicted handle time
- `required_agents` - Productive agents needed
- `required_fte` - Total FTE (with shrinkage)
- `expected_sla`, `expected_occupancy`, `expected_asa` - KPI predictions

---

### 16. **HistoricalData** - Imported CSV data (3+ years)
```sql
CREATE TABLE HistoricalData (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_id INTEGER,               -- Track which CSV import this came from
  campaign_id INTEGER,
  date DATE NOT NULL,
  interval_start TIME,                   -- e.g., '09:00:00' for intraday data
  interval_end TIME,                     -- e.g., '09:30:00'
  volume INTEGER NOT NULL,
  aht REAL,                              -- Seconds
  abandons INTEGER,
  sla_achieved REAL,                     -- 0.0-1.0
  asa REAL,                              -- Seconds
  actual_fte REAL,
  actual_agents INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_historical_date ON HistoricalData(date);
CREATE INDEX idx_historical_campaign ON HistoricalData(campaign_id);
CREATE INDEX idx_historical_batch ON HistoricalData(import_batch_id);
```

**Fields:**
- `id` - Primary key
- `import_batch_id` - Group imports together
- `campaign_id` - FK to Campaigns
- `date` - Calendar date
- `interval_start`, `interval_end` - Optional intraday granularity
- `volume` - Actual contact volume
- `aht` - Actual handle time
- `abandons` - Contacts that abandoned
- `sla_achieved` - Actual service level achieved
- `asa` - Actual average speed of answer
- `actual_fte` - Actual staffing level
- `actual_agents` - Productive agents working

---

### 17. **SupportingResources** - IT & facility constraints
```sql
CREATE TABLE SupportingResources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_type TEXT NOT NULL,           -- 'ACD_Seat', 'CRM_Licence', 'Telephony_Licence', 'AI_Licence', 'Desk', 'BuildingCapacity'
  resource_name TEXT NOT NULL,
  site_id INTEGER,
  quantity INTEGER NOT NULL,
  cost_per_unit REAL,
  billing_frequency TEXT DEFAULT 'monthly', -- 'monthly', 'annual', 'one-time'
  vendor TEXT,
  contract_end_date DATE,
  valid_from DATE NOT NULL,
  valid_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES Sites(id)
);

CREATE INDEX idx_resources_type ON SupportingResources(resource_type);
CREATE INDEX idx_resources_site ON SupportingResources(site_id);
CREATE INDEX idx_resources_dates ON SupportingResources(valid_from, valid_to);
```

**Fields:**
- `id` - Primary key
- `resource_type` - Category
- `resource_name` - Display name
- `site_id` - Optional FK to Sites (NULL = global)
- `quantity` - How many available
- `cost_per_unit` - Price per licence/seat
- `billing_frequency` - Cost cadence
- `vendor` - Supplier name
- `contract_end_date` - Renewal tracking
- `valid_from`, `valid_to` - Time-bound availability

---

### 18. **AttritionCurves** - Tenure-based churn modelling
```sql
CREATE TABLE AttritionCurves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curve_name TEXT UNIQUE NOT NULL,
  tenure_min_months INTEGER NOT NULL,
  tenure_max_months INTEGER,             -- NULL = infinite (e.g., "12+ months")
  annual_attrition_rate REAL NOT NULL,   -- 0.0-1.0 (e.g., 0.40 = 40% annual)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attrition_tenure ON AttritionCurves(tenure_min_months, tenure_max_months);
```

**Fields:**
- `id` - Primary key
- `curve_name` - Display name
- `tenure_min_months`, `tenure_max_months` - Tenure bracket
- `annual_attrition_rate` - Churn rate for this bracket

**Example Data:**
```sql
INSERT INTO AttritionCurves (curve_name, tenure_min_months, tenure_max_months, annual_attrition_rate)
VALUES
  ('New Hire (0-3 months)', 0, 3, 0.50),
  ('Early Tenure (3-6 months)', 3, 6, 0.35),
  ('Mid Tenure (6-12 months)', 6, 12, 0.20),
  ('Established (12+ months)', 12, NULL, 0.12);
```

---

### 19. **RecruitmentPipeline** - Hiring funnel stages
```sql
CREATE TABLE RecruitmentPipeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_name TEXT UNIQUE NOT NULL,
  stage_order INTEGER NOT NULL,          -- Sequence (1 = Application, 2 = Screen, etc.)
  pass_rate REAL NOT NULL,               -- 0.0-1.0 (e.g., 0.70 = 70% pass to next stage)
  avg_duration_days INTEGER,             -- Average time spent in this stage
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pipeline_order ON RecruitmentPipeline(stage_order);
```

**Fields:**
- `id` - Primary key
- `stage_name` - Display name
- `stage_order` - Sequence position
- `pass_rate` - Success rate to next stage
- `avg_duration_days` - Time in stage (for lead time calculation)

**Example Data:**
```sql
INSERT INTO RecruitmentPipeline (stage_name, stage_order, pass_rate, avg_duration_days)
VALUES
  ('Application', 1, 0.70, 2),
  ('Screening Call', 2, 0.50, 3),
  ('Interview', 3, 0.40, 5),
  ('Offer', 4, 0.80, 2),
  ('Acceptance', 5, 0.90, 3),
  ('Start Date', 6, 1.00, 14);
```

---

### 20. **RecruitmentRequests** - Hiring demand tracking
```sql
CREATE TABLE RecruitmentRequests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  campaign_id INTEGER,
  quantity_requested INTEGER NOT NULL,
  requested_date DATE NOT NULL,
  target_start_date DATE,
  status TEXT DEFAULT 'Open',            -- 'Open', 'InProgress', 'Filled', 'Cancelled'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES Roles(id),
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX idx_recruitment_role ON RecruitmentRequests(role_id);
CREATE INDEX idx_recruitment_campaign ON RecruitmentRequests(campaign_id);
CREATE INDEX idx_recruitment_status ON RecruitmentRequests(status);
```

**Fields:**
- `id` - Primary key
- `role_id` - FK to Roles
- `campaign_id` - Optional FK to Campaigns
- `quantity_requested` - How many to hire
- `requested_date` - When requisition opened
- `target_start_date` - Desired hire date
- `status` - Current state
- `notes` - Additional context

---

## 🔗 Relationships Summary

```
Clients (1) ──┬── (N) Campaigns
              └── (N) Contracts ──── (N) BillingRules

Campaigns (1) ──┬── (N) Forecasts
                ├── (N) Assumptions (optional)
                ├── (N) HistoricalData
                ├── (N) CalendarEvents (optional)
                └── (N) RecruitmentRequests (optional)

Staff (N) ──┬── (M) Skills (via StaffSkills)
            ├── (M) CalendarEvents (via EventAssignments)
            ├── (1) Roles
            └── (1) Sites

Scenarios (1) ──── (N) Forecasts

Sites (1) ──┬── (N) Staff
            └── (N) SupportingResources
```

---

## 📏 Total Table Count: **20 Tables**

1. Staff
2. Roles
3. Skills
4. StaffSkills
5. Sites
6. Clients
7. Campaigns
8. Contracts
9. BillingRules
10. Assumptions
11. CalendarEvents
12. ProductivityCurves
13. EventAssignments
14. Scenarios
15. Forecasts
16. HistoricalData
17. SupportingResources
18. AttritionCurves
19. RecruitmentPipeline
20. RecruitmentRequests

---

## ✅ Review Checklist

Please review and confirm:

**Tables:**
- [ ] All 20 tables make sense?
- [ ] Any missing tables?
- [ ] Any tables that should be removed?

**Fields:**
- [ ] All critical fields present?
- [ ] Data types correct (INTEGER, REAL, TEXT, DATE, DATETIME, BOOLEAN)?
- [ ] Default values appropriate?

**Relationships:**
- [ ] Foreign keys correct?
- [ ] Many-to-many tables (StaffSkills, EventAssignments) structured properly?

**Indexes:**
- [ ] Performance-critical queries covered?
- [ ] Any missing indexes?

**Time-Bound Requirements:**
- [ ] Assumptions table enforces valid_from/valid_to?
- [ ] BillingRules time-bound?
- [ ] SupportingResources time-bound?

---

## 🚦 Decision Points

**1. Should we include User/Auth table?**
- Currently missing user authentication table
- Add if we need multi-user access control
- Skip if single-user app

**2. Audit tables?**
- Do we need separate audit log table?
- Or are `created_at`, `updated_at`, `created_by` fields sufficient?

**3. Soft deletes?**
- Add `deleted_at` column pattern?
- Or use `active/inactive` flags where present?

---

## 📋 Your Feedback

Please confirm or request changes:
1. ✅ Approve schema as-is (we'll start building)
2. ❌ Request modifications (tell me what to change)
3. ❓ Questions about specific tables/fields

**What's your decision?**

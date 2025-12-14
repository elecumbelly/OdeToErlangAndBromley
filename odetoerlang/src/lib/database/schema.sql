-- OdeToErlang Database Schema
-- 22 Tables for WFM Ready Reckoner (21 + schema_version)
-- All values customisable, time-bound where appropriate

-- ============================================================================
-- SCHEMA VERSIONING
-- ============================================================================

-- Schema version tracking for database migrations
-- Version 1: Initial schema (v0.1.0)
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Insert version 1 if not exists
INSERT OR IGNORE INTO schema_version (version, description) VALUES (1, 'Initial schema - WFM Ready Reckoner');

-- ============================================================================
-- STAFF & ORGANISATION (6 tables)
-- ============================================================================

-- 1. STAFF - Employee records
CREATE TABLE IF NOT EXISTS Staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  primary_role_id INTEGER NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',  -- 'Full-time', 'Part-time', 'Contractor'
  manager_id INTEGER,                                  -- Self-referencing FK
  start_date DATE NOT NULL,
  end_date DATE,                                       -- NULL = active
  site_id INTEGER,
  attrition_probability REAL DEFAULT 0.15,             -- Annual (0.0-1.0)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_role_id) REFERENCES Roles(id),
  FOREIGN KEY (manager_id) REFERENCES Staff(id),
  FOREIGN KEY (site_id) REFERENCES Sites(id)
);

CREATE INDEX IF NOT EXISTS idx_staff_start_date ON Staff(start_date);
CREATE INDEX IF NOT EXISTS idx_staff_primary_role ON Staff(primary_role_id);
CREATE INDEX IF NOT EXISTS idx_staff_manager ON Staff(manager_id);
CREATE INDEX IF NOT EXISTS idx_staff_site ON Staff(site_id);
CREATE INDEX IF NOT EXISTS idx_staff_employment_type ON Staff(employment_type);

-- 2. ROLES - Job roles
CREATE TABLE IF NOT EXISTS Roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT UNIQUE NOT NULL,
  role_type TEXT NOT NULL,  -- 'Agent', 'TeamLeader', 'QA', 'Trainer', 'Manager', 'Specialist'
  reports_to_role_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reports_to_role_id) REFERENCES Roles(id)
);

CREATE INDEX IF NOT EXISTS idx_roles_type ON Roles(role_type);

-- 3. SKILLS - Agent capabilities
CREATE TABLE IF NOT EXISTS Skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT UNIQUE NOT NULL,
  skill_type TEXT,  -- 'Voice', 'Chat', 'Email', 'Technical', 'Collections', 'Marketing', 'Media', 'Response'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_type ON Skills(skill_type);

-- 4. STAFFSKILLS - Many-to-many: Staff ↔ Skills
CREATE TABLE IF NOT EXISTS StaffSkills (
  staff_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency_level INTEGER DEFAULT 1,  -- 1=Novice, 2=Intermediate, 3=Advanced, 4=Expert, 5=Master
  acquired_date DATE,
  PRIMARY KEY (staff_id, skill_id),
  FOREIGN KEY (staff_id) REFERENCES Staff(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES Skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_staffskills_staff ON StaffSkills(staff_id);
CREATE INDEX IF NOT EXISTS idx_staffskills_skill ON StaffSkills(skill_id);
CREATE INDEX IF NOT EXISTS idx_staffskills_proficiency ON StaffSkills(proficiency_level);

-- 5. STAFFSECONDARYROLES - Primary + secondary roles
CREATE TABLE IF NOT EXISTS StaffSecondaryRoles (
  staff_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_date DATE,
  PRIMARY KEY (staff_id, role_id),
  FOREIGN KEY (staff_id) REFERENCES Staff(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_staffsecondaryroles_staff ON StaffSecondaryRoles(staff_id);
CREATE INDEX IF NOT EXISTS idx_staffsecondaryroles_role ON StaffSecondaryRoles(role_id);

-- 6. SITES - Physical locations
CREATE TABLE IF NOT EXISTS Sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT UNIQUE NOT NULL,
  location TEXT,
  building_capacity INTEGER,
  desk_count INTEGER,
  timezone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CLIENTS & CAMPAIGNS (4 tables)
-- ============================================================================

-- 7. CLIENTS - BPO customers
CREATE TABLE IF NOT EXISTS Clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT UNIQUE NOT NULL,
  industry TEXT,                             -- Free text
  payment_terms INTEGER DEFAULT 30,         -- Days
  invoice_frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annual'
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_active ON Clients(active);

-- 8. CAMPAIGNS - Work units per client
CREATE TABLE IF NOT EXISTS Campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name TEXT UNIQUE NOT NULL,        -- Globally unique (includes client name)
  client_id INTEGER NOT NULL,
  channel_type TEXT NOT NULL,                -- 'Voice', 'Chat', 'Email', 'Video', 'Social', 'WhatsApp'
  start_date DATE NOT NULL,
  end_date DATE,
  sla_target_percent REAL DEFAULT 80.0,     -- Numeric for calculations
  sla_threshold_seconds INTEGER DEFAULT 20,  -- Numeric for calculations
  concurrency_allowed INTEGER DEFAULT 1,     -- Voice=1, Email=1, Chat=3 (editable)
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES Clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_client ON Campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON Campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON Campaigns(active);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON Campaigns(channel_type);

-- 9. CONTRACTS - Commercial agreements
CREATE TABLE IF NOT EXISTS Contracts (
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

CREATE INDEX IF NOT EXISTS idx_contracts_client ON Contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON Contracts(start_date, end_date);

-- 10. BILLINGRULES - How clients are billed
CREATE TABLE IF NOT EXISTS BillingRules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER NOT NULL,
  campaign_id INTEGER,                       -- NULL = all campaigns
  billing_model TEXT NOT NULL,               -- 'PerSeat', 'PerFTE', 'PerHour', 'PerHandleMinute', 'PerTransaction', 'Outcome', 'Hybrid'
  rate REAL NOT NULL,                        -- £ per unit (CUSTOMISABLE)
  penalty_per_sla_point REAL DEFAULT 0.0,   -- CUSTOMISABLE
  reward_per_sla_point REAL DEFAULT 0.0,    -- CUSTOMISABLE
  valid_from DATE NOT NULL,                  -- Time-bound
  valid_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES Contracts(id),
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_billingrules_contract ON BillingRules(contract_id);
CREATE INDEX IF NOT EXISTS idx_billingrules_campaign ON BillingRules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_billingrules_dates ON BillingRules(valid_from, valid_to);

-- ============================================================================
-- PLANNING & ASSUMPTIONS (3 tables)
-- ============================================================================

-- 11. ASSUMPTIONS - Time-bound planning parameters
CREATE TABLE IF NOT EXISTS Assumptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assumption_type TEXT NOT NULL,  -- 'AHT', 'Shrinkage', 'Occupancy', 'SLA', 'AveragePatience'
  value REAL NOT NULL,             -- CUSTOMISABLE
  unit TEXT,                       -- 'seconds', 'percent', 'ratio'
  valid_from DATE NOT NULL,        -- Time-bound (no permanent settings)
  valid_to DATE,
  campaign_id INTEGER,             -- NULL = global
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_assumptions_type ON Assumptions(assumption_type);
CREATE INDEX IF NOT EXISTS idx_assumptions_campaign ON Assumptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_assumptions_dates ON Assumptions(valid_from, valid_to);

-- 12. CALENDAREVENTS - Capacity-impacting events
CREATE TABLE IF NOT EXISTS CalendarEvents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,                  -- 'Training', 'Onboarding', 'Holiday', 'Downtime', 'Meeting', 'TownHall'
  event_name TEXT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  all_day BOOLEAN DEFAULT 0,
  productivity_modifier REAL DEFAULT 1.0,    -- CUSTOMISABLE (1.0=full, 0.5=50%, 0.0=none)
  applies_to_filter TEXT,                    -- JSON: {"skill": "Chat", "tenure_min": 90}
  campaign_id INTEGER,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_dates ON CalendarEvents(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_campaign ON CalendarEvents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON CalendarEvents(event_type);

-- 13. PRODUCTIVITYCURVES - Learning curves
CREATE TABLE IF NOT EXISTS ProductivityCurves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curve_name TEXT UNIQUE NOT NULL,
  curve_type TEXT DEFAULT 'S-Curve',         -- 'Linear', 'S-Curve', 'Exponential', 'Custom'
  days_to_full_productivity INTEGER NOT NULL, -- CUSTOMISABLE
  day_1_percent REAL NOT NULL,               -- CUSTOMISABLE (e.g., 40.0 for 40%)
  day_7_percent REAL,
  day_14_percent REAL,
  day_30_percent REAL,
  day_60_percent REAL,
  custom_curve_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. EVENTASSIGNMENTS - Many-to-many: CalendarEvents ↔ Staff
CREATE TABLE IF NOT EXISTS EventAssignments (
  event_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  productivity_curve_id INTEGER,             -- Post-event ramp
  PRIMARY KEY (event_id, staff_id),
  FOREIGN KEY (event_id) REFERENCES CalendarEvents(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES Staff(id) ON DELETE CASCADE,
  FOREIGN KEY (productivity_curve_id) REFERENCES ProductivityCurves(id)
);

CREATE INDEX IF NOT EXISTS idx_eventassignments_event ON EventAssignments(event_id);
CREATE INDEX IF NOT EXISTS idx_eventassignments_staff ON EventAssignments(staff_id);

-- ============================================================================
-- FORECASTING (3 tables)
-- ============================================================================

-- 15. SCENARIOS - Version control for forecasts
CREATE TABLE IF NOT EXISTS Scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_baseline BOOLEAN DEFAULT 0,
  erlang_model TEXT DEFAULT 'C',  -- 'B', 'C', or 'A' - which Erlang model to use
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_scenarios_baseline ON Scenarios(is_baseline);

-- 16. FORECASTS - Predicted demand & staffing
CREATE TABLE IF NOT EXISTS Forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forecast_name TEXT NOT NULL,
  scenario_id INTEGER NOT NULL,
  model_type TEXT NOT NULL,                  -- 'ErlangC', 'ErlangA', 'ErlangX', 'Prophet', 'Manual'
  campaign_id INTEGER NOT NULL,
  forecast_date DATE NOT NULL,
  forecasted_volume REAL NOT NULL,           -- CUSTOMISABLE (manual override)
  forecasted_aht REAL,
  required_agents INTEGER,
  required_fte REAL,
  expected_sla REAL,
  expected_occupancy REAL,
  expected_asa REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES Scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_forecasts_scenario ON Forecasts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_campaign ON Forecasts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_date ON Forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecasts_model ON Forecasts(model_type);

-- 17. HISTORICALDATA - CSV imports (3+ years)
CREATE TABLE IF NOT EXISTS HistoricalData (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_id INTEGER,
  campaign_id INTEGER,
  date DATE NOT NULL,
  interval_start TIME,
  interval_end TIME,
  volume INTEGER NOT NULL,
  aht REAL,
  abandons INTEGER,
  sla_achieved REAL,
  asa REAL,
  actual_fte REAL,
  actual_agents INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_historical_date ON HistoricalData(date);
CREATE INDEX IF NOT EXISTS idx_historical_campaign ON HistoricalData(campaign_id);
CREATE INDEX IF NOT EXISTS idx_historical_batch ON HistoricalData(import_batch_id);

-- ============================================================================
-- RESOURCES & RECRUITMENT (4 tables)
-- ============================================================================

-- 18. SUPPORTINGRESOURCES - IT & facility constraints
CREATE TABLE IF NOT EXISTS SupportingResources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_type TEXT NOT NULL,               -- 'ACD_Seat', 'CRM_Licence', 'Desk', 'BuildingCapacity'
  resource_name TEXT NOT NULL,
  site_id INTEGER,
  quantity INTEGER NOT NULL,                 -- CUSTOMISABLE
  cost_per_unit REAL,                        -- CUSTOMISABLE
  billing_frequency TEXT DEFAULT 'monthly',
  vendor TEXT,
  contract_end_date DATE,
  valid_from DATE NOT NULL,                  -- Time-bound
  valid_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES Sites(id)
);

CREATE INDEX IF NOT EXISTS idx_resources_type ON SupportingResources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_site ON SupportingResources(site_id);
CREATE INDEX IF NOT EXISTS idx_resources_dates ON SupportingResources(valid_from, valid_to);

-- 19. ATTRITIONCURVES - Tenure-based churn
CREATE TABLE IF NOT EXISTS AttritionCurves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curve_name TEXT UNIQUE NOT NULL,
  tenure_min_months INTEGER NOT NULL,
  tenure_max_months INTEGER,                 -- NULL = infinite (e.g., "12+ months")
  annual_attrition_rate REAL NOT NULL,      -- CUSTOMISABLE (0.0-1.0, e.g., 0.40 = 40%)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attrition_tenure ON AttritionCurves(tenure_min_months, tenure_max_months);

-- 20. RECRUITMENTPIPELINE - Hiring stages
CREATE TABLE IF NOT EXISTS RecruitmentPipeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_name TEXT UNIQUE NOT NULL,
  stage_order INTEGER NOT NULL,
  pass_rate REAL NOT NULL,                   -- CUSTOMISABLE (0.0-1.0, e.g., 0.70 = 70% pass)
  avg_duration_days INTEGER,                 -- CUSTOMISABLE
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_order ON RecruitmentPipeline(stage_order);

-- 21. RECRUITMENTREQUESTS - Hiring demand
CREATE TABLE IF NOT EXISTS RecruitmentRequests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  campaign_id INTEGER,
  quantity_requested INTEGER NOT NULL,       -- CUSTOMISABLE
  requested_date DATE NOT NULL,
  target_start_date DATE,
  status TEXT DEFAULT 'Open',                -- 'Open', 'InProgress', 'Filled', 'Cancelled'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES Roles(id),
  FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_recruitment_role ON RecruitmentRequests(role_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_campaign ON RecruitmentRequests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_status ON RecruitmentRequests(status);

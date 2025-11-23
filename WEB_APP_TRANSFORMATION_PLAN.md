# OdeToErlang Web App - WFM Platform Transformation Plan
**3-5 Day Sprint to Full Enterprise WFM System**

**Date:** 2025-11-23
**Platform:** Web (React + TypeScript + Vite)
**Timeline:** Next few days (aggressive sprint)
**Developer:** Solo + Claude Code

---

## 🎯 Transformation Strategy

### Current State
- Simple calculator with Erlang C/A/X
- 9 tabs (Calculator, Charts, Multi-Channel, Scenarios, Model Comparison, Capacity Planning, Import, Export, Learn)
- Zustand state management
- No database (ephemeral state)
- No historical data support

### Target State
- **6 core WFM pages** + supporting features
- **SQLite database** (via sql.js for browser)
- **Time-bound assumptions** (all settings have date ranges)
- **CSV import/export** for historical data
- **Scenario versioning** system
- **Calendar-driven capacity planning**
- **Client/contract management**
- **Prophet forecasting** (TensorFlow.js or Python API)

---

## 📅 3-Day Sprint Plan

### **Day 1: Foundation & Database**
**Goal:** Set up architecture, database, clean up existing code

**Morning (4 hours):**
1. ✅ Clean up debug code (remove red boxes)
2. ✅ Fix ActualStaffPanel rendering issue
3. ✅ Install sql.js (`npm install sql.js`)
4. ✅ Create database initialization script
5. ✅ Implement all 10 tables (Staff, Skills, Clients, Campaigns, CalendarEvents, Forecasts, Scenarios, SupportingResources, BillingRules, HistoricalData)
6. ✅ Create database service layer (CRUD operations)

**Afternoon (4 hours):**
7. ✅ Refactor state management (add database integration)
8. ✅ Create time-bound assumptions system
9. ✅ Update Calculator page to use database
10. ✅ Test database persistence (data survives page refresh)

**Deliverables:**
- Working SQLite database in browser
- All tables created with proper schema
- Calculator page connected to database
- Time-bound assumptions working

---

### **Day 2: Core Pages (Calculator, Forecasting, Calendar)**
**Goal:** Build the 3 most critical pages

**Morning (4 hours):**
1. ✅ **Calculator Page Enhancement:**
   - CSV import UI + parser (handle 3+ years of data)
   - Historical data storage in HistoricalData table
   - Historical analysis charts (demand, SLA, abandons)
   - Required vs Actual FTE gap analysis

**Afternoon (4 hours):**
2. ✅ **Forecasting Page:**
   - Create new Forecasting tab
   - Build forecast engine (apply Erlang C/A/X to future dates)
   - Scenario creation/editing UI
   - A/B scenario comparison (side-by-side charts)
   - Store forecasts in Forecasts table

**Evening (2-3 hours):**
3. ✅ **Calendar Page (Basic):**
   - Create Calendar tab
   - Month view with events
   - Event creation UI (modal/sidebar)
   - Store events in CalendarEvents table

**Deliverables:**
- Calculator page with historical import working
- Forecasting page with scenario comparison
- Basic calendar with event creation

---

### **Day 3: Workforce Planning, Resources, Clients**
**Goal:** Complete remaining core pages

**Morning (4 hours):**
4. ✅ **Strategic Workforce Planning Page:**
   - Create Workforce Planning tab
   - Roles management (create/edit roles)
   - Attrition curve editor
   - Recruitment pipeline visualisation
   - Monthly hiring plan calculation

**Afternoon (4 hours):**
5. ✅ **Supporting Resources Page:**
   - Create Resources tab
   - IT licences inventory (ACD, CRM, telephony)
   - Facility constraints (desks, building capacity)
   - Utilisation charts
   - Breach warnings

**Evening (2-3 hours):**
6. ✅ **BPO Client Management Page:**
   - Create Clients tab
   - Client CRUD operations
   - Campaign management (one-to-many)
   - Billing model configuration (6 types)
   - Revenue/cost/profit calculations

**Deliverables:**
- All 6 core pages functional
- Database fully integrated
- Basic workflows working end-to-end

---

### **Day 4-5: Integration, Polish, Testing**
**Goal:** Connect everything, fix bugs, optimize

**Tasks:**
7. Cross-page integration (calendar events → forecasting)
8. Event-driven capacity updates
9. Productivity curves implementation
10. UI/UX polish (loading states, error handling)
11. Performance optimization (database indexing, lazy loading)
12. Export functionality (PDF reports, CSV)
13. Bug fixes and edge cases
14. Documentation

---

## 🗂️ Database Implementation (sql.js)

### Setup
```bash
npm install sql.js
```

### Initialize Database
```typescript
// src/lib/database/initDatabase.ts
import initSqlJs from 'sql.js';

let db: any = null;

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  // Try to load from localStorage
  const savedDb = localStorage.getItem('odetoerlang_db');
  if (savedDb) {
    const buf = Buffer.from(savedDb, 'base64');
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    await createTables();
  }

  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  localStorage.setItem('odetoerlang_db', buffer.toString('base64'));
}

async function createTables() {
  // Execute all CREATE TABLE statements
  db.run(`
    CREATE TABLE IF NOT EXISTS Staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      site_id INTEGER,
      attrition_probability REAL DEFAULT 0.15
    );

    CREATE TABLE IF NOT EXISTS Scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_baseline BOOLEAN DEFAULT 0
    );

    -- Add all other tables...
  `);

  saveDatabase();
}
```

---

## 📊 Page-by-Page Implementation Plan

### 1. Calculator Page (Enhanced)

**Current State:** Basic calculator with instant calculation

**New Requirements:**
- CSV import for historical data (3+ years)
- Time-bound assumptions panel
- Historical analysis section (if data imported)

**Implementation:**

**A) CSV Import Component**
```typescript
// src/components/CSVHistoricalImport.tsx
interface HistoricalDataRow {
  date: string;
  interval_start?: string;
  volume: number;
  aht?: number;
  abandons?: number;
  sla_achieved?: number;
  actual_fte?: number;
}

function CSVHistoricalImport() {
  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text); // Use Papa Parse

    // Validate data
    validateHistoricalData(rows);

    // Insert into database
    await insertHistoricalData(rows);

    // Trigger re-render of historical charts
  };

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8">
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <p className="text-sm text-gray-600 mt-2">
        Upload historical data (CSV): Date, Volume, AHT, Abandons, SLA, Actual FTE
      </p>
    </div>
  );
}
```

**B) Time-Bound Assumptions Panel**
```typescript
// src/components/TimeBoundAssumptions.tsx
interface Assumption {
  id?: number;
  assumption_type: 'AHT' | 'Shrinkage' | 'Occupancy' | 'SLA';
  value: number;
  valid_from: string; // ISO date
  valid_to: string | null;
  campaign_id?: number;
}

function TimeBoundAssumptions() {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);

  const addAssumption = async (assumption: Assumption) => {
    await db.run(`
      INSERT INTO Assumptions (assumption_type, value, valid_from, valid_to)
      VALUES (?, ?, ?, ?)
    `, [assumption.assumption_type, assumption.value, assumption.valid_from, assumption.valid_to]);

    loadAssumptions();
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Time-Bound Assumptions</h3>

      {assumptions.map(assumption => (
        <div key={assumption.id} className="flex items-center gap-4 mb-2">
          <span className="font-medium">{assumption.assumption_type}</span>
          <span>{assumption.value}</span>
          <span className="text-xs text-gray-500">
            {assumption.valid_from} → {assumption.valid_to || 'Present'}
          </span>
          <button onClick={() => editAssumption(assumption.id)}>Edit</button>
        </div>
      ))}

      <button onClick={() => setShowAddModal(true)}>
        + Add Assumption
      </button>
    </div>
  );
}
```

**C) Historical Analysis Charts**
```typescript
// src/components/HistoricalAnalysis.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function HistoricalAnalysis() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    const result = db.exec(`
      SELECT date, volume, sla_achieved, actual_fte
      FROM HistoricalData
      ORDER BY date
    `);

    setData(formatData(result));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Demand Chart */}
      <div className="bg-white p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Historical Demand</h4>
        <LineChart width={400} height={250} data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="volume" stroke="#3B82F6" />
        </LineChart>
      </div>

      {/* SLA Achievement */}
      <div className="bg-white p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">SLA Achievement</h4>
        <LineChart width={400} height={250} data={data}>
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="sla_achieved" stroke="#10B981" />
        </LineChart>
      </div>

      {/* Required vs Actual FTE Gap */}
      <div className="bg-white p-4 rounded-lg col-span-2">
        <h4 className="text-sm font-semibold mb-2">Staffing Gap Analysis</h4>
        <LineChart width={800} height={250} data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="required_fte" stroke="#EF4444" name="Required FTE" />
          <Line type="monotone" dataKey="actual_fte" stroke="#8B5CF6" name="Actual FTE" />
        </LineChart>
      </div>
    </div>
  );
}
```

---

### 2. Forecasting Page (New)

**Requirements:**
- Forecast demand using Erlang C/A/X
- Scenario creation and comparison
- A/B testing UI

**Implementation:**

**A) Forecast Engine**
```typescript
// src/lib/forecasting/forecastEngine.ts
interface ForecastInput {
  scenario_id: number;
  model_type: 'ErlangC' | 'ErlangA' | 'ErlangX' | 'Prophet';
  campaign_id: number;
  start_date: string;
  end_date: string;
  assumptions: {
    aht: number;
    shrinkage: number;
    occupancy: number;
    sla_target: number;
  };
}

export async function generateForecast(input: ForecastInput) {
  const forecasts = [];

  // For each day in date range
  let currentDate = new Date(input.start_date);
  const endDate = new Date(input.end_date);

  while (currentDate <= endDate) {
    // Get forecasted volume (from historical average, Prophet model, or user input)
    const volume = await getForecastedVolume(currentDate, input.campaign_id);

    // Calculate required agents using selected model
    let requiredAgents, requiredFTE;

    if (input.model_type === 'ErlangC') {
      const trafficIntensity = (volume * input.assumptions.aht) / (8 * 3600); // 8-hour day
      requiredAgents = solveAgents(trafficIntensity, input.assumptions.aht, input.assumptions.sla_target / 100, 20);
      requiredFTE = requiredAgents / (1 - input.assumptions.shrinkage / 100);
    }
    // ... similar for ErlangA, ErlangX

    forecasts.push({
      scenario_id: input.scenario_id,
      model_type: input.model_type,
      campaign_id: input.campaign_id,
      forecast_date: currentDate.toISOString().split('T')[0],
      forecasted_volume: volume,
      forecasted_aht: input.assumptions.aht,
      required_agents: requiredAgents,
      required_fte: requiredFTE
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insert forecasts into database
  await insertForecasts(forecasts);

  return forecasts;
}
```

**B) Scenario Comparison UI**
```typescript
// src/components/ScenarioComparison.tsx
function ScenarioComparisonView() {
  const [scenarioA, setScenarioA] = useState<number | null>(null);
  const [scenarioB, setScenarioB] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState([]);

  const loadComparison = async () => {
    const dataA = await loadScenarioData(scenarioA);
    const dataB = await loadScenarioData(scenarioB);

    // Merge data for side-by-side comparison
    const merged = dataA.map((a, i) => ({
      date: a.forecast_date,
      scenarioA_fte: a.required_fte,
      scenarioB_fte: dataB[i]?.required_fte,
      difference: a.required_fte - (dataB[i]?.required_fte || 0)
    }));

    setComparisonData(merged);
  };

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <select onChange={(e) => setScenarioA(Number(e.target.value))}>
          <option>Select Scenario A</option>
          {/* Load scenarios from database */}
        </select>

        <select onChange={(e) => setScenarioB(Number(e.target.value))}>
          <option>Select Scenario B</option>
        </select>

        <button onClick={loadComparison}>Compare</button>
      </div>

      <LineChart width={1000} height={400} data={comparisonData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="scenarioA_fte" stroke="#3B82F6" name="Scenario A" />
        <Line type="monotone" dataKey="scenarioB_fte" stroke="#EF4444" name="Scenario B" />
        <Line type="monotone" dataKey="difference" stroke="#10B981" name="Difference" strokeDasharray="5 5" />
      </LineChart>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Summary</h4>
        <p>Average Difference: {calculateAverage(comparisonData, 'difference').toFixed(2)} FTE</p>
        <p>Max Difference: {Math.max(...comparisonData.map(d => d.difference)).toFixed(2)} FTE</p>
      </div>
    </div>
  );
}
```

---

### 3. Calendar Page (New)

**Requirements:**
- Month/week/day views
- Event creation (training, meetings, holidays, downtime)
- Drag-drop editing
- Conflict detection
- Auto-update forecasting when events change

**Implementation:**

**Use existing calendar library to save time:**
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
```

```typescript
// src/components/CalendarView.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

function CalendarView() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const result = db.exec(`
      SELECT id, event_name, start_datetime, end_datetime, event_type, productivity_modifier
      FROM CalendarEvents
      WHERE start_datetime >= date('now', '-1 month')
    `);

    const formattedEvents = result[0]?.values.map(row => ({
      id: row[0],
      title: row[1],
      start: row[2],
      end: row[3],
      backgroundColor: getColorForEventType(row[4]),
      extendedProps: {
        eventType: row[4],
        productivityModifier: row[5]
      }
    })) || [];

    setEvents(formattedEvents);
  };

  const handleEventClick = (info) => {
    // Open event details modal
    openEventModal(info.event.id);
  };

  const handleDateClick = (info) => {
    // Create new event
    openCreateEventModal(info.dateStr);
  };

  const handleEventDrop = async (info) => {
    // Update event dates in database
    await db.run(`
      UPDATE CalendarEvents
      SET start_datetime = ?, end_datetime = ?
      WHERE id = ?
    `, [info.event.startStr, info.event.endStr, info.event.id]);

    saveDatabase();

    // Trigger forecasting recalculation
    triggerForecastUpdate();
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          editable={true}
          droppable={true}
        />
      </div>

      {/* Event creation/edit modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleEventSave}
      />
    </div>
  );
}
```

---

### 4. Strategic Workforce Planning Page (New)

**Requirements:**
- Roles management
- Attrition curve editor
- Recruitment pipeline
- Hiring plan calculation

**Implementation:**

```typescript
// src/components/WorkforcePlanning.tsx
function WorkforcePlanning() {
  return (
    <div className="p-6 space-y-8">
      {/* Roles Section */}
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Organisational Structure</h2>
        <RolesManager />
      </div>

      {/* Attrition Section */}
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Attrition Modelling</h2>
        <AttritionCurveEditor />
      </div>

      {/* Recruitment Pipeline */}
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Recruitment Pipeline</h2>
        <RecruitmentPipeline />
      </div>

      {/* Hiring Plan */}
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Monthly Hiring Plan</h2>
        <HiringPlan />
      </div>
    </div>
  );
}
```

---

### 5. Supporting Resources Page (New)

```typescript
// src/components/SupportingResources.tsx
function SupportingResources() {
  const [resources, setResources] = useState([]);
  const [utilisation, setUtilisation] = useState({});

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IT Licences */}
        <div className="bg-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">IT Licences</h3>
          <ResourceInventory type="IT" />
        </div>

        {/* Facilities */}
        <div className="bg-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Facility Constraints</h3>
          <ResourceInventory type="Facility" />
        </div>

        {/* Utilisation Chart */}
        <div className="bg-white p-6 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-4">Resource Utilisation</h3>
          <UtilisationChart data={utilisation} />
        </div>

        {/* Breach Warnings */}
        <div className="bg-white p-6 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-4">Capacity Warnings</h3>
          <BreachWarnings />
        </div>
      </div>
    </div>
  );
}
```

---

### 6. BPO Client Management Page (New)

```typescript
// src/components/ClientManagement.tsx
function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="bg-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Clients</h3>
          <ClientList
            clients={clients}
            onSelect={setSelectedClient}
          />
          <button className="mt-4 w-full btn-primary">+ Add Client</button>
        </div>

        {/* Client Details */}
        {selectedClient && (
          <>
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Client Details</h3>
              <ClientDetails client={selectedClient} />
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
              <FinancialSummary clientId={selectedClient.id} />
            </div>
          </>
        )}

        {/* Campaigns */}
        <div className="bg-white p-4 rounded-lg col-span-3">
          <h3 className="text-lg font-semibold mb-4">Campaigns</h3>
          {selectedClient && <CampaignList clientId={selectedClient.id} />}
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Getting Started - First Steps

### Step 1: Clean Up & Prep (30 minutes)

```bash
# Install new dependencies
npm install sql.js @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
```

Remove debug code from App.tsx:
- Remove red test boxes (lines 109-111, 135-137)
- Keep ActualStaffPanel for now (will integrate later)

### Step 2: Initialize Database (1 hour)

Create `src/lib/database/` folder with:
- `initDatabase.ts` - Database initialization
- `schema.sql` - All CREATE TABLE statements
- `queries.ts` - Common queries as functions
- `service.ts` - High-level CRUD operations

### Step 3: Start Building (Day 1 afternoon)

Begin with Calculator page enhancements:
1. CSV import component
2. Store data in HistoricalData table
3. Display historical charts

---

## ✅ Success Criteria

**End of Day 1:**
- ✅ Database working with all tables
- ✅ Data persists across page refreshes
- ✅ Calculator page uses database
- ✅ Time-bound assumptions working

**End of Day 2:**
- ✅ Historical CSV import functional
- ✅ Forecasting page with scenario comparison
- ✅ Calendar page with basic events

**End of Day 3:**
- ✅ All 6 pages built
- ✅ Cross-page integration working
- ✅ Event-driven capacity updates

**End of Day 4-5:**
- ✅ Polished UI/UX
- ✅ Bug fixes complete
- ✅ Export functionality working
- ✅ Ready for production

---

## 🎯 Let's Start!

Ready to begin? I'll start with:
1. Cleaning up debug code
2. Installing sql.js
3. Creating database initialization

Say "GO" and I'll start making changes!

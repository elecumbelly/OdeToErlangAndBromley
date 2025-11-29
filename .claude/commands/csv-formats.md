# CSV Input/Output Formats

Load this context when working on CSV import/export functionality.

---

## Volume Data (`volumes.csv`)

**Purpose:** Historical or forecasted contact volumes

```csv
Date,Time,Channel,Skill,Volume
2025-01-15,09:00,Voice,Sales,120
2025-01-15,09:30,Voice,Sales,145
2025-01-15,09:00,Chat,Support,45
2025-01-15,09:00,Email,Support,30
```

**Columns:**
- `Date`: ISO 8601 or MM/DD/YYYY or DD/MM/YYYY
- `Time`: HH:MM (24-hour) or HH:MM AM/PM
- `Channel`: Voice, Chat, Email, Social, Video, Custom
- `Skill`: Skill/queue name (e.g., Sales, Support, Billing)
- `Volume`: Integer contact count

---

## Average Handle Time (`aht.csv`)

**Purpose:** AHT by channel and skill

```csv
Channel,Skill,AHT_Seconds
Voice,Sales,420
Voice,Support,360
Chat,Sales,180
Chat,Support,240
Email,Support,300
```

**Columns:**
- `Channel`: Voice, Chat, Email, etc.
- `Skill`: Skill/queue name
- `AHT_Seconds`: Average handle time in seconds

---

## Service Level Targets (`sla.csv`)

**Purpose:** Target service levels by channel/skill

```csv
Channel,Skill,Target_Percent,Threshold_Seconds
Voice,Sales,80,20
Voice,Support,90,30
Chat,*,85,60
Email,*,90,86400
```

**Columns:**
- `Channel`: Channel name
- `Skill`: Skill name or `*` for all skills
- `Target_Percent`: Target percentage (0-100)
- `Threshold_Seconds`: Time threshold (86400 = 24 hours)

---

## Shrinkage Configuration (`shrinkage.csv`)

**Purpose:** Shrinkage breakdown by category

```csv
Category,Percentage
Breaks,8.33
Lunch,4.17
Training,5.00
Meetings,3.00
Absenteeism,4.00
Coaching,2.50
System_Downtime,1.00
```

**Columns:**
- `Category`: Shrinkage type
- `Percentage`: Percentage of time (will be summed for total)

---

## Staffing Assumptions (`assumptions.csv`)

**Purpose:** Global calculation parameters

```csv
Parameter,Value
Target_Occupancy,0.85
Interval_Minutes,30
Hours_Per_FTE,40
Cost_Per_Hour,25.00
Formula,ErlangC
Currency,USD
```

**Parameters:**
- `Target_Occupancy`: Decimal (0.85 = 85%)
- `Interval_Minutes`: 15, 30, or 60
- `Hours_Per_FTE`: Weekly hours for 1 FTE
- `Cost_Per_Hour`: Hourly labor cost
- `Formula`: ErlangB, ErlangC, ErlangA, ErlangX
- `Currency`: ISO currency code

---

## Import Guidelines

### Header Flexibility
- Case-insensitive matching
- Support common variations:
  - `AHT`, `AHT_Seconds`, `Average_Handle_Time`
  - `Volume`, `Contacts`, `Calls`
  - `SL`, `Service_Level`, `Target_Percent`

### Date/Time Parsing
- ISO 8601: `2025-01-15`, `2025-01-15T09:00:00`
- US Format: `01/15/2025`, `1/15/2025`
- EU Format: `15/01/2025`, `15-01-2025`
- Time: `09:00`, `9:00 AM`, `09:00:00`

### Wildcards
- `*` in Skill column = applies to all skills
- `*` in Channel column = applies to all channels

### Validation Rules
- Volume must be non-negative integer
- AHT must be positive number
- Percentages must be 0-100 (or 0.0-1.0 if decimal)
- Threshold must be positive

### Error Handling
- Report row number and column for errors
- Provide suggested fixes
- Allow partial import with warnings
- Validate before processing

---

## Export Formats

### Results Export (`results.csv`)
```csv
Date,Time,Channel,Skill,Volume,AHT,Required_Agents,FTE,Service_Level,Occupancy
2025-01-15,09:00,Voice,Sales,120,420,15,18.75,0.82,0.84
```

### Summary Export (`summary.csv`)
```csv
Metric,Value
Total_FTE,125.5
Average_Service_Level,0.83
Average_Occupancy,0.86
Total_Cost,12550.00
```

# CSV Import/Export Formats

**Auto-loaded when:** Working on CSV parsing, data import/export, file formats

---

## CSV Import Philosophy

**Principles:**
- **Flexible:** Support common variations in column naming
- **Forgiving:** Handle minor format differences gracefully
- **Validated:** Catch errors early with clear messages
- **Documented:** Provide sample files and format specifications

---

## 1. Volume Data (`volumes.csv`)

### Purpose
Historical or forecasted contact volume by interval

### Expected Columns

**Required:**
- `Date` - Date of interval (YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY)
- `Time` - Time of interval (HH:MM in 24-hour format)
- `Volume` - Number of contacts

**Optional:**
- `Channel` - Channel name (Voice, Chat, Email, etc.) - defaults to "Voice"
- `Skill` - Skill name (Sales, Support, etc.) - defaults to "*" (all skills)
- `Day` - Day of week (Monday, Tuesday, etc.) - can be derived from Date

### Sample File
```csv
Date,Time,Channel,Skill,Volume
2025-01-15,09:00,Voice,Sales,120
2025-01-15,09:30,Voice,Sales,145
2025-01-15,10:00,Voice,Sales,160
2025-01-15,09:00,Chat,Support,45
2025-01-15,09:30,Chat,Support,52
2025-01-15,10:00,Chat,Support,48
```

### Alternative Formats Supported

**Minimal (Voice only):**
```csv
Time,Volume
09:00,120
09:30,145
10:00,160
```

**With day of week:**
```csv
Day,Time,Volume
Monday,09:00,120
Monday,09:30,145
```

### Validation Rules
```javascript
{
  Date: {
    required: false, // Can use Day instead
    format: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
    range: '1900-01-01 to 2100-12-31'
  },
  Time: {
    required: true,
    format: 'HH:MM (24-hour)',
    range: '00:00 to 23:59'
  },
  Volume: {
    required: true,
    type: 'number',
    range: '0 to 1000000',
    decimals: false // Must be integer
  },
  Channel: {
    required: false,
    default: 'Voice',
    allowedValues: ['Voice', 'Chat', 'Email', 'Social', 'Video', 'Custom']
  },
  Skill: {
    required: false,
    default: '*',
    maxLength: 50
  }
}
```

### Column Name Variations (Case-Insensitive)
```javascript
// All these are recognized as "Volume"
const VOLUME_ALIASES = [
  'volume', 'vol', 'calls', 'contacts', 'count', 'quantity', 'interactions'
];

// All these are recognized as "Time"
const TIME_ALIASES = [
  'time', 'interval', 'period', 'hour'
];
```

---

## 2. Average Handle Time (`aht.csv`)

### Purpose
Average handle time by channel and/or skill

### Expected Columns

**Required:**
- `AHT` - Average Handle Time in seconds

**Optional:**
- `Channel` - Channel name (defaults to "Voice")
- `Skill` - Skill name (defaults to "*")
- `AHT_Minutes` - Alternative to AHT (will convert to seconds)

### Sample File
```csv
Channel,Skill,AHT
Voice,Sales,420
Voice,Support,360
Voice,Collections,540
Chat,Sales,180
Chat,Support,240
Email,Support,300
```

### Alternative Formats

**Single AHT for all:**
```csv
AHT
360
```

**AHT in minutes:**
```csv
Channel,Skill,AHT_Minutes
Voice,Sales,7.0
Voice,Support,6.0
```

**With talk time and ACW breakdown:**
```csv
Channel,Skill,Talk_Time,ACW,AHT
Voice,Sales,300,120,420
```

### Validation Rules
```javascript
{
  AHT: {
    required: 'if AHT_Minutes not provided',
    type: 'number',
    range: '1 to 7200', // 1 second to 2 hours
    unit: 'seconds'
  },
  AHT_Minutes: {
    required: 'if AHT not provided',
    type: 'number',
    range: '0.01 to 120',
    conversion: 'multiply by 60 to get AHT'
  },
  Channel: {
    required: false,
    default: 'Voice'
  },
  Skill: {
    required: false,
    default: '*'
  }
}
```

---

## 3. Service Level Targets (`sla.csv`)

### Purpose
Service level targets by channel and/or skill

### Expected Columns

**Required:**
- `Target_Percent` - Target percentage (0-100 or 0-1)
- `Threshold_Seconds` - Time threshold in seconds

**Optional:**
- `Channel` - Channel name (defaults to "Voice")
- `Skill` - Skill name (defaults to "*")
- `Threshold_Minutes` - Alternative to Threshold_Seconds

### Sample File
```csv
Channel,Skill,Target_Percent,Threshold_Seconds
Voice,Sales,80,20
Voice,Support,90,30
Chat,*,85,60
Email,*,90,86400
```

### Alternative Formats

**Single SLA for all:**
```csv
Target_Percent,Threshold_Seconds
80,20
```

**Using "80/20" notation:**
```csv
Channel,SLA
Voice,80/20
Chat,85/60
Email,90/24h
```

### Validation Rules
```javascript
{
  Target_Percent: {
    required: true,
    type: 'number',
    range: '0 to 100', // Also accepts 0-1 (auto-detects)
    conversion: 'if > 1, divide by 100'
  },
  Threshold_Seconds: {
    required: 'if Threshold_Minutes not provided',
    type: 'number',
    range: '1 to 604800', // 1 second to 1 week
    unit: 'seconds'
  },
  SLA: {
    required: 'if Target_Percent and Threshold_Seconds not provided',
    format: 'X/Y where X is percent and Y is seconds or minutes',
    examples: ['80/20', '90/30', '85/60']
  }
}
```

---

## 4. Shrinkage Configuration (`shrinkage.csv`)

### Purpose
Breakdown of shrinkage categories

### Expected Columns

**Required:**
- `Category` - Shrinkage category name
- `Percentage` - Percentage (0-100 or 0-1)

### Sample File
```csv
Category,Percentage
Breaks,8.33
Lunch,4.17
Training,5.00
Meetings,3.00
Absenteeism,4.00
System_Downtime,1.50
```

### Alternative Formats

**Single total shrinkage:**
```csv
Shrinkage
25
```

**With time duration instead of percentage:**
```csv
Category,Minutes_Per_Day
Breaks,40
Lunch,30
Training,30
Meetings,20
```

### Validation Rules
```javascript
{
  Category: {
    required: true,
    maxLength: 50,
    allowedValues: [
      'Breaks', 'Lunch', 'Training', 'Meetings', 'Coaching',
      'Absenteeism', 'System_Downtime', 'Other'
    ] // Can add custom categories
  },
  Percentage: {
    required: 'if Minutes_Per_Day not provided',
    type: 'number',
    range: '0 to 100',
    total_warning: 'Warn if total > 50%'
  },
  Minutes_Per_Day: {
    required: 'if Percentage not provided',
    type: 'number',
    range: '0 to 480', // 8-hour workday
    conversion: 'divide by 480 to get percentage'
  }
}
```

---

## 5. Configuration/Assumptions (`assumptions.csv`)

### Purpose
General configuration parameters

### Expected Columns

**Required:**
- `Parameter` - Parameter name
- `Value` - Parameter value

### Sample File
```csv
Parameter,Value
Target_Occupancy,0.85
Interval_Minutes,30
Hours_Per_FTE,40
Cost_Per_Hour,25.00
Formula_Type,ErlangC
Abandonment_Rate,0.10
Average_Patience,120
```

### Supported Parameters
```javascript
{
  Target_Occupancy: {
    type: 'number',
    range: '0.5 to 1.0',
    default: 0.85
  },
  Interval_Minutes: {
    type: 'number',
    allowedValues: [15, 30, 60],
    default: 30
  },
  Hours_Per_FTE: {
    type: 'number',
    range: '1 to 80',
    default: 40
  },
  Cost_Per_Hour: {
    type: 'number',
    range: '0 to 1000',
    default: 25.00
  },
  Formula_Type: {
    type: 'string',
    allowedValues: ['ErlangB', 'ErlangC', 'ErlangA', 'ErlangX'],
    default: 'ErlangC'
  },
  Abandonment_Rate: {
    type: 'number',
    range: '0 to 1',
    default: 0.10
  },
  Average_Patience: {
    type: 'number',
    range: '1 to 600',
    unit: 'seconds',
    default: 120
  }
}
```

---

## CSV Import Implementation

### Parser Function Structure
```javascript
/**
 * Generic CSV parser with validation
 */
export function parseCSV(content, schema) {
  // 1. Parse with Papa Parse
  const { data, errors } = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader
  });

  // 2. Validate each row
  const validated = data.map((row, index) => {
    const result = validateRow(row, schema);
    if (!result.valid) {
      errors.push({
        row: index + 2, // +2 for header and 0-index
        errors: result.errors
      });
      return null;
    }
    return normalizeRow(row, schema);
  }).filter(Boolean);

  return { data: validated, errors };
}

/**
 * Normalize header names (flexible matching)
 */
function normalizeHeader(header) {
  const normalized = header.toLowerCase().trim();

  // Check aliases
  if (VOLUME_ALIASES.includes(normalized)) return 'Volume';
  if (TIME_ALIASES.includes(normalized)) return 'Time';
  if (DATE_ALIASES.includes(normalized)) return 'Date';

  // Pascal case
  return normalized
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_');
}

/**
 * Validate row against schema
 */
function validateRow(row, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = row[field];

    // Required check
    if (rules.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }

    // Type check
    if (value && rules.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push(`${field} must be a number`);
        continue;
      }

      // Range check
      if (rules.range) {
        const [min, max] = rules.range.split(' to ').map(parseFloat);
        if (num < min || num > max) {
          errors.push(`${field} must be between ${min} and ${max}`);
        }
      }
    }

    // Allowed values check
    if (value && rules.allowedValues) {
      if (!rules.allowedValues.includes(value)) {
        errors.push(`${field} must be one of: ${rules.allowedValues.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Error Messages

**User-Friendly Error Display:**
```javascript
// Error structure
{
  file: 'volumes.csv',
  errors: [
    { row: 3, field: 'Volume', message: 'Must be a number' },
    { row: 5, field: 'Time', message: 'Invalid time format (use HH:MM)' },
    { row: 12, field: 'Volume', message: 'Must be between 0 and 1000000' }
  ]
}

// Display
<ValidationErrors>
  <h3>Found 3 errors in volumes.csv:</h3>
  <ul>
    <li>Row 3: Volume - Must be a number</li>
    <li>Row 5: Time - Invalid time format (use HH:MM)</li>
    <li>Row 12: Volume - Must be between 0 and 1000000</li>
  </ul>
  <button>Download corrected template</button>
</ValidationErrors>
```

---

## CSV Export Formats

### Results Export (`results.csv`)

**Interval-by-interval staffing:**
```csv
Date,Time,Channel,Skill,Volume,AHT,Traffic_Erlangs,Agents_Required,Service_Level,Occupancy,FTE_With_Shrinkage
2025-01-15,09:00,Voice,Sales,120,420,2.8,5,0.85,0.87,6.67
2025-01-15,09:30,Voice,Sales,145,420,3.4,6,0.82,0.88,8.00
```

### Summary Export (`summary.csv`)

**Daily totals:**
```csv
Date,Channel,Skill,Total_Volume,Avg_AHT,Peak_Agents,Avg_Service_Level,Total_FTE
2025-01-15,Voice,Sales,2400,420,15,0.83,120.5
```

### Cost Export (`costs.csv`)

**Cost breakdown:**
```csv
Date,Channel,Skill,FTE,Hours,Cost_Per_Hour,Labor_Cost,Overhead,Technology,Total_Cost
2025-01-15,Voice,Sales,120.5,964,25.00,24100,7230,2000,33330
```

---

## Template Files

Provide downloadable templates with:
- Proper headers
- Sample data (2-3 rows)
- Comments explaining format
- Common mistakes to avoid

**Example template with comments:**
```csv
# Volume Data Template
# Date: YYYY-MM-DD format
# Time: HH:MM in 24-hour format
# Volume: Integer number of contacts
Date,Time,Channel,Skill,Volume
2025-01-15,09:00,Voice,Sales,120
2025-01-15,09:30,Voice,Sales,145
```

---

## Advanced Features

### Multi-File Import
Support importing related files together:
```javascript
{
  volumes: 'volumes.csv',
  aht: 'aht.csv',
  sla: 'sla.csv',
  shrinkage: 'shrinkage.csv'
}
```

### Auto-Detection
Detect file type from content:
```javascript
function detectFileType(headers) {
  if (headers.includes('Volume') && headers.includes('Time')) {
    return 'volumes';
  }
  if (headers.includes('AHT')) {
    return 'aht';
  }
  if (headers.includes('Target_Percent')) {
    return 'sla';
  }
  // ...
}
```

### Data Transformation
Support common transformations:
- Convert minutes to seconds
- Convert percentages (0-100 to 0-1)
- Parse "80/20" notation
- Fill missing optional columns with defaults

---

## Best Practices

### For Users
1. **Use consistent date formats** throughout file
2. **Include headers** in first row
3. **No empty rows** between data
4. **Save as CSV (UTF-8)** to avoid encoding issues
5. **Test with small sample** before full import

### For Implementation
1. **Provide clear error messages** with row numbers
2. **Support common variations** in column naming
3. **Validate early** before processing
4. **Show preview** before final import
5. **Allow download of corrected templates**

---

**Key Principle:** Be flexible with input formats, strict with validation, and clear with error messages.

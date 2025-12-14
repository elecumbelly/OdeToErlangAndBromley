# CSV Import Formats

**OdeToErlangAndBromley CSV Import Specification**

This document describes all supported CSV import formats and provides examples for importing data from various ACD (Automatic Call Distribution) systems and custom sources.

---

## Table of Contents

1. [Universal CSV Importer](#universal-csv-importer)
2. [Column Mapping](#column-mapping)
3. [Data Format Requirements](#data-format-requirements)
4. [Example CSV Files](#example-csv-files)
5. [ACD-Specific Exports](#acd-specific-exports)
6. [Troubleshooting](#troubleshooting)

---

## Universal CSV Importer

### Overview

OdeToErlangAndBromley's **SmartCSVImport** component accepts **any CSV format** from any source. You simply upload your file and map your columns to our expected fields.

### How It Works

1. **Upload CSV file** (any column names, any order)
2. **Auto-detection** attempts to match your columns
3. **Manual mapping** via dropdown selectors (adjust as needed)
4. **Preview** first 5 rows to verify data looks correct
5. **Import** all rows for processing
6. **Apply** to calculator inputs

### Supported File Formats

- **CSV** (`.csv`) - Comma-separated values
- **Encoding:** UTF-8, Latin-1, Windows-1252
- **Delimiters:** Comma, semicolon (auto-detected by PapaParse)
- **Line endings:** Windows (CRLF), Unix (LF), Mac (CR)
- **Headers:** First row must contain column names

---

## Column Mapping

### Required Fields

These fields **must** be mapped for import to succeed:

| Field | Description | Expected Data Type | Example Values |
|-------|-------------|-------------------|----------------|
| **Date** | Date of the interval | YYYY-MM-DD | 2025-01-20 |
| **Call Volume** | Total incoming calls/contacts in interval | Integer | 100, 1523, 45 |
| **Average Handle Time (AHT)** | Talk time + after-call work | Seconds or HH:MM:SS | 240, 00:04:00, 4:12 |

### Optional Fields

These fields enhance accuracy but are not required:

| Field | Description | Expected Data Type | Example Values |
|-------|-------------|-------------------|----------------|
| **Answered Calls** | Calls answered by agents | Integer | 95, 1420, 42 |
| **Answer Rate %** | Percentage of calls answered | Percentage (0-100) | 91.5, 95%, 88.2 |
| **Abandoned Calls** | Calls abandoned before answer | Integer | 5, 103, 3 |
| **Service Level %** | Achieved service level | Percentage (0-100) | 81.2, 92%, 76.5 |
| **Average Speed of Answer (ASA)** | Mean wait time | Seconds or HH:MM:SS | 18, 00:00:25, 0:32 |
| **Waiting Time** | Average queue wait time | Seconds or HH:MM:SS | 15, 00:00:22, 0:28 |
| **SL Threshold** | Service level threshold in seconds | Integer (seconds) | 20, 30, 60 |

### Auto-Detection Keywords

The importer looks for these keywords (case-insensitive) to auto-map columns:

**Call Volume:**
- "incoming", "volume", "calls", "contacts", "offered", "presented", "received"

**Answered Calls:**
- "answered", "handled", "connected", "accepted"

**AHT:**
- "aht", "handle time", "talk time", "talk duration", "duration", "avg handle"

**Answer Rate:**
- "answer rate", "answered %", "answer %", "service rate"

**Abandoned:**
- "abandoned", "lost", "dropped", "not answered"

**Service Level:**
- "service level", "sl %", "sla", "service %", "within sl"

**ASA:**
- "asa", "answer speed", "avg speed", "speed of answer", "average wait"

**Waiting Time:**
- "wait", "waiting time", "queue time", "hold time"

**Threshold:**
- "threshold", "target seconds", "sl threshold", "sla seconds"

---

## Data Format Requirements

### Time Formats

Time values can be provided in any of these formats:

**1. Seconds (Integer)**
```
240
180
65
```

**2. HH:MM:SS (Hours:Minutes:Seconds)**
```
00:04:00
00:03:00
00:01:05
```

**3. MM:SS (Minutes:Seconds)**
```
4:00
3:00
1:05
```

**4. Decimal Seconds**
```
240.5
180.25
65.8
```

**Auto-Conversion:** All time formats are automatically converted to seconds internally.

### Percentage Formats

Percentages can be provided with or without the `%` symbol:

**With % Symbol:**
```
91.5%
82%
95.2%
```

**Without % Symbol:**
```
91.5
82
95.2
```

**Note:** Both formats are interpreted as percentages (not decimals). 91.5 means 91.5%, not 9150%.

### Numeric Formats

**Integers:**
```
100
1523
42
```

**Decimals:**
```
100.5
1523.75
42.2
```

**Commas (Thousands Separator):**
```
1,523
10,245
125,650
```

**Note:** Commas are removed during parsing.

### Empty Values

- **Empty cells** are treated as `0`
- **Entire empty rows** are filtered out
- **Partial empty rows** are processed (missing values default to `0`)

---

## Example CSV Files

### Example 1: Simple Volume and AHT

**Minimal required data:**

```csv
Date,Time,Incoming Calls,Talk Duration
2025-01-20,09:00,120,00:04:15
2025-01-20,09:30,145,00:04:30
2025-01-20,10:00,132,00:04:20
2025-01-20,10:30,118,00:04:10
```

**Mapping:**
- "Incoming Calls" → Call Volume
- "Talk Duration" → AHT

### Example 2: Full ACD Export

**Complete dataset with all metrics:**

```csv
Date,Time,Incoming Calls,Answered Calls,Abandoned Calls,Answer Rate,AHT,ASA,Service Level,SL Threshold
2025-01-20,09:00,1000,910,90,91.0%,00:04:00,00:00:18,81.2%,20
2025-01-20,09:30,1250,1150,100,92.0%,00:04:15,00:00:22,85.5%,20
2025-01-20,10:00,1180,1090,90,92.4%,00:04:10,00:00:19,83.8%,20
```

**Mapping:**
- "Incoming Calls" → Call Volume
- "Answered Calls" → Answered Calls
- "Abandoned Calls" → Abandoned Calls
- "Answer Rate" → Answer Rate %
- "AHT" → Average Handle Time
- "ASA" → Average Speed of Answer
- "Service Level" → Service Level %
- "SL Threshold" → SL Threshold

### Example 3: Avaya CMS Export

**Typical Avaya CMS format:**

```csv
Date,Interval,ACD Calls,Calls Handled,Calls Aband,% Answered,Avg Talk Time,Avg Speed Ans,Service Level,Target Seconds
01/20/2025,09:00-09:30,1000,910,90,91.00,240,18,81.20,20
01/20/2025,09:30-10:00,1250,1150,100,92.00,255,22,85.50,20
```

**Mapping:**
- "ACD Calls" → Call Volume
- "Calls Handled" → Answered Calls
- "Calls Aband" → Abandoned Calls
- "% Answered" → Answer Rate %
- "Avg Talk Time" → Average Handle Time
- "Avg Speed Ans" → Average Speed of Answer
- "Service Level" → Service Level %
- "Target Seconds" → SL Threshold

### Example 4: Genesys Export

**Typical Genesys Cloud format:**

```csv
Timestamp,QueueName,ContactsOffered,ContactsAnswered,ContactsAbandoned,ServiceLevelPct,AverageHandleTime,AverageTalkTime,AverageSpeedOfAnswer
2025-01-20T09:00:00Z,Sales,1000,910,90,81.2,240,220,18
2025-01-20T09:30:00Z,Sales,1250,1150,100,85.5,255,235,22
```

**Mapping:**
- "ContactsOffered" → Call Volume
- "ContactsAnswered" → Answered Calls
- "ContactsAbandoned" → Abandoned Calls
- "ServiceLevelPct" → Service Level %
- "AverageHandleTime" → Average Handle Time
- "AverageSpeedOfAnswer" → Average Speed of Answer

### Example 5: Five9 Export

**Typical Five9 format:**

```csv
Date,Time,Calls Inbound,Calls Handled,Calls Abandoned,Answer Rate %,Avg Handle Time (sec),Avg Wait Time (sec),Service Level %
01/20/2025,9:00 AM,1000,910,90,91.0,240,18,81.2
01/20/2025,9:30 AM,1250,1150,100,92.0,255,22,85.5
```

**Mapping:**
- "Calls Inbound" → Call Volume
- "Calls Handled" → Answered Calls
- "Calls Abandoned" → Abandoned Calls
- "Answer Rate %" → Answer Rate %
- "Avg Handle Time (sec)" → Average Handle Time
- "Avg Wait Time (sec)" → Average Speed of Answer
- "Service Level %" → Service Level %

### Example 6: NICE inContact Export

**Typical NICE inContact format:**

```csv
StartDate,StartTime,ContactsQueued,ContactsHandled,ContactsAbandoned,PercentHandled,AvgHandleTime,AvgSpeedAnswer,ServiceLevel
2025-01-20,09:00:00,1000,910,90,91.00%,00:04:00,00:00:18,81.20%
2025-01-20,09:30:00,1250,1150,100,92.00%,00:04:15,00:00:22,85.50%
```

**Mapping:**
- "ContactsQueued" → Call Volume
- "ContactsHandled" → Answered Calls
- "ContactsAbandoned" → Abandoned Calls
- "PercentHandled" → Answer Rate %
- "AvgHandleTime" → Average Handle Time
- "AvgSpeedAnswer" → Average Speed of Answer
- "ServiceLevel" → Service Level %

---

## ACD-Specific Exports

### How to Export from Common ACD Systems

#### Avaya CMS
1. Navigate to **Historical Reports** → **ACD Call Summary**
2. Select date range and interval (15, 30, or 60 minutes)
3. Include columns:
   - ACD Calls, Calls Handled, Calls Abandoned
   - % Answered, Avg Talk Time, Avg Speed Ans, Service Level
4. Export to CSV

#### Genesys Cloud
1. Go to **Analytics** → **Performance** → **Queue Performance**
2. Set interval (15, 30, or 60 minutes)
3. Add metrics:
   - Contacts Offered, Answered, Abandoned
   - Service Level %, AHT, ASA
4. Export → Download CSV

#### Five9
1. **Reporting** → **Real-Time/Historical Reports**
2. Select **Queue Statistics** report
3. Configure intervals and metrics
4. Export → CSV

#### NICE inContact
1. **Analytics** → **Historical Reports**
2. Choose **Queue Detail** or **Skill Summary**
3. Select date range and interval
4. Export to CSV

#### Cisco UCCX
1. **Tools** → **Historical Reports** → **Contact Service Queue Activity**
2. Set reporting period and interval
3. Export to CSV

### Custom Exports

If your ACD system isn't listed, export any report that includes:
- **Time intervals** (date/time stamps)
- **Call volume** (offered, incoming, presented)
- **Handle time** (talk time, AHT, duration)

The SmartCSVImport will auto-detect or allow you to manually map columns.

---

## Troubleshooting

### Common Import Issues

#### Issue: "File must have at least a header row and one data row"

**Cause:** CSV file is empty or only contains headers.

**Solution:**
- Verify file has data rows
- Check if export completed successfully
- Ensure intervals actually have call volume

#### Issue: "Required fields not mapped: Call Volume, Average Handle Time"

**Cause:** Required fields were not mapped to CSV columns.

**Solution:**
- Manually select columns from dropdowns
- Ensure CSV has volume and AHT data
- Check column names match expected patterns

#### Issue: "Imported data shows zero or very small values"

**Cause:** Time format may be misinterpreted (e.g., 4:00 interpreted as 4 seconds instead of 4 minutes).

**Solution:**
- Verify time format in source CSV
- Convert to seconds before exporting (e.g., 4 minutes = 240 seconds)
- Use HH:MM:SS format for clarity (00:04:00)

#### Issue: "Percentages showing as decimals (e.g., 0.91 instead of 91%)"

**Cause:** Source CSV uses decimal format (0-1 range) instead of percentage (0-100 range).

**Solution:**
- Multiply values by 100 in CSV before importing
- Or manually adjust after import

#### Issue: "Preview shows data but import fails"

**Cause:** Data validation error (e.g., negative values, non-numeric data in numeric fields).

**Solution:**
- Check browser console for error details
- Verify all numeric columns contain valid numbers
- Remove special characters (except : for time, % for percentages)

### Data Quality Checks

Before importing, verify:

✅ **Headers are descriptive** (not generic like "Column1", "Column2")
✅ **No merged cells** (flatten any merged cells in Excel)
✅ **Consistent formats** (all times in same format, all percentages same style)
✅ **No summary rows** (remove totals, averages, footers)
✅ **Correct encoding** (UTF-8 preferred, avoid special characters)
✅ **Proper delimiters** (comma or semicolon, not tab or pipe)

### Performance Tips

- **Large files (>10,000 rows):** Import may take 5-10 seconds, be patient
- **Preview shows first 5 rows only:** Full import processes all rows
- **Browser memory:** Files >50 MB may cause browser slowdown
- **Recommended:** Split very large files into smaller batches (e.g., weekly imports instead of annual)

---

## Validation After Import

### Verify Imported Data

After successful import, check the summary:

```
✓ Data Imported Successfully!

Intervals: 48
Total Volume: 52,450
Avg AHT: 245s
Avg SL: 83.2%
```

**Sanity Checks:**
- **Intervals:** Should match expected count (48 intervals = 1 day at 30-min intervals)
- **Total Volume:** Sum of all intervals (verify against ACD totals)
- **Avg AHT:** Weighted average should be realistic (typically 180-600 seconds for voice)
- **Avg SL:** Should be in reasonable range (60-95%)

### Apply to Calculator

Click **"Apply to Calculator"** button to:
- Calculate aggregated volume
- Compute weighted average AHT
- Update calculator inputs with imported data

**Note:** Currently, import populates summary statistics only. Future versions will allow interval-by-interval staffing calculations.

---

## API for Developers

### Programmatic CSV Import

For developers building integrations, the SmartCSVImport component can be used programmatically:

```typescript
import SmartCSVImport from './components/SmartCSVImport';

// The component handles:
// 1. File upload via <input type="file">
// 2. Papa.parse() CSV parsing
// 3. Auto-detection of column mappings
// 4. Manual mapping via dropdowns
// 5. Data validation and transformation
// 6. Output to importedData state

// Access imported data:
const [importedData, setImportedData] = useState<any[]>([]);

// Each row contains:
{
  volume: number,         // Required
  aht: number,           // Required (in seconds)
  answered: number,      // Optional
  answerRate: number,    // Optional (percentage)
  abandoned: number,     // Optional
  serviceLevel: number,  // Optional (percentage)
  asa: number,          // Optional (in seconds)
  waitingTime: number,  // Optional (in seconds)
  threshold: number     // Optional (in seconds)
}
```

### CSV Generation for Export

To generate CSV files compatible with OdeToErlangAndBromley:

```javascript
import Papa from 'papaparse';

const data = [
  { volume: 1000, aht: 240, serviceLevel: 81.2 },
  { volume: 1250, aht: 255, serviceLevel: 85.5 },
];

const csv = Papa.unparse(data, {
  header: true,
  columns: ['volume', 'aht', 'serviceLevel']
});

// Download CSV
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'export.csv';
link.click();
```

---

## Future Enhancements

Planned improvements to CSV import:

- [ ] **Multi-file import** - Merge multiple CSVs
- [ ] **Interval-level calculations** - Staffing requirements per interval
- [ ] **Date/time parsing** - Automatic interval detection
- [ ] **Skill/channel separation** - Multi-channel CSV imports
- [ ] **Validation rules** - Configurable data quality checks
- [ ] **Template library** - Pre-built mappings for popular ACD systems
- [ ] **Drag-and-drop upload** - Enhanced upload UX
- [ ] **Import history** - Save previous imports and mappings

---

## Support

### Getting Help

- **GitHub Issues:** [Report CSV import bugs](https://github.com/elecumbelly/OdeToErlangAndBromley/issues)
- **Discussions:** [Ask questions about CSV formats](https://github.com/elecumbelly/OdeToErlangAndBromley/discussions)
- **Documentation:** [Main README](../README.md)

### Contributing

Have an ACD system not listed? Contribute an example CSV format!

1. Export sample data from your ACD system
2. Anonymize/sanitize data (remove customer info)
3. Submit pull request with example in this document

---

**Last Updated:** 2025-01-23
**Version:** 0.1.0
**Maintained by:** OdeToErlangAndBromley Project

For questions about CSV import, please open an issue with:
- Screenshot of your CSV columns
- Example data (first 3 rows)
- Error message (if any)

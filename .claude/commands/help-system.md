# Help & Training System Specifications

Load this context when building help UI features, tooltips, tutorials, or glossary components.

---

## Design Philosophy

- **Every field has contextual help** - No user should be confused
- **Progressive disclosure** - Simple tooltips first, detailed docs on demand
- **Educational mode** - Show formulas and calculations for learning
- **Accessible** - Keyboard navigation, screen reader support

---

## Contextual Help Features

### 1. Hover Tooltips

**Structure:**
```javascript
{
  field: "Service Level Target",
  shortHelp: "% of contacts answered within threshold time",
  example: "80/20 means 80% answered in 20 seconds",
  typical: "Voice: 80/20, Email: 90/24hrs, Chat: 85/60sec",
  formula: "SL = 1 - P(wait > threshold)"
}
```

**Categories:**
- **Input Fields:** What this field controls
- **Calculations:** How this value is calculated
- **Results:** What this output means
- **Terminology:** Contact center jargon explained
- **Best Practices:** Industry standards

**Implementation:**
- Hover-over popovers for desktop
- Tap/long-press for mobile
- Info (i) icons next to technical terms
- "What's this?" links for complex concepts

---

### 2. Interactive Glossary

**Access Methods:**
- Global search/help button
- Sidebar glossary panel
- Inline term links (click highlighted terms)

**Entry Structure:**
```markdown
**Service Level (SL)**
- Definition: The percentage of contacts answered within a target time
- Example: "80/20" means 80% of contacts answered in 20 seconds
- Common Targets:
  - Voice: 80/20, 90/30
  - Email: 90% in 24 hours
  - Chat: 85% in 60 seconds
- Related Terms: ASA, Threshold, Queue Time
- Formula: SL = (Contacts answered within threshold) / (Total contacts)
```

**Key Terms to Include:**
- Erlang B, C, A, X (with history and use cases)
- Service Level, ASA, AHT, ACW
- Occupancy, Utilization, Shrinkage
- Traffic Intensity, Erlangs
- Abandonment, Patience, Retrial
- FTE, Interval, Concurrency
- Multi-skill, Blending, Routing

---

### 3. Educational Mode

**Toggle-able "Show Me How It Works" mode:**
- Displays formulas next to results
- Shows calculation steps in expandable sections
- Highlights which inputs affect which outputs
- Provides mathematical notation
- Links to academic papers

**Example Display:**
```
FTE Required: 58.5

[Show Calculation Steps ▼]
  1. Traffic Intensity: A = (Volume × AHT) / Interval
     A = (1000 × 240) / 1800 = 133.33 Erlangs

  2. Erlang C Service Level Calculation:
     Using Erlang C formula with A=133.33, target SL=80/20
     Minimum agents = 145

  3. Apply Shrinkage:
     Total FTE = 145 / (1 - 0.25) = 193.33

  [View Full Formula] [Why This Matters] [Common Issues]
```

---

### 4. Interactive Tutorials

**First-Time User Onboarding:**
- "Quick Start" tutorial (5 minutes)
- Guided tour of interface
- Sample scenario walkthrough
- CSV import demonstration

**Tutorial Topics:**
1. "Your First Staffing Calculation" (Erlang C basics)
2. "Importing Historical Data via CSV"
3. "Understanding Service Level Targets"
4. "Multi-Channel Planning"
5. "Comparing Erlang C vs. A vs. X"
6. "What-If Scenarios"
7. "Exporting Reports for Management"

**Implementation:**
- Step-by-step overlay highlights
- Progress indicator (Step 3 of 7)
- Skippable but replayable
- Context-sensitive help offers

**Libraries to Consider:**
- Intro.js
- Shepherd.js
- Driver.js

---

### 5. Example Scenarios Library

**Scenario 1: Small Voice Queue**
```json
{
  "name": "Tech Support Hotline",
  "description": "Small team handling technical support calls",
  "inputs": {
    "volume": 500,
    "volumePeriod": "day",
    "aht": 360,
    "target": "80/20",
    "shrinkage": 0.25
  },
  "expectedResult": "8-10 FTE",
  "learningObjective": "Basic Erlang C calculation"
}
```

**Scenario 2: Multi-Channel Contact Center**
```json
{
  "name": "E-commerce Customer Service",
  "channels": [
    {"channel": "Voice", "volume": 1000, "aht": 240, "target": "80/20"},
    {"channel": "Chat", "volume": 500, "aht": 180, "target": "85/60"},
    {"channel": "Email", "volume": 300, "aht": 300, "target": "90/24hrs"}
  ],
  "multiSkill": 0.60,
  "learningObjective": "Multi-channel and blended agent planning"
}
```

**Scenario 3: High-Volume Sales Center**
```json
{
  "name": "Inbound Sales Campaign",
  "volume": 5000,
  "volumePeriod": "day",
  "aht": 480,
  "target": "90/30",
  "abandonment": 0.15,
  "compareFormulas": true,
  "learningObjective": "Comparing Erlang C vs A vs X accuracy"
}
```

**Each Scenario Includes:**
- Problem description
- Pre-filled inputs
- Expected results
- Learning objectives
- "Try changing X to see Y effect"

---

### 6. Inline Help Text

**Patterns:**
- Placeholder text with examples: `"e.g., 80 for 80% in 80/20"`
- Teaching validation messages: `"Shrinkage typically ranges from 20-35%. Your value of 5% seems low - did you mean 25%?"`
- Range indicators: `"Occupancy: 85% (typical range: 80-90% for voice)"`
- Warning badges: `⚠️ High abandonment rate may indicate understaffing`

---

## Help System UI Components

### 1. Help Icon (?) in Top Navigation
- Opens help sidebar or modal
- Quick access to glossary and tutorials

### 2. Info Icons (ⓘ) Next to Fields
- Hover for tooltip
- Click for detailed help

### 3. "Need Help?" Floating Button
- Always accessible in bottom-right corner
- Context-aware suggestions

### 4. Search-Powered Help
- "Ask a question..." search bar
- Searches glossary, tutorials, FAQ

### 5. Tooltips with Rich Content
- Not just text - include diagrams, formulas, examples
- "Learn More" links to detailed docs

---

## Content File Structure

```
src/
  content/
    help/
      glossary.json          # All term definitions
      tooltips.json          # Field-level help text
      tutorials/
        quick-start.json
        csv-import.json
        multi-channel.json
      scenarios/
        small-voice.json
        multi-channel.json
        high-volume.json
      faq.md
```

---

## Accessibility Requirements

- **Keyboard Navigation:** All help features accessible via keyboard
- **Screen Readers:** Proper ARIA labels on info icons and tooltips
- **High Contrast:** Help text readable in all themes
- **Focus Management:** Trap focus in modals, return focus when closed
- **Multi-Language Ready:** Content structure supports i18n
- **Print-Friendly:** Help content can be printed/exported

---

## Success Metrics

Track help system effectiveness:
- % of users completing tutorial
- Most-accessed help topics
- Field abandonment rates (users give up)
- Time to first successful calculation
- Support ticket reduction

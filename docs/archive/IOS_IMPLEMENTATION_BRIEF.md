# OdeToErlang iOS Implementation Brief
**Super Prompt for Claude Code - iOS Development**

---

## 🎯 Mission

Build a native iOS application (SwiftUI + Swift) for **OdeToErlang**, a professional-grade contact centre capacity planning calculator. You'll be porting an existing, fully-functional web application (React/TypeScript) to iOS, maintaining mathematical accuracy whilst creating an exceptional native mobile experience.

---

## 📋 Project Overview

### What is OdeToErlang?

OdeToErlang is a comprehensive contact centre capacity planning calculator named in tribute to **A.K. Erlang** and the queuing theory formulas that power workforce management. It calculates staffing requirements using mathematically correct implementations of:

- **Erlang C** (infinite patience model - baseline)
- **Erlang A** (with customer abandonment - improved accuracy)
- **Erlang X** (with retrials - most accurate, professional-grade)

### Core Purpose

Help contact centre managers answer: **"How many agents do I need to meet my service level targets?"**

Input: Call volume, average handle time (AHT), service level target (e.g., 80% in 20 seconds)
Output: Required agents, total FTE (with shrinkage), occupancy, costs, gap analysis vs actual staff

---

## 🏗️ Current Implementation (Web)

### Technology Stack
- **Frontend:** React 18 + TypeScript
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Build:** Vite
- **Architecture:** 100% client-side (no backend)

### Repository Structure
```
OdeToErlang/
├── odetoerlang/src/
│   ├── components/          # React UI components
│   ├── lib/
│   │   ├── calculations/    # Erlang formulas (CRITICAL - port these!)
│   │   │   ├── erlangC.ts
│   │   │   ├── erlangA.ts
│   │   │   ├── erlangX.ts
│   │   ├── parsers/         # CSV parsing
│   │   └── utils/
│   ├── store/
│   │   └── calculatorStore.ts  # Zustand state management
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── App.tsx              # Main app component
├── docs/
│   ├── FORMULAS.md          # Mathematical reference (READ THIS FIRST!)
│   ├── CSV-FORMATS.md       # Data import formats
│   └── CONTRIBUTING.md
├── README.md                # User-facing documentation
└── CLAUDE.md                # AI assistant guide with domain knowledge
```

### Key Files to Study

1. **`docs/FORMULAS.md`** - Mathematical formulas with academic references
2. **`src/lib/calculations/erlangC.ts`** - Core Erlang C implementation
3. **`src/lib/calculations/erlangA.ts`** - Erlang A with abandonment
4. **`src/lib/calculations/erlangX.ts`** - Most accurate model
5. **`src/types/index.ts`** - Data structures and interfaces
6. **`src/store/calculatorStore.ts`** - State management patterns
7. **`CLAUDE.md`** - Contact centre domain knowledge and conventions

---

## 🔢 Mathematical Core (Must Port Accurately!)

### Erlang C Formula Implementation

**Key Algorithm (from `erlangC.ts`):**

```typescript
// Traffic intensity (Erlangs)
function calculateTrafficIntensity(
  volume: number,
  aht: number,
  intervalSeconds: number
): number {
  return (volume * aht) / intervalSeconds;
}

// Erlang C - Probability of waiting (using iterative method to avoid factorial overflow)
function erlangC(agents: number, trafficIntensity: number): number {
  if (agents <= trafficIntensity) return 1.0; // Unstable queue

  let inverseProbability = 1.0;
  for (let k = 1; k < agents; k++) {
    inverseProbability = 1 + (k / trafficIntensity) * inverseProbability;
  }

  const pwait = 1 / (1 + (1 - trafficIntensity / agents) * inverseProbability);
  return pwait;
}

// Service level calculation
function serviceLevel(
  agents: number,
  trafficIntensity: number,
  aht: number,
  targetSeconds: number
): number {
  const pwait = erlangC(agents, trafficIntensity);
  const probExceedsThreshold = pwait * Math.exp(-(agents - trafficIntensity) * (targetSeconds / aht));
  return 1 - probExceedsThreshold;
}

// Agent solver - find minimum agents to meet target SL
function solveAgents(
  trafficIntensity: number,
  aht: number,
  targetSL: number,
  thresholdSeconds: number
): number {
  let agents = Math.ceil(trafficIntensity);
  const maxAgents = Math.ceil(trafficIntensity * 3);

  while (agents < maxAgents) {
    const sl = serviceLevel(agents, trafficIntensity, aht, thresholdSeconds);
    if (sl >= targetSL) return agents;
    agents++;
  }

  return maxAgents; // Cannot achieve target
}
```

**Critical Implementation Notes:**
1. **Never use factorial(n)** - causes overflow. Use iterative method shown above.
2. **Check for unstable queues** - when agents < trafficIntensity, queue grows infinitely.
3. **Units matter** - keep time in seconds consistently.
4. **Precision** - use Double for calculations, round only for display.

### Erlang A (With Abandonment)

```typescript
// θ (theta) = Average Patience Time / AHT
// This is the "patience ratio" - how long customers wait relative to service time
function calculateErlangA(
  agents: number,
  trafficIntensity: number,
  theta: number // patience parameter
): AbandonmentMetrics {
  // Implementation uses numerical approximation
  // See docs/FORMULAS.md for full mathematical details
  // Returns: abandonment rate, adjusted service level, expected abandonments
}
```

**Notation Standard:**
- We use θ = AveragePatienceTime / AHT (dimensionless ratio)
- Academic literature sometimes uses θ = 1 / AveragePatienceTime (abandonment rate)
- Our choice aligns with commercial WFM tools (NICE, Verint, Aspect)
- See `docs/FORMULAS.md` "Notation Standards" section

### Erlang X (Most Accurate - Professional Grade)

```typescript
// Models customer retrials and virtual waiting time
// Most computationally intensive but most accurate (±2% vs ±10-15% for Erlang C)
function calculateErlangX(
  agents: number,
  trafficIntensity: number,
  theta: number,
  retrialProbability: number
): ErlangXMetrics {
  // Iterative equilibrium solver
  // See docs/FORMULAS.md for algorithm details
}
```

---

## 📊 Data Models

### Core Input Interface

```typescript
interface CalculationInputs {
  volume: number;              // Contacts per interval (e.g., 100 calls)
  aht: number;                 // Average Handle Time in seconds (e.g., 240 = 4 min)
  intervalMinutes: number;     // Planning interval (e.g., 30 minutes)
  targetSLPercent: number;     // Service Level target % (e.g., 80 for 80%)
  thresholdSeconds: number;    // SL threshold in seconds (e.g., 20 for 80/20)
  shrinkagePercent: number;    // Shrinkage % (breaks, training, etc.) (e.g., 25)
  maxOccupancy: number;        // Max occupancy % (e.g., 90)
  model: 'erlangC' | 'erlangA' | 'erlangX';  // Formula selection
  averagePatience?: number;    // For Erlang A/X (seconds customers wait before abandoning)
}
```

### Core Output Interface

```typescript
interface CalculationResults {
  trafficIntensity: number;    // Erlangs (A)
  requiredAgents: number;      // Productive agents needed
  totalFTE: number;            // Total FTE including shrinkage
  achievedSL: number;          // Actual service level achieved (0-1)
  occupancy: number;           // Agent occupancy (0-1)
  asa: number;                 // Average Speed of Answer (seconds)

  // Cost metrics
  hourlyAgentCost?: number;
  totalCost?: number;

  // Advanced (Erlang A/X only)
  abandonmentRate?: number;
  expectedAbandonments?: number;
  answeredContacts?: number;
  retrialProbability?: number;  // Erlang X only
  virtualTraffic?: number;      // Erlang X only
}
```

### Actual Staff (Comparison Feature)

```typescript
interface ActualStaff {
  totalFTE: number;            // Staff on books
  productiveAgents: number;    // After shrinkage
  useAsConstraint: boolean;    // Future: constrain calculations to actual staff
}
```

---

## 🎨 UI/UX Requirements for iOS

### Screen Structure

#### 1. Calculator Screen (Primary)
**Layout: 3-column on iPad, stacked on iPhone**

**Panel 1: Actual Staff** (Green accent)
- Total FTE on Books (number input)
- Productive Agents Available (number input)
- Calculated Shrinkage % (derived, read-only)
- "Use as constraint" toggle (for future feature)
- Quick Actions: Clear All button

**Panel 2: Input Parameters** (Blue accent)
- Model selector (segmented control: Erlang C / A / X)
- Volume (number input with keyboard)
- Average Handle Time (seconds, with minute converter)
- Interval (picker: 15 / 30 / 60 minutes)
- Service Level Target (% and seconds - "80/20" format)
- Shrinkage % (slider + number input)
- Max Occupancy % (slider + number input)
- Average Patience (seconds - only show for Erlang A/X)

**Panel 3: Results** (Purple accent)
- Required vs Actual comparison (if actual staff entered)
  - Gap analysis with colour coding (green = over, red = under)
- Traffic Intensity (Erlangs)
- Required Agents
- Total FTE (with shrinkage breakdown)
- Achieved Service Level (% and visual gauge)
- Occupancy (% and visual gauge)
- ASA (Average Speed of Answer)
- Abandonment metrics (if Erlang A/X)

#### 2. Charts Tab
- Service Level Curve (agents vs SL achieved)
- Cost vs Service Level trade-off
- Occupancy by staffing level
- Interactive - tap to see values

#### 3. Multi-Channel Tab
- Configure multiple channels (Voice, Chat, Email, Video, Social)
- Different AHT per channel
- Blended agents (handle multiple channels)
- Concurrency settings

#### 4. Scenarios Tab
- Save/load "what-if" scenarios
- Compare side-by-side (2-4 scenarios)
- Named scenarios with descriptions

#### 5. Model Comparison Tab
- Run Erlang C, A, and X simultaneously
- Show differences in required agents
- Highlight accuracy improvements
- Educational explanations

#### 6. Import/Export Tab
- CSV import (volume data, AHT, configurations)
- Share results (PDF report, CSV export, image snapshot)
- iCloud sync for scenarios (optional)

#### 7. Learn Tab (Educational Mode)
- Glossary (searchable)
- Formula explanations with LaTeX rendering
- Interactive tutorials (first-time user onboarding)
- Example scenarios with guided walkthroughs

### Design Principles

1. **Professional, Not Consumer**
   - Aimed at workforce management professionals
   - Information density is acceptable (not overly simplified)
   - Precision over simplicity (show decimals, exact values)

2. **Instant Feedback**
   - Calculations update in real-time as inputs change
   - No "Calculate" button needed (auto-recalc on change)
   - Smooth animations for value changes

3. **Educational Context**
   - Tooltips/help on every field (tap ⓘ icon)
   - Link technical terms to glossary
   - "Show calculation steps" mode (expandable)

4. **Offline-First**
   - All calculations client-side
   - No internet required for core functionality
   - Optional iCloud sync for scenarios

5. **Accessibility**
   - VoiceOver support for all inputs/outputs
   - Dynamic Type support
   - High contrast mode compatibility

### Colour Scheme

**Primary Palette (from web version):**
- Primary Blue: `#2563EB` (links, actions, Input panel accent)
- Green: `#10B981` (Actual Staff panel, positive gaps)
- Red: `#EF4444` (negative gaps, errors)
- Purple: `#8B5CF6` (Results panel accent)
- Grey scale: `#111827` (text) to `#F9FAFB` (backgrounds)

**Semantic Colours:**
- Success: Green
- Warning: Amber `#F59E0B`
- Error: Red
- Info: Blue

---

## 🔧 iOS Technical Architecture

### Recommended Stack

**UI Framework:**
- SwiftUI (iOS 16+ minimum for best features)

**State Management:**
- `@Observable` macro (iOS 17+) or `ObservableObject` (iOS 16)
- Single source of truth pattern (similar to Zustand store)

**Calculations:**
- Pure Swift functions (port from TypeScript)
- Consider Swift Numerics for precision
- Background queue for Erlang X (computationally intensive)

**Data Persistence:**
- UserDefaults for last-used inputs
- SwiftData or Core Data for saved scenarios
- Optional: CloudKit for iCloud sync

**Charts:**
- Swift Charts framework (native, beautiful)

**CSV Import/Export:**
- Foundation's `String` CSV parsing or TabularData framework
- Share sheet for export

**Testing:**
- XCTest for calculation accuracy
- UI tests for critical flows
- **CRITICAL:** Validate against published Erlang tables

### Recommended Project Structure

```
OdeToErlangIOS/
├── OdeToErlangIOS/
│   ├── App/
│   │   └── OdeToErlangApp.swift
│   ├── Models/
│   │   ├── CalculationInputs.swift
│   │   ├── CalculationResults.swift
│   │   ├── ActualStaff.swift
│   │   └── Scenario.swift
│   ├── ViewModels/
│   │   ├── CalculatorViewModel.swift
│   │   ├── ChartsViewModel.swift
│   │   └── ScenariosViewModel.swift
│   ├── Views/
│   │   ├── Calculator/
│   │   │   ├── CalculatorView.swift
│   │   │   ├── ActualStaffPanel.swift
│   │   │   ├── InputPanel.swift
│   │   │   └── ResultsPanel.swift
│   │   ├── Charts/
│   │   ├── MultiChannel/
│   │   ├── Scenarios/
│   │   ├── ModelComparison/
│   │   ├── ImportExport/
│   │   └── Learn/
│   ├── Calculations/
│   │   ├── ErlangC.swift          // PORT FROM erlangC.ts
│   │   ├── ErlangA.swift          // PORT FROM erlangA.ts
│   │   ├── ErlangX.swift          // PORT FROM erlangX.ts
│   │   └── CalculationHelpers.swift
│   ├── Utilities/
│   │   ├── CSVParser.swift
│   │   ├── NumberFormatters.swift
│   │   └── Constants.swift
│   └── Resources/
│       ├── Glossary.json
│       ├── Tutorials.json
│       └── Localizable.strings
└── OdeToErlangIOSTests/
    ├── ErlangCTests.swift         // Validate against known results
    ├── ErlangATests.swift
    └── ErlangXTests.swift
```

### State Management Pattern

```swift
@Observable
class CalculatorViewModel {
    // Inputs
    var inputs = CalculationInputs.default
    var actualStaff = ActualStaff()

    // Outputs
    var results: CalculationResults?
    var abandonmentMetrics: AbandonmentMetrics?

    // Auto-calculate on input change
    func updateInput<T>(_ keyPath: WritableKeyPath<CalculationInputs, T>, value: T) {
        inputs[keyPath: keyPath] = value
        calculate()
    }

    func calculate() {
        // Dispatch to appropriate model
        switch inputs.model {
        case .erlangC:
            results = ErlangC.calculate(inputs: inputs)
        case .erlangA:
            let (results, abandonment) = ErlangA.calculate(inputs: inputs)
            self.results = results
            self.abandonmentMetrics = abandonment
        case .erlangX:
            // Run on background queue (more intensive)
            Task {
                let (results, abandonment) = await ErlangX.calculate(inputs: inputs)
                await MainActor.run {
                    self.results = results
                    self.abandonmentMetrics = abandonment
                }
            }
        }
    }
}
```

---

## ✅ Validation Requirements

### Mathematical Accuracy Tests

**You MUST validate your Swift implementations against published Erlang C tables.**

Example test cases:

```swift
func testErlangC_10Erlangs_80in20() {
    // Known result: ~13-14 agents required
    let inputs = CalculationInputs(
        volume: 100,
        aht: 180,
        intervalMinutes: 30,
        targetSLPercent: 80,
        thresholdSeconds: 20,
        model: .erlangC
    )
    let results = ErlangC.calculate(inputs: inputs)
    XCTAssertEqual(results.requiredAgents, 13, accuracy: 1)
}

func testErlangC_50Erlangs_90in30() {
    // Known result: ~58 agents required
    let inputs = CalculationInputs(
        volume: 500,
        aht: 240,
        intervalMinutes: 30,
        targetSLPercent: 90,
        thresholdSeconds: 30,
        model: .erlangC
    )
    let results = ErlangC.calculate(inputs: inputs)
    XCTAssertEqual(results.requiredAgents, 58, accuracy: 1)
}
```

**Cross-reference with:**
- Published Erlang C tables (Google "Erlang C table")
- Web version results (run same inputs)
- Commercial WFM tools (NICE, Verint, Aspect) if available

### Edge Cases to Handle

```swift
// Zero volume
inputs.volume = 0
// Expected: 0 agents required

// Impossible SLA (99.9% in 5 seconds with low agents)
inputs.targetSLPercent = 99.9
inputs.thresholdSeconds = 5
// Expected: High agent count or "cannot achieve" message

// 100% shrinkage
inputs.shrinkagePercent = 100
// Expected: Error or infinite FTE warning

// AHT = 0
inputs.aht = 0
// Expected: Handle division by zero gracefully
```

---

## 📚 Domain Knowledge: Contact Centre Operations

### Key Terminology

**Service Level (SL):**
- Format: "80/20" means 80% of contacts answered within 20 seconds
- Industry standards:
  - Voice: 80/20 or 90/30
  - Email: 90% in 24 hours
  - Chat: 85% in 60 seconds

**Average Handle Time (AHT):**
- Mean duration of a contact (talk time + after-call work)
- Typically 3-6 minutes for voice, shorter for digital channels

**Shrinkage:**
- % of paid time not available for handling contacts
- Includes: breaks, lunch, training, meetings, absenteeism
- Typical: 20-35%

**Occupancy:**
- % of time agents spend handling contacts vs idle
- Typical target: 85-90% for voice
- Can exceed 100% for concurrent channels (chat, email)

**Traffic Intensity (Erlangs):**
- Formula: (Call Volume × AHT) / Interval Length
- Dimensionless unit representing system load
- Named after A.K. Erlang

**FTE (Full-Time Equivalent):**
- Standard unit of staffing (1 FTE = full-time schedule, e.g., 40 hrs/week)

### The Three Erlang Models

**Erlang C (1917 - Classical):**
- Assumes: Infinite patience (customers never abandon)
- Accuracy: Overestimates service level (optimistic)
- Use case: Baseline, widely understood, quick calculation
- Error: ±10-15% vs reality

**Erlang A (2004):**
- Assumes: Customer abandonment with exponential patience
- Accuracy: Much improved (accounts for abandonments)
- Use case: Modern contact centres, better than C
- Error: ±5% vs reality

**Erlang X (2012+):**
- Assumes: Realistic abandonment + customer retrials
- Accuracy: Professional-grade (most accurate)
- Use case: Enterprise WFM tools, critical planning
- Error: ±2% vs reality
- Trade-off: More computationally intensive

**User Choice:**
Allow users to select which model to use. Different organisations have different standards, and some need to match legacy tools that use Erlang C.

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (MVP)
1. **Port Erlang C calculations** to Swift (with tests!)
2. Build basic Calculator screen (Input + Results only)
3. Implement real-time recalculation
4. Add number formatters (percentages, FTE decimals, time)
5. Basic persistence (last-used inputs)

**Success Criteria:**
- Erlang C calculations match web version exactly
- Can enter inputs and see results instantly
- App launches and doesn't crash

### Phase 2: Enhanced Calculator
1. **Port Erlang A calculations** to Swift
2. Add Actual Staff panel
3. Add gap analysis (required vs actual)
4. Model selector (C / A)
5. Tooltip/help system (tap ⓘ icons)
6. Input validation and error messages

**Success Criteria:**
- Erlang A calculations validated
- Actual vs Required comparison working
- Help system usable

### Phase 3: Visualisation
1. **Port Erlang X calculations** to Swift
2. Implement Charts tab (Swift Charts)
   - Service level curve
   - Cost trade-off
   - Occupancy by staffing
3. Interactive chart behaviours (tap to see values)

**Success Criteria:**
- All three models working and validated
- Charts render correctly and update with calculations

### Phase 4: Advanced Features
1. Multi-Channel configuration
2. Scenario save/load/compare
3. Model Comparison side-by-side
4. CSV import/export
5. Share functionality (PDF report, image snapshot)

**Success Criteria:**
- Can configure multiple channels
- Scenarios persist and reload
- Can export results

### Phase 5: Educational & Polish
1. Learn tab with glossary
2. Interactive tutorials (first-time user onboarding)
3. "Show calculation steps" educational mode
4. Localization (UK English initially)
5. Accessibility audit and improvements
6. iPad optimisation (3-column layout)
7. Performance optimisation (Erlang X on background queue)

**Success Criteria:**
- Passes accessibility audit
- Tutorials complete successfully for new users
- Performs smoothly on older devices

---

## 📖 Critical References

### Documentation to Read FIRST

1. **`docs/FORMULAS.md`** in this repository
   - Mathematical formulas with full derivations
   - Notation standards (critical for theta parameter)
   - Validation approach
   - Academic references

2. **`CLAUDE.md`** in this repository
   - Contact centre domain knowledge
   - Development conventions
   - Code quality standards
   - UK English spelling requirements

3. **`src/lib/calculations/erlangC.ts`**
   - Reference implementation to port
   - Iterative method (avoids factorial overflow)
   - Agent solver algorithm

4. **`src/types/index.ts`**
   - Data structure definitions
   - Port these to Swift structs

### Academic Papers (Optional Deep Dive)

**Erlang C:**
- Erlang, A.K. (1917) - "Solution of some Problems in the Theory of Probabilities of Significance in Automatic Telephone Exchanges"

**Erlang A:**
- Garnett, Mandelbaum & Reiman (2002) - "Designing a Call Centre with Impatient Customers"

**Erlang X:**
- Janssen, Koole & Pot (2011) - "Erlang Loss Models with Delayed Feedback"

### Online Resources

- Erlang C calculators (for validation): Google "Erlang C calculator"
- Published Erlang C tables (for unit tests)
- Contact centre workforce management best practices

---

## 🎯 Success Criteria

### Your iOS app is successful when:

1. **Mathematical Accuracy:**
   ✅ Erlang C results match published tables (±1 agent)
   ✅ Erlang A calculations validated against web version
   ✅ Erlang X produces professional-grade accuracy
   ✅ All edge cases handled gracefully

2. **User Experience:**
   ✅ Calculations update instantly as inputs change (<100ms)
   ✅ UI is intuitive for WFM professionals
   ✅ Help/tooltips make it accessible to newcomers
   ✅ Offline-first (works without internet)

3. **Feature Parity:**
   ✅ All three Erlang models implemented (C, A, X)
   ✅ Actual vs Required comparison working
   ✅ Charts visualise trade-offs
   ✅ Scenarios can be saved and compared
   ✅ CSV import/export functional

4. **Polish:**
   ✅ Passes accessibility audit (VoiceOver, Dynamic Type)
   ✅ Looks professional on iPhone and iPad
   ✅ No crashes, smooth performance
   ✅ Educational mode teaches users

5. **Testing:**
   ✅ Unit tests validate all calculations
   ✅ UI tests cover critical flows
   ✅ Tested on physical devices (not just Simulator)

---

## 🇬🇧 UK English Spelling

**IMPORTANT:** Use British English spelling throughout:

- "Centre" not "Center" (Contact Centre)
- "Optimise" not "Optimize"
- "Colour" not "Color"
- "Behaviour" not "Behavior"
- "Honour" not "Honor"
- "Programme" not "Program" (but "programming" is acceptable)

UI text, comments, and variable names should use UK spelling.

---

## 💡 Tips for Success

### Do's ✅

1. **Start with Erlang C only** - Get one model perfect before adding A and X
2. **Write tests FIRST** - Validate against known results before building UI
3. **Port, don't rewrite** - The TypeScript implementations are proven correct
4. **Use Double precision** - Financial and FTE calculations need accuracy
5. **Comment formulas** - Include mathematical notation in comments
6. **Handle edge cases** - Zero volume, impossible SLAs, 100% shrinkage
7. **Real-time calc** - Update results as inputs change (no Calculate button)
8. **Preserve user intent** - If they type "80" for SL, don't auto-change to 0.8
9. **Show decimals** - FTE to 2 decimals (58.34), percentages to 1 (85.5%)
10. **Educational context** - Every field should have help text

### Don'ts ❌

1. **Don't use factorial(n)** - Causes overflow, use iterative method
2. **Don't round prematurely** - Calculate with full precision, round only for display
3. **Don't oversimplify UI** - This is a professional tool, information density is OK
4. **Don't skip validation** - Test against published Erlang tables
5. **Don't hardcode assumptions** - Everything should be user-configurable
6. **Don't ignore units** - Time in seconds consistently
7. **Don't block main thread** - Erlang X calculations on background queue
8. **Don't skip accessibility** - VoiceOver must work
9. **Don't use US spelling** - British English only (centre, not center)
10. **Don't add features not in web version** - Port first, innovate later

---

## 🤝 Collaboration with Web Version

### Maintaining Parity

- **Calculations must match exactly** - Same inputs = same outputs
- **Feature set should align** - Users may switch between web and iOS
- **Data interchange** - CSV export from web, import to iOS (and vice versa)
- **Terminology consistency** - Use same terms (Erlangs, FTE, SL, ASA)

### Where iOS Can Innovate

- **Native gestures** - Swipe between scenarios, pinch-to-zoom charts
- **Widgets** - Home screen widget with quick calculation
- **Siri integration** - "Calculate staffing for 100 calls" (future)
- **Apple Pencil** - Annotate charts on iPad (future)
- **iCloud sync** - Sync scenarios across devices

---

## 📞 Questions to Ask

If you need clarification, here are good questions to ask the user:

1. **iOS Version Support:** "Should we target iOS 16+ (wider compatibility) or iOS 17+ (newer features like @Observable)?"

2. **iPad Layout:** "For iPad, should we use a 3-column side-by-side layout, or a master-detail split view?"

3. **Monetisation:** "Is this a free app, paid app, or freemium (Erlang C free, A/X paid)?"

4. **Branding:** "Do you have logo assets, or should I design a simple icon?"

5. **Distribution:** "App Store release, TestFlight beta, or internal enterprise deployment?"

6. **Analytics:** "Should we add usage analytics (which features are used, calculation frequency)?"

7. **Localisation:** "UK English initially - add other languages later (US English, Spanish, French)?"

---

## 🏁 Getting Started

### Your First Steps:

1. **Read `docs/FORMULAS.md`** - Understand the mathematics
2. **Study `src/lib/calculations/erlangC.ts`** - See reference implementation
3. **Create Xcode project** - SwiftUI app, iOS 16+ deployment target
4. **Port Erlang C to Swift** - Start with `calculateTrafficIntensity()` function
5. **Write unit tests** - Validate against published Erlang tables
6. **Build basic UI** - Input panel + Results panel
7. **Connect ViewModel** - Wire inputs to calculations
8. **Test on device** - Make sure it feels responsive

### Success Looks Like:

After your first session, you should have:
- ✅ Xcode project created
- ✅ Erlang C calculations ported and tested
- ✅ Basic Calculator screen showing inputs and results
- ✅ Real-time recalculation working
- ✅ No crashes, smooth performance

**Then build from there, one feature at a time.**

---

## 📝 Final Notes

This is a **professional-grade tool** for workforce management professionals. Accuracy and reliability are paramount. The existing web implementation has proven, validated calculations - your job is to bring that same quality to iOS with a native mobile experience.

**Prioritise:**
1. Mathematical correctness (test, test, test!)
2. Smooth, responsive UI (real-time calculations)
3. Educational context (help text, tooltips, tutorials)
4. Professional appearance (not consumer-app flashy)

**You're not just porting an app - you're bringing queuing theory to the pockets of contact centre managers worldwide. Make Erlang proud! 📞📊**

---

**Good luck, and may your calculations always converge! 🚀**

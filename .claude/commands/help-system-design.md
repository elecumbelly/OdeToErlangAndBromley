# Help System & Training Design

**Auto-loaded when:** Working on UI/UX for help features, tooltips, glossary, tutorials, educational mode

---

## Help System Philosophy

**Goals:**
1. **Accessible:** Help available exactly when needed
2. **Layered:** Quick tooltips → Detailed docs → Interactive tutorials
3. **Discoverable:** Easy to find help features
4. **Educational:** Teach WFM concepts, not just tool usage
5. **Non-Intrusive:** Available but not annoying

---

## 1. Contextual Tooltips

### Purpose
Instant help for every field and term without leaving the page

### Implementation

**Tooltip Component:**
```jsx
// src/components/help/Tooltip.jsx
export function Tooltip({
  field,           // Field identifier (e.g., "service_level")
  children,        // Element to attach tooltip to
  placement = 'top'
}) {
  const content = getTooltipContent(field);

  return (
    <div className="tooltip-wrapper">
      {children}
      <HoverPopover placement={placement}>
        <TooltipContent {...content} />
      </HoverPopover>
    </div>
  );
}

// Usage
<Tooltip field="service_level">
  <label>Service Level Target</label>
</Tooltip>
```

### Tooltip Content Structure
```javascript
// src/content/tooltips.json
{
  "service_level": {
    "title": "Service Level Target",
    "description": "Percentage of contacts answered within threshold time",
    "example": "80/20 means 80% answered in 20 seconds",
    "typical": {
      "Voice": "80/20 or 90/30",
      "Chat": "85/60",
      "Email": "90% in 24 hours"
    },
    "formula": "SL = (Answered within threshold) / (Total offered)",
    "learnMore": "/glossary#service-level"
  },
  "shrinkage": {
    "title": "Shrinkage",
    "description": "Percentage of paid time when agents aren't available for contacts",
    "example": "25% shrinkage means 75% productive time",
    "typical": "20-35% (25% is common)",
    "breakdown": [
      "Breaks: 8-10%",
      "Lunch: 4-5%",
      "Training: 2-5%",
      "Meetings: 3-5%",
      "Absenteeism: 3-5%"
    ],
    "formula": "Total FTE = Productive FTE / (1 - Shrinkage%)",
    "learnMore": "/glossary#shrinkage"
  }
}
```

### Tooltip Design
```jsx
<TooltipPopover>
  <TooltipHeader>
    <h4>Service Level Target</h4>
    <InfoIcon />
  </TooltipHeader>

  <TooltipBody>
    <p>Percentage of contacts answered within threshold time</p>

    <Example>
      80/20 means 80% answered in 20 seconds
    </Example>

    <TypicalValues>
      <strong>Typical targets:</strong>
      <ul>
        <li>Voice: 80/20 or 90/30</li>
        <li>Chat: 85/60</li>
        <li>Email: 90% in 24 hours</li>
      </ul>
    </TypicalValues>

    <FormulaBox>
      SL = (Answered within threshold) / (Total offered)
    </FormulaBox>
  </TooltipBody>

  <TooltipFooter>
    <a href="/glossary#service-level">Learn more →</a>
  </TooltipFooter>
</TooltipPopover>
```

### Tooltip Interaction
- **Desktop:** Hover to show, auto-hide after 5s unless hovered
- **Mobile:** Tap info icon to show, tap outside to hide
- **Keyboard:** Focus + Space to toggle
- **ARIA:** `aria-describedby` for screen readers

---

## 2. Interactive Glossary

### Purpose
Searchable reference for all WFM terminology

### Glossary Component
```jsx
// src/components/help/Glossary.jsx
export function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);

  return (
    <GlossarySidebar>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search terms..."
      />

      <TermList>
        {filteredTerms.map(term => (
          <TermItem
            key={term.id}
            term={term}
            onClick={() => setSelectedTerm(term)}
            active={selectedTerm?.id === term.id}
          />
        ))}
      </TermList>

      {selectedTerm && (
        <TermDetail term={selectedTerm} />
      )}
    </GlossarySidebar>
  );
}
```

### Glossary Content Structure
```javascript
// src/content/glossary.json
[
  {
    "id": "service-level",
    "term": "Service Level",
    "acronym": "SL",
    "definition": "The percentage of contacts answered within a target time threshold",
    "longDescription": "Service level is the primary metric...",
    "formula": "SL = (Contacts answered within threshold) / (Total offered contacts)",
    "example": {
      "scenario": "Contact center receives 1000 calls, 850 answered in 20s",
      "calculation": "SL = 850 / 1000 = 85%",
      "interpretation": "Achieved 85/20 service level"
    },
    "typicalValues": {
      "Voice": "80/20, 90/30",
      "Chat": "85/60",
      "Email": "90% in 24 hours"
    },
    "relatedTerms": ["ASA", "Threshold", "Abandonment", "Erlang C"],
    "industryStandards": "80/20 is most common for voice channels",
    "commonMistakes": [
      "Confusing service level with ASA (different metrics)",
      "Setting unrealistic targets (99/5) without understanding cost",
      "Ignoring abandonment in calculations (Erlang C limitation)"
    ],
    "category": "Metrics",
    "tags": ["core", "performance", "kpi"]
  },
  {
    "id": "erlang-c",
    "term": "Erlang C",
    "definition": "Mathematical formula for calculating staffing needs assuming infinite customer patience",
    "longDescription": "Developed in 1917 by A.K. Erlang...",
    "formula": "P(wait > t) = P(wait > 0) × e^(-(c-A)×t/AHT)",
    "whenToUse": "Basic staffing calculations, widely understood baseline",
    "limitations": [
      "Assumes customers never abandon (overestimates service level)",
      "Assumes exponential distributions",
      "Doesn't model retrials"
    ],
    "alternatives": ["Erlang A", "Erlang X"],
    "accuracy": "±10-15% compared to reality (due to abandonment)",
    "relatedTerms": ["Erlang A", "Erlang X", "Traffic Intensity", "Service Level"],
    "category": "Formulas",
    "tags": ["calculation", "staffing", "queuing-theory"]
  }
]
```

### Glossary Features

**Search:**
- Search term names
- Search definitions
- Search acronyms
- Search tags

**Filtering:**
- By category (Metrics, Formulas, Concepts)
- By tag (core, advanced, deprecated)
- Favorites/bookmarks

**Cross-Linking:**
- Click related terms to navigate
- Highlight mentions in definitions
- "See also" suggestions

---

## 3. Interactive Tutorials

### Purpose
Step-by-step guided walkthroughs for common tasks

### Tutorial System
```jsx
// src/components/help/Tutorial.jsx
export function Tutorial({ tutorialId }) {
  const tutorial = getTutorial(tutorialId);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <TutorialOverlay>
      <TutorialProgress current={currentStep} total={tutorial.steps.length} />

      <TutorialStep>
        <Spotlight target={tutorial.steps[currentStep].target} />

        <TutorialCard position={tutorial.steps[currentStep].position}>
          <h3>{tutorial.steps[currentStep].title}</h3>
          <p>{tutorial.steps[currentStep].description}</p>

          {tutorial.steps[currentStep].action && (
            <ActionPrompt>
              {tutorial.steps[currentStep].action}
            </ActionPrompt>
          )}

          <TutorialNav>
            <Button onClick={skipTutorial}>Skip</Button>
            <Button onClick={previousStep} disabled={currentStep === 0}>
              Previous
            </Button>
            <Button onClick={nextStep} primary>
              {currentStep === tutorial.steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </TutorialNav>
        </TutorialCard>
      </TutorialStep>
    </TutorialOverlay>
  );
}
```

### Tutorial Configuration
```javascript
// src/content/tutorials/quick-start.json
{
  "id": "quick-start",
  "title": "Quick Start: Your First Staffing Calculation",
  "description": "Learn the basics in 5 minutes",
  "estimatedTime": "5 minutes",
  "difficulty": "Beginner",
  "steps": [
    {
      "id": "welcome",
      "title": "Welcome to OdeToErlang",
      "description": "This tutorial will guide you through calculating staffing requirements for a contact center",
      "target": null,
      "position": "center"
    },
    {
      "id": "enter-volume",
      "title": "Enter Contact Volume",
      "description": "Let's start with a simple example. Enter 1000 in the volume field",
      "target": "#volume-input",
      "position": "bottom",
      "action": "Type 1000 in the highlighted field",
      "validation": "input#volume-input:value(1000)"
    },
    {
      "id": "enter-aht",
      "title": "Set Average Handle Time",
      "description": "AHT is the average time spent on each contact. Enter 240 seconds (4 minutes)",
      "target": "#aht-input",
      "position": "bottom",
      "action": "Enter 240",
      "validation": "input#aht-input:value(240)"
    },
    {
      "id": "set-service-level",
      "title": "Choose Service Level Target",
      "description": "80/20 means 80% of contacts answered in 20 seconds. This is the industry standard",
      "target": "#service-level-config",
      "position": "right",
      "action": "Leave at default 80/20",
      "highlight": ["#sl-percent", "#sl-threshold"]
    },
    {
      "id": "view-results",
      "title": "See Your Results",
      "description": "OdeToErlang calculated you need approximately 6-7 agents to meet your target",
      "target": "#results-panel",
      "position": "left",
      "highlight": ["#agents-required", "#service-level-achieved"]
    },
    {
      "id": "understand-shrinkage",
      "title": "Understanding Shrinkage",
      "description": "Notice the FTE (Full-Time Equivalent) is higher than agents needed. This accounts for breaks, training, etc.",
      "target": "#shrinkage-breakdown",
      "position": "right",
      "action": "Click to expand shrinkage details",
      "learnMore": "/glossary#shrinkage"
    },
    {
      "id": "complete",
      "title": "Tutorial Complete!",
      "description": "You've learned the basics. Try changing values to see how results update in real-time",
      "target": null,
      "position": "center",
      "nextSteps": [
        "Try the CSV Import tutorial",
        "Explore Multi-Channel Planning",
        "Compare Erlang formulas"
      ]
    }
  ]
}
```

### Tutorial Types

**1. Quick Start (5 min)**
- First staffing calculation
- Basic concepts (volume, AHT, service level)
- See results

**2. CSV Import (7 min)**
- Download template
- Fill with sample data
- Upload and validate
- View imported calculations

**3. Multi-Channel Planning (10 min)**
- Configure multiple channels
- Set channel-specific AHT and SLAs
- Understand blended vs. dedicated agents
- Compare staffing strategies

**4. Comparing Erlang Formulas (8 min)**
- Calculate with Erlang C
- Add abandonment (Erlang A)
- See accuracy differences
- Understand when to use each

**5. Advanced: Multi-Skill Routing (15 min)**
- Define multiple skills
- Set skill proficiency levels
- Configure overlap
- Optimize skill mix

### Tutorial Features

**Progress Tracking:**
```javascript
{
  userId: 'local-storage-id',
  completedTutorials: ['quick-start', 'csv-import'],
  inProgress: {
    tutorialId: 'multi-channel',
    currentStep: 3
  }
}
```

**Validation:**
- Wait for user action before advancing
- Validate correct input
- Provide hints if stuck

**Skippable:**
- Skip entire tutorial
- Skip to specific step
- Resume later

---

## 4. Educational Mode

### Purpose
Show calculation steps and formulas for learning

### Educational Mode Toggle
```jsx
// In configuration panel
<EducationalModeSwitch>
  <Switch
    checked={educationalMode}
    onChange={setEducationalMode}
  />
  <label>Show Me How It Works</label>
  <Tooltip field="educational_mode">
    <InfoIcon />
  </Tooltip>
</EducationalModeSwitch>
```

### Calculation Steps Display
```jsx
// When educational mode enabled
<CalculationSteps>
  <StepCard number={1} title="Calculate Traffic Intensity">
    <Formula>
      A = (Volume × AHT) / Interval
    </Formula>
    <Calculation>
      A = (1000 × 240) / 1800 = 133.33 Erlangs
    </Calculation>
    <Explanation>
      Traffic intensity (measured in Erlangs) represents the workload.
      133.33 Erlangs means you need at least 134 agents to avoid queue instability.
    </Explanation>
  </StepCard>

  <StepCard number={2} title="Apply Erlang C Formula">
    <Formula>
      P(wait > 0) = Erlang C(A, c)
    </Formula>
    <IterativeProcess>
      Testing with c = 140 agents: P(wait) = 0.42
      Testing with c = 145 agents: P(wait) = 0.28
      Testing with c = 150 agents: P(wait) = 0.18
    </IterativeProcess>
    <Button onClick={() => showFullFormula()}>
      View Full Erlang C Formula
    </Button>
  </StepCard>

  <StepCard number={3} title="Calculate Service Level">
    <Formula>
      SL = 1 - P(wait > threshold)
    </Formula>
    <Calculation>
      SL = 1 - (P(wait > 0) × e^(-(145-133.33)×(20/240)))
      SL = 1 - (0.28 × 0.32) = 0.91 = 91%
    </Calculation>
    <Result success>
      ✓ 145 agents achieves 91% service level (exceeds 80% target)
    </Result>
  </StepCard>

  <StepCard number={4} title="Apply Shrinkage">
    <Formula>
      Total FTE = Agents / (1 - Shrinkage%)
    </Formula>
    <Calculation>
      Total FTE = 145 / (1 - 0.25) = 193.33 FTE
    </Calculation>
    <ShrinkageBreakdown>
      <h4>Shrinkage Breakdown (25% total):</h4>
      <ul>
        <li>Breaks: 8.33%</li>
        <li>Lunch: 4.17%</li>
        <li>Training: 5.00%</li>
        <li>Meetings: 3.00%</li>
        <li>Absenteeism: 4.50%</li>
      </ul>
    </ShrinkageBreakdown>
  </StepCard>
</CalculationSteps>
```

### Formula Viewer
```jsx
<FormulaModal formula="erlang-c">
  <MathNotation>
    P_wait = [Σ(A^n / n!) for n=0 to c-1 + (A^c / c!) × (1 / (1 - A/c))]^(-1)
  </MathNotation>

  <PlainEnglish>
    The Erlang C formula calculates the probability that a customer
    must wait for an agent. It uses traffic intensity (A) and
    number of agents (c) to determine queue probability.
  </PlainEnglish>

  <Assumptions>
    <h4>This formula assumes:</h4>
    <ul>
      <li>Customers wait indefinitely (never abandon)</li>
      <li>Poisson arrival process (random arrivals)</li>
      <li>Exponential service times</li>
      <li>All agents have equal skill</li>
    </ul>
  </Assumptions>

  <Limitations>
    <WarningBox>
      Because Erlang C assumes infinite patience, it typically
      overestimates service level by 10-15%. Consider using
      Erlang A or Erlang X for more accurate results.
    </WarningBox>
  </Limitations>

  <AcademicReference>
    <p>
      <strong>Source:</strong> Erlang, A.K. (1917).
      "Solution of some Problems in the Theory of Probabilities."
    </p>
    <a href="https://link-to-paper">Read original paper →</a>
  </AcademicReference>
</FormulaModal>
```

---

## 5. Example Scenarios Library

### Purpose
Pre-configured realistic examples users can explore

### Scenario Selector
```jsx
<ScenarioLibrary>
  <h2>Example Scenarios</h2>
  <p>Load a pre-configured scenario to see OdeToErlang in action</p>

  <ScenarioGrid>
    <ScenarioCard
      scenario={scenarios.smallVoiceQueue}
      onLoad={loadScenario}
    />
    <ScenarioCard
      scenario={scenarios.multiChannel}
      onLoad={loadScenario}
    />
    <ScenarioCard
      scenario={scenarios.highVolumeSales}
      onLoad={loadScenario}
    />
  </ScenarioGrid>
</ScenarioLibrary>
```

### Scenario Structure
```javascript
// src/content/scenarios/small-voice-queue.json
{
  "id": "small-voice-queue",
  "name": "Small Tech Support Hotline",
  "description": "A small technical support team handling ~500 calls per day",
  "difficulty": "Beginner",
  "learningObjectives": [
    "Understand basic Erlang C calculations",
    "See impact of shrinkage on staffing",
    "Learn typical voice channel metrics"
  ],
  "data": {
    "volume": 500,
    "interval": 1440, // Full day
    "aht": 360, // 6 minutes
    "channel": "Voice",
    "skill": "Technical Support"
  },
  "assumptions": {
    "serviceLevelTarget": 0.80,
    "serviceLevelThreshold": 20,
    "shrinkage": 0.25,
    "occupancy": 0.85,
    "formulaType": "ErlangC"
  },
  "expectedResults": {
    "trafficIntensity": 1.25,
    "agentsRequired": "8-10",
    "fteWithShrinkage": "10-13",
    "serviceLevelAchieved": "~80-85%"
  },
  "explorationPrompts": [
    "Try increasing AHT to 480 seconds - how many more agents needed?",
    "Change service level target to 90/30 - what's the impact?",
    "Reduce shrinkage to 20% - how much does FTE decrease?"
  ]
}
```

### Scenario Categories

**Beginner:**
- Small voice queue
- Simple single-channel calculation
- Basic shrinkage

**Intermediate:**
- Multi-channel contact center
- Multiple skills
- Different SLA targets per channel

**Advanced:**
- High-volume operation
- Complex multi-skill routing
- Erlang formula comparison
- Cost optimization

---

## 6. Help System UI Components

### Global Help Button
```jsx
<HelpButton position="bottom-right" floating>
  <HelpIcon />
  <HelpMenu>
    <MenuItem onClick={openQuickStart}>Quick Start Tutorial</MenuItem>
    <MenuItem onClick={openGlossary}>Glossary</MenuItem>
    <MenuItem onClick={openExamples}>Example Scenarios</MenuItem>
    <MenuItem onClick={toggleEducationalMode}>
      {educationalMode ? '✓' : ''} Educational Mode
    </MenuItem>
    <Divider />
    <MenuItem onClick={openUserGuide}>User Guide</MenuItem>
    <MenuItem onClick={openFAQ}>FAQ</MenuItem>
  </HelpMenu>
</HelpButton>
```

### Searchable Help
```jsx
<HelpSearch>
  <SearchInput
    placeholder="Ask a question..."
    onChange={handleSearch}
  />
  <SearchResults>
    {results.glossaryTerms.length > 0 && (
      <ResultSection title="Glossary Terms">
        {results.glossaryTerms.map(term => (
          <GlossaryResult key={term.id} term={term} />
        ))}
      </ResultSection>
    )}
    {results.tutorials.length > 0 && (
      <ResultSection title="Tutorials">
        {results.tutorials.map(tutorial => (
          <TutorialResult key={tutorial.id} tutorial={tutorial} />
        ))}
      </ResultSection>
    )}
    {results.faq.length > 0 && (
      <ResultSection title="FAQ">
        {results.faq.map(question => (
          <FAQResult key={question.id} question={question} />
        ))}
      </ResultSection>
    )}
  </SearchResults>
</HelpSearch>
```

---

## Accessibility Considerations

**Keyboard Navigation:**
- Tab through all help elements
- Escape to close modals/tooltips
- Arrow keys in glossary list

**Screen Readers:**
- ARIA labels on all help icons
- Announce tooltip content
- Descriptive link text ("Learn more about Service Level" not "Click here")

**Visual:**
- High contrast tooltips
- Readable font sizes (14px minimum)
- Clear focus indicators

**Multi-Language Ready:**
- All text in JSON files
- i18n structure for future translation

---

## Success Metrics

**Track help system usage:**
- % of users completing tutorials
- Most-accessed glossary terms
- Most-loaded example scenarios
- Educational mode adoption rate
- Help search queries (what are users looking for?)
- Time to first successful calculation (with vs. without tutorial)

**Iterate based on data:**
- Add tooltips for confusing fields
- Create tutorials for common pain points
- Expand glossary for frequently searched terms

---

**Key Principle:** Make help discoverable, layered (quick → detailed), and educational (teach concepts, not just tool usage).

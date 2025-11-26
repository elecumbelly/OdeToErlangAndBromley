# Contact Center & Workforce Management Domain Knowledge

**Auto-loaded when:** Working on WFM concepts, service levels, queuing theory, capacity planning

---

## Core Contact Center Metrics

### Service Level (SL)
**Definition:** The percentage of contacts answered within a target time threshold

**Format:** `X/Y` where:
- X = percentage of contacts
- Y = time threshold in seconds

**Common Targets:**
- **Voice:** 80/20 (80% answered in 20 seconds)
- **Voice (premium):** 90/30 (90% answered in 30 seconds)
- **Chat:** 85/60 (85% answered in 60 seconds)
- **Email:** 90% in 24 hours
- **Social Media:** 90% in 60 minutes

**Formula:**
```
SL = (Contacts answered within threshold) / (Total offered contacts)
```

**Industry Standard:** 80/20 is the most common for voice channels

---

### Average Speed of Answer (ASA)
**Definition:** Mean wait time for answered contacts (excludes abandoned calls)

**Typical Targets:**
- Voice: < 20-30 seconds
- Chat: < 60 seconds
- Email: < 4 hours

**Formula:**
```
ASA = (Total wait time for answered contacts) / (Number of answered contacts)
```

**Note:** ASA can be misleading if abandonment rate is high

---

### Average Handle Time (AHT)
**Definition:** Mean duration of a contact from answer to completion

**Components:**
```
AHT = Talk Time + After-Call Work (ACW)
```

**Typical Values by Channel:**
- **Voice - Sales:** 6-8 minutes (360-480 seconds)
- **Voice - Support:** 4-6 minutes (240-360 seconds)
- **Voice - Collections:** 8-12 minutes (480-720 seconds)
- **Chat:** 3-5 minutes (180-300 seconds)
- **Email:** 5-10 minutes (300-600 seconds)
- **Social Media:** 2-4 minutes (120-240 seconds)

**Important:** Always measure in seconds for calculations

---

### Occupancy
**Definition:** Percentage of time agents spend handling contacts vs. idle

**Formula:**
```
Occupancy = (Time handling contacts) / (Total logged-in time)
```

**Typical Targets:**
- **Voice:** 85-90%
- **Chat:** 90-95% (can exceed 100% with concurrent handling)
- **Email:** 95%+
- **Blended (multi-channel):** 85-90%

**Warning:** Occupancy above 90% for voice can lead to agent burnout

**Relationship to Service Level:**
- Higher occupancy = lower idle time = worse service level
- There's a trade-off: efficiency vs. responsiveness

---

### Shrinkage
**Definition:** Percentage of paid time when agents are NOT available to handle contacts

**Categories:**
```
Total Shrinkage = Breaks + Lunch + Meetings + Training + Absenteeism + Other
```

**Typical Breakdown:**
- **Breaks:** 8-10% (15 min per 4 hours)
- **Lunch:** 4-5% (30-60 min per day)
- **Meetings/Coaching:** 3-5%
- **Training:** 2-5%
- **Absenteeism:** 3-5%
- **System downtime:** 1-2%

**Total Typical Shrinkage:** 20-35% (25% is common baseline)

**Formula:**
```
Productive FTE = Scheduled FTE × (1 - Shrinkage%)

Example:
If you need 100 productive agents and shrinkage is 25%:
Scheduled FTE = 100 / (1 - 0.25) = 133.33 FTE
```

---

### Full-Time Equivalent (FTE)
**Definition:** Standard unit of staffing based on full-time work hours

**Calculation:**
```
1 FTE = Standard work week (typically 40 hours/week or 8 hours/day)

Example:
- 80 hours of work per week = 2 FTE
- 20 hours of work per week = 0.5 FTE
```

**Important Distinctions:**
- **Productive FTE:** Agents actively handling contacts
- **Scheduled FTE:** Total agents scheduled (includes shrinkage)
- **Headcount:** Number of individual people

---

### Traffic Intensity (Erlangs)
**Definition:** Measure of workload intensity on a system

**Formula:**
```
Erlangs (A) = (Call Volume × AHT) / Interval Length

Example:
- Volume: 1000 calls
- AHT: 240 seconds (4 minutes)
- Interval: 1800 seconds (30 minutes)
- Erlangs = (1000 × 240) / 1800 = 133.33 Erlangs
```

**Interpretation:** 133.33 Erlangs means you need at least 134 agents to avoid queue instability

**Named after:** Agner Krarup Erlang (Danish mathematician, 1878-1929)

---

### Abandonment Rate
**Definition:** Percentage of contacts that hang up before being answered

**Formula:**
```
Abandonment Rate = (Abandoned contacts) / (Total offered contacts)
```

**Typical Ranges:**
- **Good:** < 5%
- **Acceptable:** 5-10%
- **Concerning:** 10-20%
- **Critical:** > 20% (indicates severe understaffing)

**Causes of High Abandonment:**
- Insufficient staffing
- Long wait times
- Poor routing
- Inaccurate forecasting

**Customer Patience:**
- Average patience time varies by industry (30s - 3 minutes)
- Modeled in Erlang A and X formulas

---

### Retrial Behavior
**Definition:** When customers call back after abandoning or encountering busy signal

**Typical Patterns:**
- **Retrial Probability:** 30-60% of abandoned customers retry
- **Time to Retry:** 5-15 minutes after abandonment
- **Maximum Retries:** 2-3 attempts before giving up

**Impact on Calculations:**
- Increases actual offered volume
- Modeled in Erlang X (most accurate)
- Can create "overload spiral" if not managed

---

## Multi-Skill Routing

### Skill-Based Routing (SBR)
**Definition:** Distributing contacts to agents based on required skills

**Complexity Levels:**
1. **Single-skill:** One agent type per queue (simplest)
2. **Multi-skill:** Agents have multiple skills, contacts routed to best match
3. **Blended:** Agents handle multiple channels (voice + email + chat)

**Skill Proficiency:**
- **Expert:** 100% efficiency
- **Proficient:** 80-90% efficiency (longer AHT)
- **Trainee:** 50-70% efficiency

**Routing Strategies:**
- **Skills-first:** Route to most skilled available agent
- **Longest-idle:** Route to agent idle longest (fairness)
- **Load-balancing:** Distribute evenly across agents

---

### Multi-Skill Calculations
More complex than single-skill Erlang C:

**Challenges:**
- Skill overlap creates dependencies
- Agents can handle multiple queues
- Priority routing affects service levels

**Approaches:**
1. **Simplified:** Calculate each skill independently, add FTE (overestimates)
2. **Proportional:** Weight by skill demand, apply overlap factor
3. **Simulation:** Monte Carlo simulation of routing logic (most accurate)

**Overlap Factor:**
```
If 60% of agents are multi-skilled:
Total FTE = (Single-skill FTE 1 + Single-skill FTE 2) × 0.7
```

---

## Interval-Based Planning

### Interval Length
**Standard intervals:**
- **15 minutes:** High precision, complex scheduling
- **30 minutes:** Most common (good balance)
- **60 minutes:** Simpler, less accurate

**Intraday Patterns:**
- Morning peak (9-11 AM)
- Lunch dip (12-1 PM)
- Afternoon peak (2-4 PM)
- Evening decline (5-7 PM)

**Day-of-Week Patterns:**
- Monday: Highest volume (weekend backlog)
- Tuesday-Thursday: Steady
- Friday: Lower volume
- Weekend: Varies by industry

---

## Service Level vs. Staffing Trade-Offs

### The Fundamental Trade-Off
```
More agents → Better service level → Higher cost
Fewer agents → Worse service level → Lower cost
```

**Key Insight:** The relationship is NOT linear

**Example:**
- 140 agents: 70% SL, $3,500/hr cost
- 145 agents: 80% SL, $3,625/hr cost (+3.6% cost, +14% SL)
- 150 agents: 90% SL, $3,750/hr cost (+3.4% cost, +13% SL)
- 155 agents: 95% SL, $3,875/hr cost (+3.3% cost, +6% SL)

**Diminishing Returns:** Each additional agent has less impact on SL as you approach 100%

---

## Cost Calculations

### Components
```
Total Cost = Labor Cost + Overhead + Technology

Labor Cost = FTE × Hourly Rate × Hours
Overhead = Facilities, management, HR (typically 20-40% of labor)
Technology = Phone system, CRM, WFM software (amortized per agent)
```

**Typical Hourly Rates (US, 2025):**
- Entry-level: $15-20/hr
- Experienced: $20-30/hr
- Specialized/Technical: $30-50/hr
- Management: $50-100/hr

**Full Loaded Cost:**
```
Base wage + Benefits (30%) + Overhead (30%) + Technology ($500/agent/month)
```

---

## Forecasting Principles

### Forecast Accuracy
**Industry standards:**
- **Excellent:** < 5% error
- **Good:** 5-10% error
- **Acceptable:** 10-20% error
- **Poor:** > 20% error

**Forecasting Methods:**
1. **Moving Average:** Simple, smooths noise
2. **Exponential Smoothing:** Weights recent data more
3. **Regression:** Trend-based
4. **Seasonal Decomposition:** Handles patterns
5. **Machine Learning:** Advanced (ARIMA, neural networks)

---

## Real-Time Management

### Adherence
**Definition:** % of time agents are in scheduled state

**Formula:**
```
Adherence = (Time in correct state) / (Total scheduled time)
```

**Target:** 90%+ adherence

### Conformance
**Definition:** Whether agents worked their scheduled shifts

**Different from Adherence:**
- Adherence: In correct state moment-to-moment
- Conformance: Worked assigned schedule overall

---

## Industry Benchmarks

### Service Level Targets by Industry
- **Retail/E-commerce:** 80/20
- **Financial Services:** 90/30
- **Healthcare:** 85/30
- **Tech Support:** 80/60
- **Emergency Services:** 95/10

### Abandonment Rates
- **Excellent:** < 3%
- **Good:** 3-5%
- **Acceptable:** 5-10%
- **Needs Improvement:** > 10%

### Occupancy Targets
- **Voice:** 85-90%
- **Digital (email/chat):** 90-95%
- **Blended:** 85-90%

---

## Key Assumptions That Must Be Configurable

Users must be able to adjust all of these:

1. **Formula Selection:** Erlang B, C, A, or X
2. **Service Level Targets:** X/Y format (e.g., 80/20)
3. **Shrinkage %:** Breaks, lunch, training, absenteeism
4. **Occupancy Targets:** Typically 85-90% for voice
5. **AHT by Channel/Skill:** In seconds
6. **Arrival Patterns:** Intraday, day-of-week, seasonal
7. **Abandonment Parameters:** Rate, patience time, distribution
8. **Retrial Behavior:** Probability, time to retry, max attempts
9. **Skill Proficiency:** Expert, proficient, trainee multipliers
10. **Multi-skill Overlap:** % of agents with multiple skills
11. **Cost Parameters:** Hourly rates, overhead, technology
12. **Interval Settings:** 15-min, 30-min, or 60-min

---

## Educational Content for Users

### Common Misconceptions

**"More agents always improves service level"**
- True, but with diminishing returns
- Cost increases linearly, SL improvement is logarithmic

**"Occupancy should be 100%"**
- False: 100% occupancy means zero idle time
- Impossible to answer new calls immediately
- Leads to long queues and poor service levels

**"Service level and ASA are the same"**
- False: SL is % answered within threshold
- ASA is average wait time (can be low even with poor SL if some calls wait very long)

**"Erlang C is always accurate"**
- False: Only accurate if customers never abandon
- Erlang A or X are more realistic for modern contact centers

---

## Glossary of Terms

Quick reference for domain-specific terminology:

- **ACW:** After-Call Work (time after contact to complete notes, etc.)
- **AHT:** Average Handle Time (talk time + ACW)
- **ASA:** Average Speed of Answer
- **Erlang:** Unit of traffic intensity; named after A.K. Erlang
- **FTE:** Full-Time Equivalent
- **IVR:** Interactive Voice Response (automated menus)
- **Occupancy:** % of time agents spend handling contacts
- **Queue:** Line of waiting contacts
- **Retrial:** Customer calling back after abandonment
- **SBR:** Skill-Based Routing
- **Service Level:** % answered within threshold (e.g., 80/20)
- **Shrinkage:** % of paid time unavailable for contacts
- **Traffic Intensity:** Volume × AHT / Interval (measured in Erlangs)
- **WFM:** Workforce Management

---

**Remember:** Every organization has unique requirements - allow users to configure ALL assumptions!

# Contact Center Domain Knowledge

Load this context when you need to understand contact center terminology and operations.

---

## Core Concepts

### Service Level (SL)
- **Definition:** % of contacts answered within threshold time
- **Example:** 80/20 = 80% of contacts answered in 20 seconds
- **Common Targets:**
  - Voice: 80/20, 90/30
  - Email: 90% in 24 hours
  - Chat: 85% in 60 seconds
- **Formula:** SL = (Contacts answered within threshold) / (Total contacts)

### Average Speed of Answer (ASA)
- **Definition:** Mean wait time for answered contacts
- **Calculation:** Total wait time / Number of answered contacts
- **Target:** Typically < 30 seconds for voice

### Average Handle Time (AHT)
- **Definition:** Mean duration of a contact
- **Components:** Talk time + Hold time + After-call work (ACW)
- **Typical Values:**
  - Voice: 3-6 minutes (180-360 seconds)
  - Chat: 8-12 minutes
  - Email: 5-10 minutes

### Occupancy
- **Definition:** % of time agents spend handling contacts vs. idle
- **Formula:** (Handle time) / (Handle time + Available time)
- **Targets:**
  - Voice: 85-90%
  - Chat: Can exceed 100% (concurrent sessions)
- **Warning:** >90% leads to burnout

### Shrinkage
- **Definition:** % of paid time not available for handling contacts
- **Components:**
  - Breaks: 8-10%
  - Lunch: 4-6%
  - Training: 3-5%
  - Meetings: 2-4%
  - Absenteeism: 3-5%
  - Other (coaching, system issues): 2-3%
- **Total:** Typically 25-35%

### Full-Time Equivalent (FTE)
- **Definition:** Standard unit of staffing
- **Calculation:** 1 FTE = full-time schedule (typically 40 hours/week)
- **Part-time:** 0.5 FTE = 20 hours/week

### Traffic Intensity (Erlangs)
- **Definition:** Workload measurement
- **Formula:** (Call Volume × AHT) / Interval Length
- **Example:** 100 calls × 300s AHT / 1800s interval = 16.67 Erlangs

### Abandonment Rate
- **Definition:** % of contacts that hang up before being answered
- **Target:** < 5% typically
- **Impact:** High abandonment = understaffing or long wait times

### Patience (Average Time to Abandon)
- **Definition:** Time a customer is willing to wait before abandoning
- **Typical Values:** 60-120 seconds for voice
- **Used in:** Erlang A and X calculations

---

## Multi-Channel Considerations

### Voice
- Real-time, synchronous
- 1 call per agent at a time
- Occupancy max ~90%

### Chat
- Can handle 2-4 concurrent sessions
- Occupancy can exceed 100%
- Different AHT patterns (longer but multitasked)

### Email
- Asynchronous, queue-based
- Response time SLA (hours, not seconds)
- Can batch process

### Social Media
- Public-facing, reputation-sensitive
- Often escalated to voice
- Variable response time expectations

### Video
- Like voice but more resource-intensive
- Growing in support scenarios

---

## Configurable Assumptions

The tool must allow users to adjust:

1. **Formula Selection:** Erlang B, C, A, or X
2. **Service Level Targets:** 80/20, 90/30, custom thresholds
3. **Shrinkage %:** Breaks, lunch, training, meetings, absenteeism
4. **Occupancy Targets:** 85-90% for voice, higher for digital
5. **AHT by Channel/Skill:** Voice, email, chat, social media (in seconds)
6. **Arrival Patterns:** Intraday, day-of-week, seasonal variations
7. **Abandonment Parameters:**
   - Abandonment rate (% of contacts)
   - Average patience time (seconds)
   - Patience distribution (exponential, Weibull, empirical)
8. **Retrial Behavior (for Erlang X):**
   - Retrial probability
   - Time to retrial
   - Maximum retry attempts
9. **Skill Proficiency:** Agent efficiency by skill level
10. **Multi-skill Overlap:** % of agents with multiple skills
11. **Cost Parameters:** Hourly rates, overhead, technology costs
12. **Interval Settings:** 15-min, 30-min, or 60-min intervals

---

## Multi-Channel Complexity

### Blended Agents
- Handle multiple channels (voice + chat + email)
- Skill-based routing
- Priority settings between channels

### Concurrency
- Chat: 2-4 simultaneous sessions
- Email: Batch processing possible
- Voice: 1 call at a time

### Priority Routing
- Voice typically highest priority
- Real-time channels interrupt async work
- Queue management across channels

### Skill-Based Routing
- Agents assigned skills with proficiency levels
- Calls routed to best-matching available agent
- Overflow rules when specialists unavailable

---

## Industry Benchmarks

### Service Levels
| Channel | Target | Threshold |
|---------|--------|-----------|
| Voice (Support) | 80% | 20 seconds |
| Voice (Sales) | 90% | 30 seconds |
| Chat | 85% | 60 seconds |
| Email | 90% | 24 hours |

### Occupancy
| Channel | Target Range |
|---------|--------------|
| Voice | 80-88% |
| Chat | 90-120% |
| Email | 85-95% |

### Shrinkage
| Category | Typical % |
|----------|-----------|
| Breaks | 8-10% |
| Training | 3-5% |
| Meetings | 2-4% |
| Absenteeism | 4-6% |
| **Total** | **25-35%** |

# 📊 OdeToErlangAndBromley

> **The Ultimate Contact Center Capacity Planning Calculator**

A comprehensive, browser-based workforce management tool for calculating staffing requirements in modern contact centers. Named in tribute to **A.K. Erlang** and the mathematical foundations of queuing theory, and **Bromley** - a wonderful place where great ideas happen.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Why OdeToErlangAndBromley?

**Problem:** Contact center managers struggle with complex staffing calculations across multiple channels, skills, and models. Most tools are expensive, inflexible, or require sending sensitive data to third-party servers.

**Solution:** OdeToErlangAndBromley is a 100% browser-based, mathematically correct capacity planning calculator that:
- ✅ Works entirely in your browser (no data leaves your machine)
- ✅ Supports Erlang B, C, and A models (from basic to most accurate)
- ✅ Handles multi-channel environments (voice, chat, email, video, custom)
- ✅ Imports CSV data from any ACD system
- ✅ Provides instant "what-if" scenario analysis
- ✅ Exports professional reports

---

## 🚀 Key Features

### 📐 **Mathematically Correct Models**
- **Erlang B** - Blocking model (no queuing, for trunk/circuit planning)
- **Erlang C** - Classic formula (infinite patience assumption)
- **Erlang A** - With customer abandonment modeling (most accurate for contact centers)
- **Model Comparison** - Compare results side-by-side to see the difference

### 📞 **Multi-Channel Support**
- Voice, Email, Chat, Video, Social Media, Custom channels
- Channel-specific AHT and concurrency handling
- Blended agent calculations
- Skill-based routing optimization

### 📥 **Universal CSV Import**
- **Smart Column Mapping** - Works with any ACD export format
- **Auto-Detection** - Automatically matches your column names
- **Flexible Parsing** - Handles time formats (HH:MM:SS, seconds), percentages, etc.
- **Preview & Validate** - See your data before importing

### 📊 **Interactive Visualizations**
- Service level curves vs. staffing levels
- Occupancy and utilization dashboards
- Cost trade-off analysis
- Intraday staffing schedules
- What-if scenario comparisons

### 🎯 **Capacity Planning (Reverse Calculator)**
- Enter available agents/seats, see achievable service level
- Identify staffing surplus or deficit
- Optimize resource utilization

### 📤 **Export & Reporting**
- Export to CSV, JSON, and text reports
- Customizable reports for different audiences
- Save/load configurations

### 📚 **Built-in Help & Training**
- **Educational Mode** - Step-by-step formula breakdowns
- **Interactive Tutorials** - First-time user onboarding
- **Contextual Tooltips** - Help text on every field
- **Example Scenarios** - Pre-loaded realistic use cases
- **Glossary** - Contact center terminology explained

---

## 🎬 Quick Start

### Prerequisites
- **Node.js** 18+ and npm (or yarn/pnpm)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/elecumbelly/OdeToErlangAndBromley.git
cd OdeToErlangAndBromley/odetoerlang

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Build for Production

```bash
npm run build
```

Production files will be in `dist/` directory. Deploy to any static hosting service (Netlify, Vercel, GitHub Pages, S3, etc.).

---

## 📖 Usage Guide

### Basic Staffing Calculation (Erlang C)

1. **Navigate to Calculator tab**
2. **Enter your inputs:**
   - Call Volume: `1000` calls
   - Average Handle Time: `240` seconds (4 minutes)
   - Interval: `30` minutes
   - Target Service Level: `80%` in `20` seconds
   - Shrinkage: `25%`
   - Max Occupancy: `90%`
3. **Select Model:** Erlang C
4. **View Results:**
   - Required Agents
   - Total FTE (Full-Time Equivalents)
   - Achieved Service Level
   - Average Speed of Answer (ASA)
   - Agent Occupancy

### Importing CSV Data

1. **Go to Import Data tab**
2. **Upload your CSV file** (any format from any ACD system)
3. **Map your columns:**
   - Auto-detection will suggest mappings
   - Manually adjust dropdowns if needed
   - Required fields: Call Volume, AHT
4. **Preview & Import**
5. **Apply to Calculator**

### Comparing Models (B vs C vs A)

1. **Go to Model Comparison tab**
2. **Enter scenario parameters**
3. **See side-by-side results** for Erlang B, C, and A
4. **Understand the differences:**
   - Erlang B: blocking probability (no queue)
   - Erlang C: assumes infinite patience (overestimates service level)
   - Erlang A: accounts for abandonment (most realistic)

### What-If Scenarios

1. **Go to What-If Scenarios tab**
2. **Create multiple scenarios** (e.g., "Current", "High Volume", "Low AHT")
3. **Adjust parameters** for each scenario
4. **Compare results** in a single view
5. **Identify optimal staffing strategy**

### Capacity Planning

1. **Go to Capacity Planning tab**
2. **Enter available resources:**
   - Available Agents: `50`
   - Available Seats: `60`
3. **See achievable service level** with current staffing
4. **Identify surplus/deficit** vs. optimal staffing

---

## 🧮 Mathematical Background

### The Erlang Formula Family

#### Erlang C (1917)
**Assumptions:** Infinite customer patience (no abandonment)

**Use Case:** Basic staffing calculations, widely understood baseline

**Formula:**
```
P(wait > 0) = Erlang C formula
P(wait > t) = P(wait > 0) × e^(-(c-A)×t/AHT)

where:
  c = number of agents
  A = traffic intensity (Erlangs)
  t = threshold time
  AHT = average handle time
```

**Limitation:** Overestimates service level by 5-15% (assumes customers never hang up)

#### Erlang A (2004)
**Assumptions:** Customers abandon after patience threshold expires

**Use Case:** More realistic modeling with abandonment behavior

**Improvements:**
- Accounts for customer impatience
- More accurate service level predictions (~5% error)
- Calculates abandonment rates

**Additional Parameter:** θ (theta) = Average Patience / AHT

### When to Use Each Model

| Scenario | Recommended Model | Reason |
|----------|-------------------|--------|
| Trunk/circuit planning | Erlang B | Calculates blocking probability |
| Quick estimates | Erlang C | Fast, simple, widely understood |
| Budget planning | Erlang C | Conservative staffing estimate |
| Operational staffing | Erlang A | Accounts for real-world abandonment |
| High-abandonment queues | Erlang A | Critical to account for lost contacts |

### Key Metrics Explained

**Traffic Intensity (Erlangs)**
```
A = (Call Volume × AHT) / Interval Length
```
Represents workload. 1 Erlang = 1 agent continuously busy.

**Service Level (SL)**
```
SL = % of contacts answered within threshold time
Example: 80/20 = 80% answered in 20 seconds
```

**Occupancy**
```
Occupancy = Traffic Intensity / Required Agents
Typical voice: 85-90% (agents busy 85-90% of time)
```

**Shrinkage**
```
Total FTE = Required Agents / (1 - Shrinkage%)
Includes: breaks, lunch, training, meetings, absenteeism
Typical: 20-35%
```

---

## 🏗️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety for complex calculations
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management

### Data & Visualization
- **Recharts** - Interactive charts and graphs
- **Papa Parse** - CSV parsing and generation
- **FullCalendar** - Calendar & scheduling UI

### Build & Development
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking

### Mathematics
- Custom implementations of:
  - Erlang B formula (blocking model)
  - Erlang C formula (iterative method, factorial-safe)
  - Erlang A formula with abandonment
  - Multi-skill routing algorithms

---

## 📁 Project Structure

```
OdeToErlangAndBromley/
├── odetoerlang/               # Main application directory
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── BPO/                 # Client, Contract, Billing
│   │   │   ├── Calendar/            # Event management
│   │   │   ├── Workforce/           # Staff, Roles management
│   │   │   ├── InputPanel.tsx         # Main input form
│   │   │   ├── ResultsDisplay.tsx     # Results output
│   │   │   ├── ChartsPanel.tsx        # Visualizations
│   │   │   ├── SmartCSVImport.tsx     # Universal CSV importer
│   │   │   ├── MultiChannelPanel.tsx  # Multi-channel config
│   │   │   ├── ScenarioComparison.tsx # What-if scenarios
│   │   │   ├── ModelComparison.tsx    # B vs C vs A comparison
│   │   │   ├── ReverseCalculator.tsx  # Capacity planning
│   │   │   ├── EducationalMode.tsx    # Learning resources
│   │   │   └── ExportPanel.tsx        # Export functionality
│   │   ├── lib/
│   │   │   ├── calculations/  # Mathematical formulas
│   │   │   │   ├── erlangEngine.ts    # Unified Erlang B/C/A engine
│   │   │   │   ├── erlangA.ts         # Erlang A (abandonment model)
│   │   │   │   ├── erlangB.ts         # Erlang B (blocking model)
│   │   │   │   └── erlangC.ts         # Erlang C (queuing model)
│   │   │   └── utils/         # Helper functions
│   │   ├── store/
│   │   │   └── calculatorStore.ts     # Zustand state management
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript definitions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Dependencies
│   └── vite.config.ts         # Build configuration
├── docs/                      # Documentation
│   ├── FORMULAS.md           # Mathematical reference
│   ├── CSV-FORMATS.md        # CSV import specifications
├── LICENSE                    # MIT License
├── README.md                  # This file
├── CLAUDE.md                  # AI assistant guide
├── CONTRIBUTING.md            # Contribution guidelines
└── CHANGELOG.md               # Version history
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Key Test Areas
- ✅ Erlang B blocking probability calculations
- ✅ Erlang C formula accuracy (validated against published tables)
- ✅ Erlang A abandonment calculations
- ✅ CSV parsing and validation
- ✅ Component rendering
- ✅ Edge cases (zero volume, 100% shrinkage, impossible SLAs)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit with clear messages: `git commit -m "Add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Principles
- **Simplicity first** - No over-engineering
- **Mathematical accuracy** - Validate against published references
- **Security** - No XSS, injection, or OWASP vulnerabilities
- **Performance** - Optimize for large datasets
- **Documentation** - Comment complex logic, update docs

---

## 📜 License

**MIT License** - Copyright 2025 SteS

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 🙏 Acknowledgments

### Academic References
- **A.K. Erlang** (1917) - Original Erlang B and C formulas
- **Garnett, Mandelbaum & Reiman** (2002) - Erlang A with abandonment

### Inspiration
- Contact center professionals worldwide
- Open-source WFM community
- Queuing theory researchers

### Built With
- ❤️ and ☕ by the OdeToErlangAndBromley team
- Powered by modern web technologies
- Validated against industry-standard tools

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/elecumbelly/OdeToErlangAndBromley/issues)
- **Discussions:** [GitHub Discussions](https://github.com/elecumbelly/OdeToErlangAndBromley/discussions)
- **Email:** [Contact via GitHub profile](https://github.com/elecumbelly)

---

## 🗺️ Roadmap

### Current Version (v0.2.0)
- ✅ Erlang B, C, A models
- ✅ Multi-channel support
- ✅ Universal CSV import
- ✅ Model comparison
- ✅ Capacity planning
- ✅ Educational mode

### Planned Features
- [ ] Historical data analysis with trend detection
- [ ] Advanced forecasting algorithms (moving average, regression, seasonality)
- [ ] Shift scheduling/rostering
- [ ] Real-time data feeds (WebSocket/API integration)
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Integration with popular WFM tools (import/export formats)
- [ ] Cloud save/sync (optional, privacy-preserving)

---

## ⭐ Star History

If you find OdeToErlangAndBromley useful, please consider giving it a star on GitHub!

---

**Made with precision and care for contact center professionals worldwide.**

*"In tribute to A.K. Erlang (1878-1929), whose mathematical genius transformed telecommunications and continues to optimize contact centers a century later."*

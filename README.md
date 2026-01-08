# 📊 OdeToErlang

> **The Unified Open-Source Workforce Management (WFM) Platform**

OdeToErlang is a comprehensive, professional-grade browser-based platform for contact centre capacity planning and scheduling. It combines the rigorous mathematics of **A.K. Erlang** with a modern, high-performance UI to manage every stage of the WFM lifecycle—from historical analysis and forecasting to automated shift scheduling.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)

---

## ✨ Why OdeToErlang?

**Problem:** Standard WFM tools are either prohibitively expensive enterprise suites or simplistic spreadsheets that fail in multi-channel environments. Most require uploading sensitive PII (Personally Identifiable Information) to third-party clouds.

**Solution:** OdeToErlang is a **Local-First** platform. It runs a full SQLite database in your browser. All your staff data, historical volumes, and schedules stay on your device. It is mathematically precise, visually stunning, and 100% private.

---

## 🚀 Key Features

### 🏛️ **Command Centre (Dashboard)**
- **Health Overview:** Real-time analysis of your current staffing vs. demand.
- **Actionable Alerts:** Instant notification of understaffing risks or high occupancy burnout.
- **Trend Tracking:** 7-day performance visualization at a glance.

### 📐 **The Math Engine**
- **Erlang A, B, and C:** Support for everything from trunk sizing to complex queues with abandonment.
- **Solve For Mode:** Unique "Reverse Erlang" capability—input your current headcount to see the real-world service level impact of demand spikes.
- **Multi-Channel:** Model blended agents across Voice, Chat (with concurrency), Email, and Social.

### 📜 **Historical Analysis & Forecasting**
- **Universal Ingest:** Smart CSV mapper works with reports from any ACD (Avaya, Genesys, Five9, etc.).
- **Pattern Detection:** Automated identification of "Day of Week" and "Time of Day" volume trends.
- **Advanced Projections:** Generate 14-90 day forecasts using Linear Regression, Moving Averages, and Exponential Smoothing.

### ⏰ **Automated Scheduling**
- **Staff Directory:** Manage roles, skills, and attrition risks for your entire team.
- **Auto-Scheduler:** AI-driven shift generation that matches staff availability to forecasted demand.
- **A/B Comparison:** Run different optimization methods (Greedy vs. Local Search) to find the most efficient roster.

### 📱 **Mobile Manager Mode**
- Fully responsive "Manager-First" UI.
- Sticky KPI tracking while adjusting inputs on the move.
- Professional PDF "Board Pack" reporting for stakeholder meetings.

---

## 🏗️ Technology Stack: The "Local-First" Architecture

OdeToErlang represents a new breed of web application:
- **Database:** `sql.js` (SQLite compiled to WebAssembly) providing a 31-table relational schema in-browser.
- **Persistence:** SQLite binary is persisted to **IndexedDB**—your data survives browser refreshes and works offline.
- **Logic:** Complex math and optimization engines written in pure TypeScript.
- **UI:** React 19 + Tailwind CSS + Recharts for hardware-accelerated visualizations.

---

## 🎬 Quick Start

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

---

## 🗺️ Roadmap

### Current Version (v0.2.2)
- ✅ Executive Command Centre
- ✅ Erlang A/B/C mathematical parity
- ✅ Historical Trend Analysis
- ✅ Multi-algorithm Volume Forecasting
- ✅ Automated Shift Scheduling
- ✅ Local-First SQL Persistence
- ✅ Professional PDF Reporting

### Planned Features
- [ ] **Scenario Persistence:** Save "What-If" comparisons to the permanent database.
- [ ] **Shift Bidding:** Portal for agents to view and select preferred shifts.
- [ ] **Multi-Skill Solver:** Advanced ILP (Integer Linear Programming) for complex multi-skill environments.
- [ ] **i18n:** Support for global contact centre operations (FR, DE, ES, PH).

---

## 📜 License

**MIT License** - Copyright 2025 SteS

---

## 🙏 Acknowledgments & Tributes

This platform is named in tribute to two pioneers who transformed the contact centre industry:

*   **A.K. Erlang (1878-1929):** The Danish mathematician whose genius founded queuing theory and the formulas that still drive capacity planning today.
*   **Lester Bromley:** The creator of the original **"Erlang for Excel"** Visual Basic plugin. His work democratized these complex calculations, providing the engine that has powered nearly every call centre spreadsheet in the world at some point in its history.

*"In tribute to the pioneers who made precision possible in a world of uncertainty."*

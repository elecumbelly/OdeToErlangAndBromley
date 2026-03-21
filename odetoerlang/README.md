# OdeToErlang: The Unified WFM Platform

A comprehensive, professional-grade browser-based platform for contact centre capacity planning and scheduling. Built with React 18, SQLite-wasm, and the rigorous queuing theory of **A.K. Erlang**.

## 🚀 Key Features

- **🏛️ Command Centre** - Unified executive dashboard for real-time operation health monitoring.
- **🧮 Advanced Math Engine** - Mathematically correct Erlang B, C, and A models.
- **🔄 Solve For Mode** - Inverse Erlang calculations (Fixed Headcount → Achieved Service Level).
- **📈 Historical Analysis** - Pattern detection and volume forecasting (Linear, Moving Avg, Smoothing).
- **⏰ Automated Scheduling** - AI-driven roster generation from staff availability and skill sets.
- **📱 Mobile Manager Mode** - Fully responsive UI with sticky KPI tracking for on-the-go planning.
- **📥 Universal Ingest** - Smart CSV column mapping for any ACD report format.
- **📂 Local-First Architecture** - Full 31-table SQLite database running in your browser via `sql.js`.
- **🔐 100% Private** - No backend, no cloud—all sensitive PII stays on your device.

## 🏗️ Tech Stack

- **UI:** React 18 + Tailwind CSS + Recharts
- **State:** Zustand (State Management)
- **Database:** `sql.js` (SQLite WASM) + `idb` (IndexedDB Persistence)
- **Engine:** Pure TypeScript implementation of Erlang A/B/C and Scheduling Algorithms
- **Test:** Vitest (500+ unit/integration tests)

## ⚡ Performance Optimizations

- **Binary search agent solving:** O(log n) performance for large staff requirements.
- **Lazy Loading:** All tabs are code-split to ensure a fast initial bundle load.
- **Non-blocking DB init:** UI renders immediately while the SQLite engine hydrates.
- **Input Debouncing:** 300ms delay prevents UI jank during rapid parameter changes.

## 🛠️ Recent Changes (v0.2.2)

- **Command Centre:** Added a new landing page dashboard.
- **Unified Navigation:** Added visual icons and compact headers for mobile use.
- **Apply Forecast:** Added "One-Click" bridge from Historical Forecasts to the Calculator.
- **Reporting:** Added professional "Download Report" (PDF) with custom print styles.
- **Demo Data:** Added "Load Demo Team" to quickly populate empty databases.

## 🧪 Testing

```bash
npm run test:run      # Run all tests
npm run test:coverage # Check mathematical accuracy coverage
```

## License

MIT - Copyright 2025 SteS

# OdeToErlangAndBromley

A comprehensive contact center capacity planning calculator built with React, TypeScript, and Tailwind CSS.

Named in tribute to **A.K. Erlang** and the mathematical foundations of queuing theory that power modern workforce management.

## Features

- **Erlang B, C, and A Models** - Mathematically correct implementations validated against published/golden cases
- **Multi-Channel Support** - Voice, chat, email, video with concurrency handling
- **Real-Time Calculations** - Instant results as parameters change
- **What-If Scenarios** - Save and compare different staffing scenarios
- **Model Comparison** - Side-by-side comparison of Erlang B vs C vs A
- **Queue Simulation** - Discrete-event simulation for validation
- **Import/Paste** - Smart CSV import, paste-from-Excel, and example data to try instantly
- **Export & Backup** - CSV/JSON/report export plus local DB export/import (browser-only sql.js/IndexedDB)
- **Educational Mode** - Step-by-step formula breakdowns
- **100% Browser-Based** - No backend, no data leaves your machine
- **IndexedDB Storage** - Persistent database with no 5MB limit

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Live Demo (Deploy)
- Build: `npm run build` (outputs `dist/`)
- Deploy `dist/` to static hosting (Netlify/Vercel/GitHub Pages/S3).
- Once deployed, add your live URL under “Live Demo” below and share.

Live Demo: _add your deployed link here_

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

500+ tests covering:
- Erlang B, C, A formula calculations
- Erlang A golden sanity and tolerance checks
- Simulation engine with seeded RNG for reproducibility
- Database operations (storage, schema migrations)
- Calculator store state management
- Input validation and edge cases

## Tech Stack

- **React 19** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Recharts** - Visualization
- **sql.js** - SQLite in browser (WASM)
- **idb** - IndexedDB wrapper
- **Vitest** - Testing

## Project Structure

```
src/
├── components/       # UI components
├── lib/
│   ├── calculations/ # Erlang B/C/A + unified engine
│   ├── database/     # SQLite + IndexedDB storage
│   └── validation/   # Input validation
├── store/            # Zustand stores
└── types/            # TypeScript types
```

## Documentation

- [FORMULAS.md](../docs/FORMULAS.md) - Mathematical reference
- [CSV-FORMATS.md](../docs/CSV-FORMATS.md) - Import file formats
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - 22-table schema (including schema_version)

### DB Backup/Restore (Browser-Only)
- Open the **Export** tab.
- Click **Export DB** to download the local sql.js database (persists via IndexedDB).
- Click **Import DB** to load a previously exported `.sqlite` file; migrations run automatically. All data stays in your browser—no servers.

## Performance Optimizations

- **Binary search** for agent solving - O(log n) vs O(n) linear search
- **Input debouncing** (300ms) - Prevents excessive recalculation during typing
- **Code splitting** - Lazy-loaded tabs reduce initial bundle size
- **Non-blocking DB init** - UI renders immediately while database loads

## Recent Changes (v0.1.0)

- Added onboarding banner + guided tour (Import → Calculator → Export)
- Paste-from-Excel quick ingest with sample data; mobile sticky KPI bar with occupancy cap badge
- Export panel now supports local DB export/import with schema diagnostics
- Added Erlang A golden sanity tests and tolerance-based golden suites
- Added parse-time and sticky-bar perf markers for debugging

## License

MIT - Copyright 2025 SteS

# OdeToErlang

A comprehensive contact center capacity planning calculator built with React, TypeScript, and Tailwind CSS.

Named in tribute to **A.K. Erlang** and the mathematical foundations of queuing theory that power modern workforce management.

## Features

- **Erlang C, A, and X Models** - Mathematically correct implementations validated against published tables
- **Multi-Channel Support** - Voice, chat, email, video with concurrency handling
- **Real-Time Calculations** - Instant results as parameters change
- **What-If Scenarios** - Save and compare different staffing scenarios
- **Model Comparison** - Side-by-side comparison of Erlang C vs A vs X
- **Queue Simulation** - Discrete-event simulation for validation
- **CSV Import/Export** - Load historical data, export results
- **Educational Mode** - Step-by-step formula breakdowns
- **100% Browser-Based** - No backend, no data leaves your machine
- **IndexedDB Storage** - Persistent database with no 5MB limit

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

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

443 tests covering:
- Erlang C, A, X formula calculations
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
│   ├── calculations/ # Erlang C, A, X implementations
│   ├── database/     # SQLite + IndexedDB storage
│   └── validation/   # Input validation
├── store/            # Zustand stores
└── types/            # TypeScript types
```

## Documentation

- [FORMULAS.md](../docs/FORMULAS.md) - Mathematical reference
- [CSV-FORMATS.md](../docs/CSV-FORMATS.md) - Import file formats
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - 22-table schema (including schema_version)

## Performance Optimizations

- **Binary search** for agent solving - O(log n) vs O(n) linear search
- **Input debouncing** (300ms) - Prevents excessive recalculation during typing
- **Code splitting** - Lazy-loaded tabs reduce initial bundle size
- **Non-blocking DB init** - UI renders immediately while database loads

## Recent Changes (v0.1.0)

- Fixed SQL injection vulnerability in `upsertAssumption`
- Added schema versioning and migration support
- Implemented simulation seeding for reproducible runs
- Added 351 new tests (443 total, up from 92)

## License

MIT - Copyright 2025 SteS

# TODO - OdeToErlangAndBromley

**Status:** Build/tests passing (569), version 0.2.3. Major features shipped (calculator, scenarios/model comparison, capacity, historical/forecasting, workforce/BPO, simulation, import/export, tour, mobile sticky KPIs, DB backup).

**Open items:**
- Optional E2E smoke (Playwright/Cypress) for core flows (calc, import/apply, export/DB backup).
- Outstanding `pnpm audit` advisories (21 total: 12 high, 9 moderate as of 2026-05-17). All transitive through dev tooling, none in the shipped bundle. The remaining issues are gated by major-version jumps deliberately deferred: `eslint@8→10` (7), `@vitest/coverage-v8@2→4` (4), `vite@5→6+` (3, incl. direct path-traversal in <6.4.2), `lint-staged@15→17` (3), `vite-plugin-pwa@0.20→1.x` (2, would clear most of the old workbox chain), `tailwindcss@3→4` (2). Each major needs its own validation pass.
- Visual QA the 2026-05-16 mobile fixes (commit 7269ee1) in Chrome DevTools device mode — the heuristic pass landed responsive breakpoints but wasn't verified in a real mobile viewport.

Everything else tracked here has been delivered. Update this file only when new work is identified.

# TODO - OdeToErlangAndBromley

**Status:** Build/tests passing (569), version 0.2.3. Major features shipped (calculator, scenarios/model comparison, capacity, historical/forecasting, workforce/BPO, simulation, import/export, tour, mobile sticky KPIs, DB backup).

**Open items:**
- Optional E2E smoke (Playwright/Cypress) for core flows (calc, import/apply, export/DB backup).
- Outstanding npm-audit advisories in dev tooling (esbuild/vite/vitest chain, brace-expansion, ajv, yaml, @babel/plugin-transform-modules-systemjs). All transitive through Vite/Vitest dev deps. Either accept and wait for upstream, or run `npm audit fix --force` and validate the Vite 5 → 8 jump separately.
- Visual QA the 2026-05-16 mobile fixes (commit 7269ee1) in Chrome DevTools device mode — the heuristic pass landed responsive breakpoints but wasn't verified in a real mobile viewport.

Everything else tracked here has been delivered. Update this file only when new work is identified.

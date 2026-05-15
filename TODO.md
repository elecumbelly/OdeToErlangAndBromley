# TODO - OdeToErlangAndBromley

**Status:** Build/tests passing (569), version 0.2.3. Major features shipped (calculator, scenarios/model comparison, capacity, historical/forecasting, workforce/BPO, simulation, import/export, tour, mobile sticky KPIs, DB backup).

**Open items:**
- Mobile polish pass (visual QA on all tabs).
- Optional E2E smoke (Playwright/Cypress) for core flows (calc, import/apply, export/DB backup).
- Outstanding npm-audit advisories in dev tooling (esbuild/vite/vitest chain, brace-expansion, ajv, yaml, @babel/plugin-transform-modules-systemjs). All transitive through Vite/Vitest dev deps. Either accept and wait for upstream, or run `npm audit fix --force` and validate the Vite 5 → 8 jump separately.
- Stripped unused exports (~48) and unused exported types (~15) flagged by knip — many are intentional API surface (e.g. Site/Contract/BillingRule CRUD in `dataAccess/contracts.ts`) and were deliberately preserved. Worth a one-off judgment pass if anyone is doing dead-code spring cleaning.

Everything else tracked here has been delivered. Update this file only when new work is identified.

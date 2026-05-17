# TODO - OdeToErlangAndBromley

**Status:** Build/tests passing (569 unit + 7 Playwright), version 0.2.3. Major features shipped (calculator, scenarios/model comparison, capacity, historical/forecasting, workforce/BPO, simulation, import/export, tour, mobile sticky KPIs, DB backup).

**Open items:**

- **Mobile chrome overflow at phone widths** — header toolbar (`Simple`/`Advanced`/`MATH MODEL`/theme toggle) and tab nav (`📊 Command`/`🧮 Calculator`/...) overflow at 360px and 390px viewports. Forms stack correctly (the 2026-05-16 fix in `92cea7f` covered them). Both fail cases are guarded by `test.fail()` in `odetoerlang/e2e/mobile-viewports.spec.ts` so CI alerts when fixed. Fix lives in `src/App.tsx` — header banner needs `flex-wrap` or small-viewport collapse; tab nav needs `overflow-x-auto` parent. Details in `docs/qa/2026-05-17-mobile-signoff.md`.
- **Playwright E2E coverage** — calculator happy path + 6 mobile viewport tests landed in `chore/followups-2026-05-17`. The original plan asked for additional specs covering import-apply and export-backup flows. No audit impact; pure regression-net work.

**Smaller follow-ups surfaced by the 2026-05-17 dep-bump pass:**

- `eslint-plugin-react-hooks` is pinned at 5.2.0. v7 adds `react-hooks/purity` and `react-hooks/set-state-in-effect` rules that flag 27 sites in current source — a refactor opportunity, not a bug. Triage scope first (see `docs/plans/2026-05-17-followups.md#followup-e`).
- Tailwind 4 `tailwind.config.js` is referenced via `@config` rather than migrated to `@theme` blocks in CSS. ~180 lines of token definitions worth porting eventually for v4-native ergonomics. Cosmetic.
- Recharts 3 dashboard QA — current mobile spec exercises calculator only. Dashboard, scenarios, and historical-analysis charts not yet visually smoked under recharts 3 defaults. Add a spec when these surfaces are touched anyway.

**Audit floor (post-2026-05-17):** 7 vulnerabilities (6 high, 1 moderate), all transitive dev-tooling, none in the shipped bundle. Entry points: `eslint-plugin-jsx-a11y` (3), `eslint` (3), `vite-plugin-pwa` (1) — all upstream-blocked pending fixed releases.

Everything else tracked here has been delivered. Update this file only when new work is identified.

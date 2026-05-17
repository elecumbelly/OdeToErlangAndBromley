# TODO - OdeToErlangAndBromley

**Status:** Build/tests passing (569), version 0.2.3. Major features shipped (calculator, scenarios/model comparison, capacity, historical/forecasting, workforce/BPO, simulation, import/export, tour, mobile sticky KPIs, DB backup).

**Open items:**

- **Playwright E2E smoke** — three specs for calc / import-apply / export-backup + CI step. Plan detail in `docs/plans/2026-05-17-tech-debt.md` (PR9). No audit impact; pure regression-net work.
- **Mobile viewport QA** — verify the 2026-05-16 mobile fixes (commit 7269ee1) in Chrome DevTools device mode AND smoke the 2026-05-17 dep-bump diffs (recharts 3 default tooltip styling, tailwindcss 4 CSS pipeline). Plan detail in `docs/plans/2026-05-17-tech-debt.md` (PR10).

**Smaller follow-ups surfaced by the 2026-05-17 dep-bump pass:**

- `.husky/pre-commit` uses `npx lint-staged` — works under pnpm but stylistically inconsistent with the npm→pnpm migration. One-line change to `pnpm exec lint-staged` after confirming the hook fires.
- `autoprefixer` may be redundant under tailwindcss 4 (Lightning CSS handles prefixing). Removable, but verify-before-remove with a build-output inspection across target browsers.
- `eslint-plugin-react-hooks` is pinned at 5.2.0. v7 adds `react-hooks/purity` and `react-hooks/set-state-in-effect` rules that flag 27 sites in current source — a refactor opportunity, not a bug.
- Tailwind 4 `tailwind.config.js` is referenced via `@config` rather than migrated to `@theme` blocks in CSS. ~180 lines of token definitions worth porting eventually for v4-native ergonomics.

**Audit floor (post-2026-05-17):** 7 vulnerabilities (6 high, 1 moderate), all transitive dev-tooling, none in the shipped bundle. Entry points: `eslint-plugin-jsx-a11y` (3), `eslint` (3), `vite-plugin-pwa` (1) — all upstream-blocked pending fixed releases.

Everything else tracked here has been delivered. Update this file only when new work is identified.

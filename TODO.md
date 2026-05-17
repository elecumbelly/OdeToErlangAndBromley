# TODO - OdeToErlangAndBromley

**Status:** Build/tests passing (569 unit + 13 Playwright), version 0.2.3. All previously tracked items shipped.

**Open items:**

_None._ The 2026-05-17 burn-down cleared the backlog:

- Mobile chrome overflow at phone widths — fixed in `src/App.tsx` (header `flex-wrap` + tab-nav `overflow-x-auto` parent + sub-tab-nav same pattern); regression-locked by 9 viewport tests in `e2e/mobile-viewports.spec.ts`.
- Playwright E2E coverage — 13 specs total covering calculator happy path, CSV import (sample-data route), CSV export download, DB sqlite backup download, plus 3×3 viewport sweep (landing / advanced calculator / dashboard).
- Dashboard recharts 3 mobile QA — covered by 3 dashboard viewport tests; no overflows under recharts 3 defaults.
- `eslint-plugin-react-hooks` upgraded to 7.1.1 — the five new strictness rules (`purity`, `refs`, `set-state-in-effect`, `preserve-manual-memoization`, `immutability`) are explicitly disabled in `eslint.config.js` with per-rule rationale referencing the codebase patterns they flag. Canonical `rules-of-hooks` and `exhaustive-deps` remain enforced.

**Deliberately deferred (low value):**

- Tailwind 4 native `@theme` migration — attempted, reverted. The CSS in `index.css` uses runtime-themed `--color-bg-base` etc., which requires `@theme inline` + matching value declarations to register the utilities under v4. The dual-theme (`html` / `html.light`) variable swap is fragile to migrate; the current `@config "../tailwind.config.js"` directive is a fully supported v4 path and the JS config is the canonical source of truth. Worth revisiting only if/when tailwind 4 publishes clearer dual-theme migration guidance.

**Audit floor (post-2026-05-17):** 7 vulnerabilities (6 high, 1 moderate), all transitive dev-tooling, none in the shipped bundle. Entry points: `eslint-plugin-jsx-a11y` (3), `eslint` (3), `vite-plugin-pwa` (1) — all upstream-blocked pending fixed releases.

Update this file only when new work is identified.

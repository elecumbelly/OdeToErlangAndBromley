# Tech-Debt Burn-Down Follow-Ups — 2026-05-17

Follows `2026-05-17-tech-debt.md`. The original plan's 8 dep-bump PRs landed via PR #5 (merge `3e78681`). The audit floor dropped from 34 to 7 vulnerabilities. This doc tracks the residual items.

Validation gate per follow-up:

```
pnpm install
pnpm exec tsc -b --force
pnpm test --run             # 569 tests
pnpm build
pnpm run lint
```

Order of operations: TODO refresh + housekeeping first (lowest risk, smallest diff), then regression-net work (E2E + mobile QA), then deferred refactors.

---

## Sequencing rationale

1. **F3 → F1 (single commit)** — TODO.md is already edited on disk; bundle with the 1-line `npx → pnpm exec` change in `.husky/pre-commit`. Both are housekeeping; one tiny commit.
2. **F2 (autoprefixer)** — needs a verify-before-remove pass. Inspect `dist/assets/*.css` for vendor prefixes; if Lightning CSS already emits them, drop autoprefixer. Otherwise keep with a one-line rationale.
3. **F4 (Playwright E2E)** — gives us a regression net BEFORE F5 (mobile QA may surface CSS bugs requiring fixes) and BEFORE F6 (real source refactor). Order matters: catch regressions early.
4. **F5 (Mobile QA)** — visual sweep across viewports. Documents findings; may add small follow-ups but doesn't itself ship code.
5. **F6 (react-hooks 7)** — DEFERRED for scope assessment. The 27 violations include legitimate patterns (e.g., `performance.now()` for telemetry, `useEffect` calling state setters for sync-from-external-state). Some are refactor opportunities; others are false positives that warrant `eslint-disable-next-line`. Needs a triage pass before committing to scope.
6. **F7 (Tailwind native @theme)** — DEFERRED. Cosmetic ergonomic improvement, no functional change. The current `@config "../tailwind.config.js"` path works fine. Worth doing when someone touches the design system; not worth a dedicated cycle.

---

## Per-PR detail

### Followup-A — `chore: refresh TODO.md and switch husky to pnpm exec` (F1 + F3)

Single combined commit.

**Changes:**
- `TODO.md`: already edited on disk during the burndown wrap-up. Replaces stale audit-floor description (21 vulns) with the post-merge state (7 vulns), and replaces the deferred-major list with concrete follow-up items + smaller cleanups.
- `odetoerlang/.husky/pre-commit`: `npx lint-staged` → `pnpm exec lint-staged`. Both resolve to the same binary via local `node_modules/.bin`, but the pnpm form is consistent with the npm→pnpm migration in commit b4c3067 (the migration didn't touch the husky hook).

**Validation:**
- Make a no-op staged change locally and `git commit --allow-empty-message --allow-empty`... actually do a real commit with a small touch to confirm both `eslint --fix` and `vitest related` fire via the hook.
- CI green (no code changes; just config text).

**Effort:** XS.

---

### Followup-B — `chore(build): drop autoprefixer if redundant under tailwindcss 4` (F2)

Tailwind 4 uses Lightning CSS, which handles autoprefixing internally based on the project's `browserslist`. The previous PostCSS chain had explicit `autoprefixer` that may now be redundant.

**Steps:**
1. With the current chain (`@tailwindcss/postcss` + `autoprefixer`), run `pnpm build` and inspect `dist/assets/index-*.css` for vendor-prefixed properties (e.g., `-webkit-`, `-moz-`).
2. Drop `autoprefixer` from `postcss.config.js` and `package.json`. Rebuild. Diff the `dist/assets/index-*.css` against step 1.
3. Decision tree:
   - **If diff is empty or only differs in whitespace/ordering** → autoprefixer is redundant. Commit the removal. Confirm by spot-checking 3-5 prefix-sensitive properties (`flex`, `transform`, `appearance`, `mask-*`).
   - **If diff shows missing prefixes** → keep autoprefixer. Document the finding in TODO.md ("kept for browser X coverage gap").

**Validation:** build green; CSS bundle smaller or identical; visual smoke unchanged.

**Effort:** S. Two builds + diff + decision.

---

### Followup-C — `test(e2e): add Playwright smoke for calc, import-apply, export-backup` (F4)

New test infra. Per the original tech-debt plan (PR9 in `2026-05-17-tech-debt.md`).

**Layout:**
- New dir: `odetoerlang/e2e/`
- New files:
  - `odetoerlang/playwright.config.ts` — chromium project, `webServer: pnpm preview --port 4173`, `baseURL: http://localhost:4173/OdeToErlangAndBromley/` (matches the vite `base` config).
  - `odetoerlang/e2e/calculator.spec.ts`
  - `odetoerlang/e2e/import-apply.spec.ts`
  - `odetoerlang/e2e/export-backup.spec.ts`
- `package.json` scripts: `test:e2e`, `test:e2e:ui`. Add `@playwright/test` to devDependencies (verify cooldown — `@playwright/test` releases monthly; pin to the latest version ≥3 days old).
- `.gitignore`: add `odetoerlang/playwright-report/`, `odetoerlang/test-results/`.
- `.github/workflows/ci.yml`: append an `e2e` job that runs `pnpm exec playwright install --with-deps chromium` then `pnpm run test:e2e`. Keep separate from unit-test step so failure modes are visible. Use the existing pnpm cache.

**Test scope** (happy-path only, no edge-case matrix):
- `calculator.spec.ts`: app loads → fill volume, AHT, target SL → click Calculate → assert agents-required, SL, and occupancy metrics render with non-empty numeric content.
- `import-apply.spec.ts`: navigate to import UI → upload a small CSV fixture (use existing `src/tests/fixtures/`) → confirm preview → apply scenario → assert calculator inputs update.
- `export-backup.spec.ts`: trigger CSV export and DB backup → use Playwright's `page.on('download')` to capture and assert filename + non-empty size.

**Test patterns:**
- Use `page.getByRole`/`getByLabel` for stable selectors (existing components mostly use semantic HTML with proper labels).
- No test IDs needed for happy paths.
- Each spec: ~30-80 lines.

**Install commands** (run in `odetoerlang/`):
```
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

**Expected runtime:** ~30-60s local, ~90-120s CI cold.

**Validation:**
- `pnpm test:e2e` green on a clean checkout.
- CI green.

**Effort:** M. Three specs + config + workflow. Stable-selector discovery and fixture wiring are the main time sinks.

---

### Followup-D — `docs(qa): mobile viewport sign-off — 2026-05-17` (F5)

Visual sweep + sign-off doc. Per PR10 in the tech-debt plan, plus an obligation to smoke the recharts 3 / tailwindcss 4 changes from the burndown.

**Viewports to test:**
- 360 × 640 (small phone)
- 390 × 844 (iPhone 14)
- 768 × 1024 (iPad portrait — desktop layout should start here, not before)

**Flows:**
1. Calculator: fill inputs, run calc, view results, expand collapsible sections, switch tabs.
2. Charts panel: confirm ResponsiveContainer holds shape on 360px width; tooltips fire; no horizontal scroll.
3. Scenarios + Dashboard: sticky KPI bar visible; dialogs full-screen on mobile; CTAs reachable.
4. Calendar: month-view legibility; event modal usability on touch.
5. Import/export: file picker reachable; modal dismissible.

**Pass criteria:**
- No horizontal scroll at any viewport.
- All primary CTAs reachable without zoom.
- Charts legible (axis labels not clipped under recharts 3's default styling).
- Dark and light themes both render under tailwind 4.

**Deliverables:**
- New file: `docs/qa/2026-05-17-mobile-signoff.md` — viewport notes per flow, screenshots if practical.
- Update `TODO.md` to close the mobile QA item.
- If regressions found: file them as new TODOs rather than fixing inline (forbids scope creep mid-QA).

**Effort:** S. ~30 min walk-through if no surprises.

---

### Followup-E — `refactor(hooks): enable eslint-plugin-react-hooks 7` (F6, deferred — needs triage)

The v7 ruleset flags 27 sites. Some are genuine refactor opportunities; some are false positives. Triage before committing scope.

**Pre-work (do BEFORE writing any code):**
1. Bump `eslint-plugin-react-hooks` to 7.1.1 in a scratch branch.
2. Run `pnpm run lint` and capture the 27 violations.
3. Classify each:
   - **Genuine refactor** — useEffect calling setState that could be derived during render, or impure-function calls that should move out of render.
   - **Legitimate pattern** — `performance.now()` for timing, sync-from-external-state effects, etc. Mark for `eslint-disable-next-line` with a one-line rationale.
   - **Unclear** — flag for design review.
4. Report counts per bucket; come back with a scope estimate.

**Why deferred:** Without the triage, this could be 50 LOC or 500 LOC. Plan can't reasonably commit before knowing.

**Effort:** TBD. Could be S (mostly disable-comments) or L (real refactor of effect-driven derived state).

---

### Followup-F — `style(css): migrate tailwind.config.js to @theme blocks` (F7, deferred — cosmetic)

Tailwind 4 prefers tokens defined in CSS via `@theme` blocks rather than a JS config. The current `@config "../tailwind.config.js"` directive works fine, so this is ergonomic, not functional.

**Scope:**
- Port `tailwind.config.js` (~180 lines: colors, fontFamily, fontSize, borderRadius, boxShadow, transitionDuration, transitionTimingFunction, animation, keyframes, backgroundImage, backgroundSize) into `@theme` blocks in `src/index.css`.
- Delete `tailwind.config.js` and `@config` directive.
- Verify visual parity at all viewports.

**Why deferred:** Cosmetic. Worth doing when the design system gets touched anyway; not worth a dedicated cycle.

**Effort:** L. 180-line careful port plus full visual smoke.

---

## Ordered checklist

- [ ] Followup-A: TODO refresh + husky pnpm exec (F1 + F3, single commit)
- [ ] Followup-B: drop autoprefixer if redundant (F2)
- [ ] Followup-C: Playwright E2E (F4)
- [ ] Followup-D: Mobile QA sign-off (F5)
- [ ] Followup-E: react-hooks 7 triage (F6 pre-work; commit-or-defer decision after)
- [ ] Followup-F: tailwind native `@theme` (F7, when design system is touched)

# Mobile Viewport QA Sign-Off — 2026-05-17

## Scope

Verify the 2026-05-16 mobile fix (commit `92cea7f`, "stack two- and three-col forms on phone widths") in real viewport conditions and smoke the visual side of the 2026-05-17 dep-bump pass (`3e78681`: tailwindcss 3→4, recharts 2→3).

> The original TODO referenced commit `7269ee1` — that hash doesn't exist in this repo. The actual mobile commit is `92cea7f` per `git log --oneline -S 'grid-cols-1 sm:grid-cols-2'`.

## Method

Rather than a manual DevTools walk-through, the QA is captured as an automated Playwright spec at `odetoerlang/e2e/mobile-viewports.spec.ts`. This converts a one-time sign-off into a permanent regression check that runs in CI on every PR.

Three viewports per the original plan:
- 360 × 640 — small Android phone (Galaxy S8-class)
- 390 × 844 — iPhone 14 / 15 standard
- 768 × 1024 — iPad portrait (desktop layout should engage here)

Two flows per viewport:
1. **Landing**: app loads, `Open advanced planner` button visible, no DB error banner, no horizontal overflow.
2. **Advanced calculator**: click into advanced, fill volume + AHT, assert Results heading renders, no DB error, no horizontal overflow.

## Results

| Viewport | Landing | Advanced calculator |
|---|---|---|
| 360 × 640 | ✅ pass | ❌ **header + tab nav overflow to 417px** |
| 390 × 844 | ✅ pass | ❌ **header + tab nav overflow to 417px** |
| 768 × 1024 | ✅ pass | ✅ pass |

### Findings

**The 2026-05-16 form-stacking commit fixed forms but missed two chrome elements:**

1. **Header toolbar** (`Simple` / `Advanced` / `MATH MODEL` / theme toggle button + label) — laid out as a `flex items-center space-x-3 sm:space-x-4` row in the banner; intrinsic width is ~417px, no breakpoint collapse below `sm`.
2. **Tab navigation** (`📊 Command` / `🧮 Calculator` / `📈 Analytics` / `👥 Planning` / `📥 Data` / `🧪 Lab`) — buttons use `whitespace-nowrap` with no horizontal scroll container; total row width is ~570px, no breakpoint collapse.

Both fail at 360px and 390px; both pass at 768px (where desktop layout has room).

**Forms (the original commit's target) all pass** at every viewport. Tabs that the user has reached on mobile via direct deep link will render; only the navigation chrome to reach them is broken.

**No tailwind 4 visual regressions detected** — custom utilities (`bg-bg-base`, `text-text-primary`, `bg-cyan`, `shadow-glow-cyan`) all resolve correctly. The `@config` directive preserves the existing token system.

**No recharts 3 visual regressions detected** in the calculator flow (the spec doesn't exercise dashboard charts deeply — recommend a follow-up spec for `/dashboard` to cover that surface).

### Follow-up TODOs

Added to `TODO.md`:

- Header toolbar `flex` row needs `flex-wrap` or a small-viewport collapse pattern at <640px.
- Tab navigation needs `overflow-x-auto` on its parent container at <640px.

Both are scoped to `src/App.tsx` (header banner + main tablist). The Playwright spec at `e2e/mobile-viewports.spec.ts` uses `test.fail()` for the two failing mobile cases — when the chrome is fixed, the test will flip to "unexpected pass" and CI will alert.

## Sign-off

- ✅ DB initializes correctly under all 3 viewports (Followup-C confirmed the wasm fix).
- ✅ Forms stack as designed at all viewports.
- ✅ Tailwind 4 and recharts 3 produce no visible regression in the calculator flow.
- ❌ Header toolbar and tab nav overflow at phone widths — tracked as `test.fail()` in spec, queued in TODO.

Closing the original mobile QA item; opening two follow-ups for the chrome regressions.

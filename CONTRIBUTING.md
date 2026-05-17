# Contributing to OdeToErlangAndBromley

We welcome contributions! Here is how to get started.

## 🛠️ Development Setup

1.  **Clone:** `git clone ...`
2.  **Install:** `pnpm install` (Node 18+, pnpm 10+)
3.  **Dev Server:** `pnpm dev` (http://localhost:5173)
4.  **Test:** `pnpm test`

## 🔄 Workflow

1.  **Branch:** Create a feature branch (`feature/my-feature` or `fix/my-bug`).
2.  **Code:** Write clean, typed code.
3.  **Verify:** Run `pnpm build` and `pnpm test` **before** committing.
4.  **Commit:** Use conventional commits (e.g., `feat: add erlang b model`).
5.  **PR:** Open a Pull Request against `main`.

## 📏 Standards

### TypeScript
-   **Strictness:** No `any`. All types defined in `src/types/` or local interfaces.
-   **Strict flags on:** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are enabled in `tsconfig.app.json`. Indexed array reads (`arr[i]`) return `T | undefined`; either guard with a length check, use `?? fallback`, or assert with `arr[i]!` when the index is provably in-bounds. Optional properties cannot be assigned `undefined` — leave the key off or widen the type to `T | undefined`.
-   **Naming:** `PascalCase` for components, `camelCase` for functions.
-   **State:** Use Zustand for global state (`src/store/`), React state for local.

### Mathematical Accuracy
-   **Validation:** New formulas MUST be validated against published tables or academic papers.
-   **Tests:** Add unit tests in `src/lib/calculations/*.test.ts`.
-   **Documentation:** Update `docs/FORMULAS.md` if you change the math.

### Database
-   **Schema:** Modify `src/lib/database/schema.sql` and bump `CURRENT_SCHEMA_VERSION` in `initDatabase.ts`.
-   **Access:** Use the per-domain modules under `src/lib/database/dataAccess/` (re-exported via `dataAccess.ts`). **Do not** write raw SQL in UI components. Shared helpers (`execToArray`, `getScalar`, `buildUpdateClause`) live in `dataAccess/_shared.ts`.

## 🧪 CI/CD
Every PR runs:
-   Linting (`eslint`)
-   Type Checking (`tsc`)
-   Unit Tests (`vitest`)
-   Build (`vite build`)

**Rule:** Never merge a broken build.
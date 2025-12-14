# Contributing to OdeToErlangAndBromley

We welcome contributions! Here is how to get started.

## 🛠️ Development Setup

1.  **Clone:** `git clone ...`
2.  **Install:** `npm install` (Node 18+)
3.  **Dev Server:** `npm run dev` (http://localhost:5173)
4.  **Test:** `npm test`

## 🔄 Workflow

1.  **Branch:** Create a feature branch (`feature/my-feature` or `fix/my-bug`).
2.  **Code:** Write clean, typed code.
3.  **Verify:** Run `npm run build` and `npm test` **before** committing.
4.  **Commit:** Use conventional commits (e.g., `feat: add erlang b model`).
5.  **PR:** Open a Pull Request against `main`.

## 📏 Standards

### TypeScript
-   **Strictness:** No `any`. All types defined in `src/types/` or local interfaces.
-   **Naming:** `PascalCase` for components, `camelCase` for functions.
-   **State:** Use Zustand for global state (`src/store/`), React state for local.

### Mathematical Accuracy
-   **Validation:** New formulas MUST be validated against published tables or academic papers.
-   **Tests:** Add unit tests in `src/lib/calculations/*.test.ts`.
-   **Documentation:** Update `docs/FORMULAS.md` if you change the math.

### Database
-   **Schema:** Modify `src/lib/database/schema.sql`.
-   **Access:** Use `src/lib/database/dataAccess.ts` wrappers. **Do not** write raw SQL in UI components.

## 🧪 CI/CD
Every PR runs:
-   Linting (`eslint`)
-   Type Checking (`tsc`)
-   Unit Tests (`vitest`)
-   Build (`vite build`)

**Rule:** Never merge a broken build.
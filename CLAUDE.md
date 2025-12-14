# CLAUDE.md - Quick Context

Contact center calculator (React/TS/Vite) with Erlang B/C/A math. Browser-only (sql.js + IndexedDB). App lives in `odetoerlang/`.

Essentials:
- Keep math correct; run tests (`npm test`) after changes.
- DB schema: `src/lib/database/schema.sql`; bump version in `initDatabase.ts` when changing schema.
- Main logic: `src/lib/calculations/erlangEngine.ts`; state: `src/store/`.

AI helper notes: read before edit, avoid over-engineering, keep docs lean. Tests are required for functional changes. No emojis.

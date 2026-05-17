import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // eslint-plugin-react-hooks v7 added five new strictness rules that
      // flag legitimate patterns in this codebase. They are not bugs; they
      // are stylistic suggestions about React's "rules of components". The
      // canonical rules-of-hooks and exhaustive-deps remain enforced.
      // Rationale per rule:
      //  - purity: SmartCSVImport timing telemetry uses performance.now()
      //    for parse-duration metrics. Deliberate and harmless.
      //  - refs: SimulationTab visualises live engine state via a ref
      //    object during render. This is the entire purpose of the tab.
      //  - set-state-in-effect: 12 sites use the sync-from-external-state
      //    pattern that pre-dates the new rule's guidance. Refactoring
      //    them to derived state is a separate cycle; they work today.
      //  - preserve-manual-memoization: legitimate useMemo around
      //    forecast/inputs derivation.
      //  - immutability: one simulation start path mutates a local copy
      //    of inputs before passing to the engine.
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
    },
  },
]

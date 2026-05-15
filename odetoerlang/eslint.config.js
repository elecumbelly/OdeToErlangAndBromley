import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

// Demote every `error` rule to `warn`, but keep explicit `off` rules off.
function softenA11yRulesToWarn(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([rule, severity]) => [
      rule,
      severity === 'off' ? 'off' : 'warn',
    ]),
  );
}

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
      // Start a11y rules at `warn` so existing components surface issues
      // without blocking CI. New code added under Phase 5+ should aim to
      // produce zero warnings. Promote to `error` once the existing surface
      // is swept (see TODO list / Phase 6 scope).
      ...softenA11yRulesToWarn(jsxA11y.flatConfigs.recommended.rules),
    },
  },
]

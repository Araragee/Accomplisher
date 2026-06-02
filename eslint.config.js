import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Data-driven app: loading state from async DB reads in effects is the
      // intended pattern here. Keep as a hint, not a hard failure.
      'react-hooks/set-state-in-effect': 'warn',
      // Providers are colocated with their hook (useApp, useToast, useConfirm).
      // A widely accepted pattern; fast-refresh granularity is a non-issue.
      'react-refresh/only-export-components': 'warn',
    },
  },
])

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import noHardcodedColors from './eslint-rules/no-hardcoded-colors.js'

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
  },
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { reciprocal: { rules: { 'no-hardcoded-colors': noHardcodedColors } } },
    rules: { 'reciprocal/no-hardcoded-colors': 'error' },
  },
  {
    files: ['src/components/ui/button.jsx', 'src/components/ui/badge.jsx'],
    rules: {
      // Preserve shadcn's public CVA exports without relaxing other files.
      'react-refresh/only-export-components': ['error', {
        allowConstantExport: true,
        allowExportNames: ['buttonVariants', 'badgeVariants'],
      }],
    },
  },
])

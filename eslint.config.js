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
<<<<<<< HEAD
      reactHooks.configs.flat.recommended,
=======
      reactHooks.configs['recommended-latest'],
>>>>>>> e96f3ccaca6b33969908730f936a61e0b7a9c798
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
<<<<<<< HEAD
      globals: {
        ...globals.browser,
      },
=======
      globals: globals.browser,
>>>>>>> e96f3ccaca6b33969908730f936a61e0b7a9c798
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])

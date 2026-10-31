import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '.yarn/**',
      'apps/api/drizzle/**',
      'apps/api/src/db/schema.ts',
      'apps/web/src/components/ui/**',
      'apps/web/screenshots/**',
      'apps/web/e2e/.auth/**',
      'apps/web/playwright-report/**',
      'apps/web/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX, 'unused-imports': unusedImports },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-console': ['error', { allow: ['info', 'error', 'warn'] }],
      'import-x/no-duplicates': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    extends: [jsxA11y.flatConfigs.recommended],
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  {
    files: ['apps/api/**/*.test.ts', 'apps/web/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: vitest.configs.recommended.rules,
  },
  { files: ['apps/web/e2e/**/*.ts'], ...playwright.configs['flat/recommended'] },
  {
    files: ['apps/api/src/db/migrate.ts', 'apps/api/src/db/seed.ts', 'apps/api/scripts/**'],
    rules: { 'no-console': 'off' },
  },
  prettier,
);

// ESLint flat config (ESLint v10+)
//
// Scope: src/modules only (pure TypeScript business logic — no React components).
//
// Uses typescript-eslint (already a transitive dep of eslint-config-next@16.2.6)
// instead of nextCoreWebVitals for module linting. This avoids the
// scopeManager.addGlobals TypeError that occurs when eslint-config-next
// declares React/browser globals on a standalone app setup (the same reason
// open-mercato/open-mercato CI excludes @open-mercato/app from linting).
//
// Pattern: open-mercato/open-mercato eslint.config.mjs (packages, not app)
// Docs: https://typescript-eslint.io/getting-started/

import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Recommended TypeScript rules (no React/browser globals → no addGlobals call)
  ...tseslint.configs.recommended,

  // Only lint the pure TypeScript module layer.
  {
    name: 'project/files',
    files: ['src/modules/**/*.ts'],
  },

  // Always-ignored paths (mirrors open-mercato/open-mercato eslint.config.mjs).
  {
    name: 'project/ignores',
    ignores: [
      'node_modules/**',
      '.next/**',
      '.mercato/**',
      'dist/**',
      'generated/**',
      'next-env.d.ts',
    ],
  },

  // Project-specific rule overrides.
  {
    name: 'project/rule-overrides',
    rules: {
      // Allow intentionally unused variables prefixed with _ (common TS pattern)
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Entity files use `any` for MikroORM compatibility — acceptable
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)

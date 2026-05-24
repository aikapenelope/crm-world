// ESLint flat config (ESLint v10+)
//
// Scope: src/modules/**/*.ts only (pure TypeScript business logic).
//        Excludes .tsx files (Next.js/React pages) and the app layer.
//
// Uses typescript-eslint (transitive dep of eslint-config-next@16.2.6).
// Avoids the scopeManager.addGlobals TypeError that occurs when using
// nextCoreWebVitals on this standalone app setup (same reason the upstream
// open-mercato/open-mercato CI excludes @open-mercato/app from linting).
//
// Pattern: open-mercato/open-mercato eslint.config.mjs (packages, not app)
// Docs: https://typescript-eslint.io/getting-started/

import tseslint from 'typescript-eslint'

const TARGET_FILES = ['src/modules/**/*.ts']

export default tseslint.config(
  // Apply typescript-eslint recommended rules ONLY to target files.
  // Spreading all recommended entries with an explicit `files` override
  // prevents these rules from running on .tsx components, scripts, etc.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: TARGET_FILES,
  })),

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

  // Project-specific overrides for existing codebase patterns.
  {
    name: 'project/rule-overrides',
    files: TARGET_FILES,
    rules: {
      // @ts-ignore is used in several modules; @ts-expect-error migration is
      // tracked separately. Downgrade from error to warn to not block CI.
      '@typescript-eslint/ban-ts-comment': 'warn',

      // Standalone app uses any for MikroORM dynamic field maps; downgrade.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow intentionally unused variables prefixed with _
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // Ternary expressions used for side-effects are a common pattern in
      // Map/Set operations (e.g. next.has(id) ? next.delete(id) : next.add(id))
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowTernary: true,
        allowShortCircuit: true,
      }],
    },
  },
)

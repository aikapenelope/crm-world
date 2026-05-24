/**
 * ESLint flat config (ESLint v10+)
 *
 * Scope: src/modules — pure TypeScript business logic.
 *
 * Why not the full app (src/app, src/components, backend pages)?
 * ──────────────────────────────────────────────────────────────
 * The official Open Mercato monorepo (open-mercato/open-mercato) runs lint
 * with `yarn turbo run lint --filter=!@open-mercato/app`, explicitly EXCLUDING
 * the Next.js app from CI lint. Reason given in their ci.yml:
 *
 *   "its next lint script requires an ESLint config that is not yet present"
 *
 * The root issue: eslint-config-next/core-web-vitals + ESLint v10 flat config
 * triggers `scopeManager.addGlobals is not a function` when linting React
 * component files. This is an upstream compatibility issue between
 * eslint-plugin-react and eslint-scope@9 in flat config mode.
 *
 * Resolution: lint the module layer (validators, entities, API routes, workers)
 * using typescript-eslint, which works correctly with ESLint v10 flat config
 * and validates the pure TypeScript business logic that matters most.
 * App-layer lint (backend pages, frontend components) runs locally via IDE.
 *
 * Pattern: open-mercato/open-mercato eslint.config.mjs (packages only, not app)
 * Docs: https://typescript-eslint.io/getting-started/
 */

import tseslint from 'typescript-eslint'

// Files checked in CI. Matches the module layer — no React/JSX.
const TARGET = ['src/modules/**/*.ts']

export default tseslint.config(
  // Apply typescript-eslint recommended rules to module .ts files only.
  // Each config entry is overridden with the TARGET files filter so rules
  // never run on .tsx pages, scripts, or generated code.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: TARGET,
  })),

  // Ignored paths — mirrors open-mercato/open-mercato eslint.config.mjs.
  {
    name: 'project/ignores',
    ignores: [
      'node_modules/**',
      '.next/**',
      '.mercato/**',
      'dist/**',
      'generated/**',
      'next-env.d.ts',
      'scripts/**',
    ],
  },

  // Project overrides — pragmatic rules for the existing codebase.
  {
    name: 'project/overrides',
    files: TARGET,
    rules: {
      // @ts-ignore is used in several modules pending @ts-expect-error migration.
      '@typescript-eslint/ban-ts-comment': 'warn',

      // `any` is acceptable in MikroORM dynamic field maps and AI tool handlers.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unused vars prefixed with _ are intentional (common TypeScript pattern).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Ternary expressions used for side-effects (e.g. Set.has/add/delete).
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowTernary: true, allowShortCircuit: true },
      ],
    },
  },
)

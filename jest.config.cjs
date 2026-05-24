/**
 * Jest configuration for crm-world unit tests.
 *
 * Strategy: scripts/jest-mikroorm-transformer.cjs (copied from open-mercato/open-mercato)
 * sanitizes `import.meta` usages in @mikro-orm v7 (ESM-only) before delegating
 * to ts-jest, which emits CommonJS for Jest's native CJS runner.
 *
 * Why the custom transformer?
 *   MikroORM v7 is ESM-only and calls `import.meta.resolve(pkg)` at runtime.
 *   When Jest loads these files as CJS, Node throws:
 *     "Cannot use 'import.meta' outside a module"
 *   The transformer replaces import.meta.* with CJS-compatible stubs.
 *
 * Scope:     src/modules/**/__tests__/**/*.spec.ts
 * Skip:      __integration__/ (Playwright, run via `yarn test:integration:ephemeral`)
 *
 * References:
 *   open-mercato/open-mercato scripts/jest-mikroorm-transformer.cjs
 *   open-mercato/open-mercato apps/mercato/jest.config.cjs (transformIgnorePatterns)
 *   https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
 *   https://jestjs.io/docs/configuration
 *   https://mikro-orm.io/docs/installation (reflect-metadata requirement)
 */

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Unit tests only — Playwright integration tests live in __integration__ folders
  // and are run via `yarn test:integration:ephemeral` (mercato CLI).
  testMatch: ['**/src/**/__tests__/**/*.spec.ts'],

  // MikroORM decorators require reflect-metadata to be loaded before any module
  // that uses @Entity / @Property / @Enum decorators.
  // See: https://mikro-orm.io/docs/installation
  setupFiles: ['reflect-metadata'],

  // Use the OM's sanitizing transformer instead of plain ts-jest.
  // It strips import.meta.* from @mikro-orm before ts-jest processes the file.
  // Config mirrors open-mercato/open-mercato apps/mercato/jest.config.cjs.
  transform: {
    '^.+\\.(t|j)sx?$': [
      '<rootDir>/scripts/jest-mikroorm-transformer.cjs',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          strict: true,
          target: 'ES2022',
          skipLibCheck: true,
          verbatimModuleSyntax: false,
          // Suppress path-alias resolution warnings that only apply in the
          // Next.js/Turbopack bundler context (not relevant for unit tests).
          // ignoreCodes handled via diagnostics below in the transformer.
        },
      },
    ],
  },

  // Map the @/* path alias from tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform @open-mercato (ESM-only dist) AND @mikro-orm (ESM-only + import.meta).
  // Pattern: open-mercato/open-mercato apps/mercato/jest.config.cjs transformIgnorePatterns.
  // All other node_modules are loaded as-is (they ship CJS).
  transformIgnorePatterns: [
    'node_modules/(?!(@open-mercato|@mikro-orm)/)',
    '\\.pnp\\.[^\\/]+$',
  ],

  // Show individual test names in output
  verbose: true,

  // Coverage: run with `yarn test --coverage`
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    '!src/modules/**/__tests__/**',
    '!src/modules/**/__integration__/**',
    '!src/modules/**/data/entities.ts',
    '!src/modules/**/backend/**',
    '!src/modules/**/frontend/**',
    '!src/modules/**/i18n/**',
    '!src/modules/**/index.ts',
    '!src/modules/**/di.ts',
    '!src/modules/**/acl.ts',
    '!src/modules/**/setup.ts',
    '!src/modules/**/events.ts',
    '!src/modules/**/notifications.ts',
    '!src/modules/**/search.ts',
  ],

  // Note: 'coverageThreshold' (singular) — Jest config key name.
  // Thresholds will be enforced once the test suite covers all modules.
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

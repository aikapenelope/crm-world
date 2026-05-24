/**
 * Jest configuration for crm-world unit tests.
 *
 * Transformer: scripts/jest-mikroorm-transformer.cjs (verbatim copy from
 * open-mercato/open-mercato scripts/jest-mikroorm-transformer.cjs).
 * MikroORM v7 is ESM-only and uses import.meta at runtime; the transformer
 * replaces import.meta.* with CJS stubs before ts-jest compiles.
 *
 * Scope: src/modules/** in __tests__ folders.
 * Integration (Playwright): configured separately in .ai/qa/tests/playwright.config.ts
 *
 * References:
 * - open-mercato/open-mercato scripts/jest-mikroorm-transformer.cjs
 * - open-mercato/open-mercato apps/mercato/jest.config.cjs
 * - ts-jest CJS preset: https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
 * - Jest config docs:   https://jestjs.io/docs/configuration
 * - reflect-metadata:   https://www.npmjs.com/package/reflect-metadata
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

  // Use the OM sanitizing transformer. It strips import.meta.* from @mikro-orm
  // before ts-jest emits CJS. Config mirrors:
  // open-mercato/open-mercato apps/mercato/jest.config.cjs
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
        },
      },
    ],
  },

  // Map the @/* path alias from tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform @open-mercato (ESM dist) AND @mikro-orm (ESM + import.meta).
  // Pattern from open-mercato/open-mercato apps/mercato/jest.config.cjs.
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

  // coverageThreshold (singular) — correct Jest config key.
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

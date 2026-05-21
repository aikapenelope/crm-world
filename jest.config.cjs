/**
 * Jest configuration for crm-world unit tests.
 *
 * Strategy: ts-jest compiles TypeScript → CommonJS for Jest's native CJS runner.
 * This avoids `--experimental-vm-modules` while still validating all pure-logic
 * modules against their real TypeScript types.
 *
 * Scope: `src/modules/**\/__tests__\/**\/*.spec.ts`
 * Integration (Playwright): configured separately in `.ai/qa/tests/playwright.config.ts`
 *
 * References:
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

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        // Override tsconfig for tests: CJS output so Jest can run natively.
        // The main app uses "module: esnext" (Next.js/Turbopack), but Jest needs CJS.
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
        diagnostics: {
          // Suppress path-alias resolution warnings that only apply in the
          // Next.js/Turbopack bundler context (not relevant for unit tests).
          ignoreCodes: ['TS151001'],
        },
      },
    ],
  },

  // Map the @/* path alias from tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Allow ts-jest to transform @open-mercato packages that ship only ESM.
  // Add further package names here as needed (comma-separated in the negative lookahead).
  transformIgnorePatterns: [
    'node_modules/(?!(@open-mercato)/)',
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

  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

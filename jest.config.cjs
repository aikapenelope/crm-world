/**
 * Jest configuration for crm-world — standalone Open Mercato application.
 *
 * Design follows open-mercato/open-mercato apps/mercato/jest.config.cjs.
 *
 * Key decisions
 * ─────────────
 * Transformer: scripts/jest-mikroorm-transformer.cjs
 *   MikroORM v7 is ESM-only and uses `import.meta.*` at runtime. The transformer
 *   patches those calls to CJS-compatible stubs before delegating to ts-jest.
 *   Source: open-mercato/open-mercato scripts/jest-mikroorm-transformer.cjs
 *
 * testMatch: src/modules/**\/__tests__\/**\/*.spec.ts
 *   Unit tests live next to the module code they test.
 *   Integration tests (.spec.ts under __integration__/) run via Playwright.
 *
 * transformIgnorePatterns: allow ts-jest to compile @mikro-orm and @open-mercato.
 *   @mikro-orm — ESM-only, needs CJS shim for import.meta.
 *   @open-mercato — packages are transpilePackages in next.config.ts and may
 *                   ship TypeScript source alongside their dist/ build.
 *
 * moduleNameMapper: maps @/* to src/ (matching tsconfig.json paths).
 *   @open-mercato/* packages resolve from node_modules (installed dist/);
 *   no monorepo source-mapping needed in a standalone app.
 *
 * setupFiles: jest.setup.ts  — injects env vars before any module is imported.
 * passWithNoTests: true       — CI does not fail when a new module has no tests yet.
 *
 * References
 * ──────────
 * open-mercato/open-mercato  apps/mercato/jest.config.cjs
 * open-mercato/open-mercato  scripts/jest-mikroorm-transformer.cjs
 * https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Do not use watchman — not available in CI and slow on large repos.
  watchman: false,

  rootDir: '.',

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // ── Path aliases ─────────────────────────────────────────────────────────
  moduleNameMapper: {
    // Mirror tsconfig.json paths so imports resolve the same way in tests.
    '^@/\\.mercato/generated/(.*)$': '<rootDir>/.mercato/generated/$1',
    '^@/\\.mercato/(.*)$':           '<rootDir>/.mercato/$1',
    '^@/(.*)$':                       '<rootDir>/src/$1',
  },

  // ── Transformer ──────────────────────────────────────────────────────────
  // Use the MikroORM-aware transformer (copied verbatim from the OM monorepo).
  // It sanitises import.meta.* before ts-jest compiles to CJS.
  transform: {
    '^.+\\.(t|j)sx?$': [
      '<rootDir>/scripts/jest-mikroorm-transformer.cjs',
      {
        tsconfig: {
          // CJS output — Jest's native runner does not support ESM.
          module: 'commonjs',
          moduleResolution: 'node',
          target: 'ES2022',
          jsx: 'react-jsx',
          allowJs: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          // Decorators are needed for MikroORM entities in test files.
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          strict: true,
          skipLibCheck: true,
          verbatimModuleSyntax: false,
          // Suppress the ts-jest path-alias warning that only applies in the
          // Next.js bundler context; irrelevant for unit tests.
          ignoreDeprecations: '6.0',
        },
      },
    ],
  },

  // ── Transform scope ───────────────────────────────────────────────────────
  // Compile node_modules that ship ESM or use import.meta:
  //   @mikro-orm  — ESM-only with import.meta.resolve()
  //   @open-mercato — may ship TypeScript source via transpilePackages
  // Everything else in node_modules is loaded as-is (ships CJS).
  // Pattern mirrors open-mercato/open-mercato apps/mercato/jest.config.cjs.
  transformIgnorePatterns: [
    '/node_modules/(?!(@mikro-orm|@open-mercato)/)',
    '\\.pnp\\.[^\\/]+$',
  ],

  // ── Test discovery ────────────────────────────────────────────────────────
  // Unit tests: src/modules/<module>/__tests__/*.spec.ts
  // Integration tests (__integration__/) run via Playwright, not Jest.
  testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.ts'],

  // ── Setup ─────────────────────────────────────────────────────────────────
  // Inject env vars (JWT_SECRET, DATABASE_URL) before any module loads.
  // MikroORM decorators need reflect-metadata before @Entity classes are parsed.
  setupFiles: ['<rootDir>/jest.setup.ts', 'reflect-metadata'],

  // ── Output ────────────────────────────────────────────────────────────────
  verbose: true,

  // Do not fail a CI run when a module has no tests yet — the suite grows
  // incrementally alongside modules.
  passWithNoTests: true,

  // ── Coverage (opt-in) ─────────────────────────────────────────────────────
  // Run `yarn test --coverage` locally to see coverage.
  // Coverage is NOT enforced in CI yet — threshold activates once the suite
  // has enough coverage across all modules.
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    '!src/modules/**/__tests__/**',
    '!src/modules/**/__integration__/**',
    // Boilerplate files — tested implicitly, not worth direct coverage.
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
}

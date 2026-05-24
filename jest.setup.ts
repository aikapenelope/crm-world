/**
 * Jest global setup — env vars required by @open-mercato modules at import time.
 *
 * Pattern: open-mercato/open-mercato jest.setup.ts
 *
 * NOTE: Bootstrap (mercato generate output) is NOT called here because
 * modules.generated.ts eagerly loads all UI components with ESM dependencies
 * that Jest cannot parse. Tests that need the DI container must bootstrap
 * explicitly in their own beforeAll().
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/mercato_test'

/**
 * ratelimit_probe — Rate-limit test module.
 *
 * Provides a single unauthenticated POST endpoint used by integration tests
 * to verify that per-route rate-limit metadata is enforced correctly.
 * This module is NOT enabled in production deployments.
 *
 * Reference: https://docs.open-mercato.dev/framework/modules/overview
 */
import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'ratelimit_probe',
  title: 'Rate Limit Probe',
  version: '0.1.0',
  description: 'Test-only module — single POST /api/ratelimit-probe/ping endpoint for integration tests.',
}

export default metadata

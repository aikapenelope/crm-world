/**
 * ratelimit_probe DI registrations.
 *
 * This module does not register any DI services, but the Open Mercato
 * generator requires every @app module to export a `register` function
 * from `di.ts`.
 *
 * Reference: PATTERNS.md §13 — di.ts DEBE exportar `register`
 */
import type { AppContainer } from '@open-mercato/shared/lib/di/container'

export function register(_: AppContainer) {
  // No services registered for ratelimit_probe.
}

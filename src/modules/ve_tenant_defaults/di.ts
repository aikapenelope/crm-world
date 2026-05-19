import type { AppContainer } from '@open-mercato/shared/lib/di/container'

export function register(_: AppContainer) {
  // No additional DI registrations needed.
  // Tax configuration uses the existing sales taxCalculationService.
  // IGTF hook is registered via the subscriber pattern (subscribers/igtf-hook.ts).
}

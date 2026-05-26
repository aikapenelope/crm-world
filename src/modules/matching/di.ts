import { asFunction } from 'awilix'
import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { EntityManager } from '@mikro-orm/core'
import { ScoringEngine } from './services/scoring'

// Awilix cradle type for matching module services
type MatchingCradle = {
  em: EntityManager
}

export function register(container: AppContainer) {
  container.register({
    // Lazy per-request factory following OM DI pattern (PATTERNS.md §13).
    // Use asFunction with .scoped() so it is created once per HTTP request
    // and resolves the EntityManager from the Awilix cradle.
    scoringEngine: asFunction(
      ({ em }: MatchingCradle) => new ScoringEngine(em)
    ).scoped(),
  })
}

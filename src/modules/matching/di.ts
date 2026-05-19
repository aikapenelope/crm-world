import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { EntityManager } from '@mikro-orm/core'
import { ScoringEngine } from './services/scoring'

export function register(container: AppContainer) {
  container.register({
    scoringEngine: {
      resolve: (c) => {
        const em = c.resolve<EntityManager>('em')
        return new ScoringEngine(em)
      },
    },
  })
}

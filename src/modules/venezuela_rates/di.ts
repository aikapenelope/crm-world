import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { EntityManager } from '@mikro-orm/core'
import { RateFetchingService } from '@open-mercato/core/modules/currencies/services/rateFetchingService'
import { BCVProvider } from './services/providers/bcv'
import { BinanceP2PProvider } from './services/providers/binance'

/**
 * Registers Venezuelan rate providers into the existing RateFetchingService.
 * This extends the core currencies module without modifying it.
 */
export function register(container: AppContainer) {
  // Override the rateFetchingService to add Venezuelan providers
  container.register({
    rateFetchingService: {
      resolve: (c) => {
        const em = c.resolve<EntityManager>('em')
        const service = new RateFetchingService(em)

        // Register Venezuelan providers
        service.registerProvider(new BCVProvider())
        service.registerProvider(new BinanceP2PProvider())

        return service
      },
    },
  })
}

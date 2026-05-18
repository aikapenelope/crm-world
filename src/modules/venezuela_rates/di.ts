import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { EntityManager } from '@mikro-orm/core'
import { RateFetchingService } from '@open-mercato/core/modules/currencies/services/rateFetchingService'
import { DolarApiProvider } from './services/providers/dolarapi'

/**
 * Registers the DolarApi Venezuela provider into the RateFetchingService.
 * Single provider that covers BCV official + parallel (Binance P2P) rates
 * for USD/VES, EUR/VES, and USDT/VES.
 *
 * API: https://ve.dolarapi.com/v1
 */
export function register(container: AppContainer) {
  container.register({
    rateFetchingService: {
      resolve: (c) => {
        const em = c.resolve<EntityManager>('em')
        const service = new RateFetchingService(em)

        // Single provider covers all Venezuelan rates
        service.registerProvider(new DolarApiProvider())

        return service
      },
    },
  })
}

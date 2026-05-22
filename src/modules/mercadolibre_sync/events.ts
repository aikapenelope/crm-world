/**
 * MercadoLibre Sync — Event definitions
 *
 * Este módulo emite eventos de ciclo de vida de sincronización.
 * Son eventos de sistema (no tenant-scoped) porque MercadoLibre
 * es una fuente de datos pública compartida entre todos los tenants.
 *
 * Otros módulos pueden suscribirse para invalidar caché de
 * market intelligence, actualizar métricas, o disparar alertas.
 *
 * Fuente del patrón: packages/core/src/modules/shipping_carriers/events.ts
 */
import { createModuleEvents } from '@open-mercato/shared/modules/events'

const events = [
  {
    id: 'mercadolibre_sync.sync.completed',
    label: 'MercadoLibre sync completed',
    entity: 'listing',
    category: 'lifecycle',
  },
  {
    id: 'mercadolibre_sync.sync.failed',
    label: 'MercadoLibre sync failed',
    entity: 'listing',
    category: 'lifecycle',
  },
] as const

export const eventsConfig = createModuleEvents({ moduleId: 'mercadolibre_sync', events })
export default eventsConfig

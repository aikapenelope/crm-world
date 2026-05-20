import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_pricing',
  events: [
    { id: 'retail_pricing.bulk_update.executed', label: 'Actualización masiva ejecutada', entity: 'update', category: 'lifecycle' },
    { id: 'retail_pricing.alert.below_cost', label: 'Precio por debajo del costo', entity: 'alert', category: 'lifecycle' },
    { id: 'retail_pricing.alert.below_margin', label: 'Margen por debajo del mínimo', entity: 'alert', category: 'lifecycle' },
    { id: 'retail_pricing.alert.above_regulated', label: 'Precio sobre regulado', entity: 'alert', category: 'lifecycle' },
  ],
} as const)

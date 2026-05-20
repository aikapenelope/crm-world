import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'dist_inventory',
  events: [
    { id: 'dist_inventory.movement.created', label: 'Movimiento registrado', entity: 'movement', category: 'crud' },
    { id: 'dist_inventory.stock.low', label: 'Stock bajo mínimo', entity: 'item', category: 'lifecycle' },
    { id: 'dist_inventory.stock.adjusted', label: 'Stock ajustado', entity: 'item', category: 'lifecycle' },
  ],
} as const)

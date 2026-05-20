import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_inventory',
  events: [
    { id: 'retail_inventory.count.started', label: 'Conteo iniciado', entity: 'count', category: 'lifecycle' },
    { id: 'retail_inventory.count.completed', label: 'Conteo completado', entity: 'count', category: 'lifecycle' },
    { id: 'retail_inventory.dead_stock.detected', label: 'Dead stock detectado', entity: 'rotation', category: 'lifecycle' },
    { id: 'retail_inventory.rotation.calculated', label: 'Rotación calculada', entity: 'rotation', category: 'lifecycle' },
  ],
} as const)

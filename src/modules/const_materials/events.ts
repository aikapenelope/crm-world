import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_materials',
  events: [
    { id: 'const_materials.order.created', label: 'OC creada', entity: 'order', category: 'crud' },
    { id: 'const_materials.materials.received', label: 'Materiales recibidos', entity: 'stock', category: 'lifecycle' },
    { id: 'const_materials.stock.low', label: 'Material bajo mínimo', entity: 'stock', category: 'lifecycle' },
  ],
} as const)

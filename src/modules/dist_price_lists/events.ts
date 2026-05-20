import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'dist_price_lists',
  events: [
    { id: 'dist_price_lists.list.created', label: 'Lista de precios creada', entity: 'list', category: 'crud' },
    { id: 'dist_price_lists.list.updated', label: 'Lista de precios actualizada', entity: 'list', category: 'crud' },
    { id: 'dist_price_lists.item.updated', label: 'Precio actualizado', entity: 'item', category: 'crud' },
    { id: 'dist_price_lists.assignment.changed', label: 'Asignación de lista cambiada', entity: 'assignment', category: 'lifecycle' },
  ],
} as const)

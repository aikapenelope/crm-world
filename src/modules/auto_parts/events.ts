import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'auto_parts',
  events: [
    { id: 'auto_parts.part.created', label: 'Repuesto registrado', entity: 'part', category: 'crud' },
    { id: 'auto_parts.part.updated', label: 'Repuesto actualizado', entity: 'part', category: 'crud' },
    { id: 'auto_parts.stock.low', label: 'Stock bajo mínimo', entity: 'part', category: 'lifecycle' },
  ],
} as const)

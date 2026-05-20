import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'const_budget',
  events: [
    { id: 'const_budget.item.created', label: 'Partida creada', entity: 'item', category: 'crud' },
    { id: 'const_budget.item.updated', label: 'Partida actualizada', entity: 'item', category: 'crud' },
  ],
} as const)

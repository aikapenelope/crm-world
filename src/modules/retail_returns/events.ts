import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_returns',
  events: [
    { id: 'retail_returns.return.created', label: 'Devolución creada', entity: 'return', category: 'crud' },
    { id: 'retail_returns.return.approved', label: 'Devolución aprobada', entity: 'return', category: 'lifecycle' },
    { id: 'retail_returns.return.completed', label: 'Devolución completada', entity: 'return', category: 'lifecycle' },
    { id: 'retail_returns.credit_note.issued', label: 'Nota de crédito emitida', entity: 'credit_note', category: 'lifecycle' },
  ],
} as const)

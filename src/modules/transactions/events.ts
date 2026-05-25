import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'transactions',
  events: [
    { id: 'transactions.transaction.created',   label: 'Transacción creada',    entity: 'property_transaction', category: 'crud' },
    { id: 'transactions.transaction.completed', label: 'Transacción completada', entity: 'property_transaction', category: 'lifecycle' },
    { id: 'transactions.transaction.cancelled', label: 'Transacción cancelada',  entity: 'property_transaction', category: 'lifecycle' },
  ],
} as const)

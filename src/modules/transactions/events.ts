import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  module: 'transactions',
  events: [
    { id: 'transactions.transaction.created', label: 'Transacción creada', entity: 'property_transaction' },
    { id: 'transactions.transaction.completed', label: 'Transacción completada', entity: 'property_transaction' },
    { id: 'transactions.transaction.cancelled', label: 'Transacción cancelada', entity: 'property_transaction' },
  ],
} as const)

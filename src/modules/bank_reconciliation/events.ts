import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'bank_reconciliation',
  events: [
    { id: 'bank_reconciliation.statement.uploaded', label: 'Extracto cargado', entity: 'statement', category: 'lifecycle' },
    { id: 'bank_reconciliation.transaction.reconciled', label: 'Movimiento conciliado', entity: 'transaction', category: 'lifecycle' },
  ],
} as const)

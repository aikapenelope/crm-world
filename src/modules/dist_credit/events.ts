import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'dist_credit',
  events: [
    { id: 'dist_credit.limit.created', label: 'Límite de crédito creado', entity: 'limit', category: 'crud' },
    { id: 'dist_credit.limit.updated', label: 'Límite de crédito actualizado', entity: 'limit', category: 'crud' },
    { id: 'dist_credit.transaction.created', label: 'Transacción registrada', entity: 'transaction', category: 'crud', clientBroadcast: true },
    // clientBroadcast: credit dashboard reflects account state changes in real-time
    { id: 'dist_credit.account.overdue', label: 'Cuenta vencida', entity: 'account', category: 'lifecycle', clientBroadcast: true },
    { id: 'dist_credit.account.blocked', label: 'Cliente bloqueado por crédito', entity: 'account', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)

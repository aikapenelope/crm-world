import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'academy_payments',
  events: [
    { id: 'academy_payments.payment.confirmed', label: 'Pago confirmado', entity: 'payment', category: 'lifecycle', clientBroadcast: true },
    { id: 'academy_payments.payment.created', label: 'Pago registrado', entity: 'payment', category: 'crud' },
  ],
} as const)

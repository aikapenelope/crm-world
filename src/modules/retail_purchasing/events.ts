import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_purchasing',
  events: [
    { id: 'retail_purchasing.order.created', label: 'Orden de compra creada', entity: 'order', category: 'crud' },
    { id: 'retail_purchasing.order.sent', label: 'Orden enviada a proveedor', entity: 'order', category: 'lifecycle' },
    { id: 'retail_purchasing.order.received', label: 'Mercancía recibida', entity: 'order', category: 'lifecycle' },
    { id: 'retail_purchasing.order.auto_generated', label: 'Orden auto-generada por reorden', entity: 'order', category: 'lifecycle' },
    { id: 'retail_purchasing.payable.created', label: 'Cuenta por pagar creada', entity: 'payable', category: 'crud' },
    { id: 'retail_purchasing.payable.paid', label: 'Cuenta pagada', entity: 'payable', category: 'lifecycle' },
    { id: 'retail_purchasing.payable.overdue', label: 'Cuenta vencida', entity: 'payable', category: 'lifecycle' },
  ],
} as const)

import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'retail_ecommerce',
  events: [
    { id: 'retail_ecommerce.order.created', label: 'Pedido online creado', entity: 'order', category: 'crud' },
    { id: 'retail_ecommerce.order.confirmed', label: 'Pedido confirmado', entity: 'order', category: 'lifecycle' },
    { id: 'retail_ecommerce.order.delivered', label: 'Pedido entregado', entity: 'order', category: 'lifecycle' },
    { id: 'retail_ecommerce.payment.confirmed', label: 'Pago confirmado', entity: 'order', category: 'lifecycle' },
    { id: 'retail_ecommerce.publish.created', label: 'Publicación creada', entity: 'publish', category: 'crud' },
  ],
} as const)

import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'dist_delivery',
  events: [
    { id: 'dist_delivery.order.created', label: 'Despacho creado', entity: 'order', category: 'crud' },
    { id: 'dist_delivery.order.dispatched', label: 'Despacho enviado', entity: 'order', category: 'lifecycle' },
    { id: 'dist_delivery.item.delivered', label: 'Entrega confirmada', entity: 'item', category: 'lifecycle' },
    { id: 'dist_delivery.item.returned', label: 'Devolución registrada', entity: 'item', category: 'lifecycle' },
  ],
} as const)

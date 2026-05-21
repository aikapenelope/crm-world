import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'auto_service_orders',
  events: [
    { id: 'auto_service_orders.order.created', label: 'Orden creada', entity: 'order', category: 'crud' },
    // clientBroadcast: workshop board shows status changes live
    { id: 'auto_service_orders.order.status_changed', label: 'Status cambiado', entity: 'order', category: 'lifecycle', clientBroadcast: true },
    { id: 'auto_service_orders.order.completed', label: 'Orden completada', entity: 'order', category: 'lifecycle', clientBroadcast: true },
    { id: 'auto_service_orders.order.delivered', label: 'Vehículo entregado', entity: 'order', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)

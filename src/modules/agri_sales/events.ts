import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_sales',
  events: [
    { id: 'agri_sales.order.created',     label: 'Orden de venta creada',          entity: 'order',    category: 'crud' },
    { id: 'agri_sales.order.confirmed',   label: 'Orden de venta confirmada',       entity: 'order',    category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_sales.order.dispatched',  label: 'Orden despachada al cliente',     entity: 'order',    category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_sales.dispatch.temp_incident', label: 'Incidente de temperatura en transporte', entity: 'dispatch', category: 'alert', clientBroadcast: true },
    { id: 'agri_sales.invoice.paid',      label: 'Factura pagada',                  entity: 'invoice',  category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_sales.invoice.overdue',   label: 'Factura vencida',                 entity: 'invoice',  category: 'alert',     clientBroadcast: true },
  ],
} as const)

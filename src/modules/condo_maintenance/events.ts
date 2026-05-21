import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'condo_maintenance',
  events: [
    { id: 'condo_maintenance.request.created', label: 'Solicitud creada', entity: 'request', category: 'crud', clientBroadcast: true },
    // clientBroadcast: maintenance kanban board updates live when status changes
    { id: 'condo_maintenance.request.assigned', label: 'Solicitud asignada', entity: 'request', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_maintenance.request.completed', label: 'Solicitud completada', entity: 'request', category: 'lifecycle', clientBroadcast: true },
    { id: 'condo_maintenance.work_order.created', label: 'Orden de trabajo creada', entity: 'work_order', category: 'crud' },
    { id: 'condo_maintenance.work_order.completed', label: 'Orden completada', entity: 'work_order', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)

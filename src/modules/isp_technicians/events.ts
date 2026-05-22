import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'isp_technicians',
  events: [
    { id: 'isp_technicians.work_order.created',    label: 'OT creada',              entity: 'work_order', category: 'crud' },
    { id: 'isp_technicians.work_order.assigned',   label: 'OT asignada a técnico',  entity: 'work_order', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_technicians.work_order.completed',  label: 'OT completada',          entity: 'work_order', category: 'lifecycle', clientBroadcast: true },
    { id: 'isp_technicians.work_order.cancelled',  label: 'OT cancelada',           entity: 'work_order', category: 'lifecycle' },
    { id: 'isp_technicians.installation.done',     label: 'Instalación completada', entity: 'work_order', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)

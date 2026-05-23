import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_orders',
  events: [
    { id: 'mfg_orders.released',          label: 'Orden de producción liberada',            entity: 'order',    category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_orders.started',           label: 'Producción iniciada',                     entity: 'order',    category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_orders.completed',         label: 'Orden de producción completada',           entity: 'order',    category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_orders.cancelled',         label: 'Orden de producción cancelada',            entity: 'order',    category: 'lifecycle' },
    { id: 'mfg_orders.downtime.started',  label: 'Paro de producción iniciado',             entity: 'downtime', category: 'alert',     clientBroadcast: true },
    { id: 'mfg_orders.downtime.ended',    label: 'Paro de producción terminado',            entity: 'downtime', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_orders.operation.started', label: 'Operación iniciada en piso de planta',    entity: 'operation', category: 'crud',     excludeFromTriggers: true },
    { id: 'mfg_orders.operation.completed', label: 'Operación completada',                  entity: 'operation', category: 'crud',     excludeFromTriggers: true },
  ],
} as const)

import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_maintenance',
  events: [
    { id: 'mfg_maintenance.wo.created',          label: 'Orden de trabajo de mantenimiento creada',   entity: 'wo',    category: 'crud',      clientBroadcast: true },
    { id: 'mfg_maintenance.wo.completed',         label: 'Orden de trabajo completada',                entity: 'wo',    category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_maintenance.plan.overdue',         label: 'Mantenimiento preventivo vencido',           entity: 'plan',  category: 'alert',     clientBroadcast: true },
    { id: 'mfg_maintenance.spare_part.low_stock', label: 'Repuesto crítico por debajo del mínimo',     entity: 'part',  category: 'alert',     clientBroadcast: true },
    { id: 'mfg_maintenance.equipment.breakdown',  label: 'Avería reportada en equipo crítico',         entity: 'equip', category: 'alert',     clientBroadcast: true },
  ],
} as const)

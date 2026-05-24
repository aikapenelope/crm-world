import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_field',
  events: [
    { id: 'agri_field.cycle.started',   label: 'Ciclo de cultivo iniciado',  entity: 'cycle',    category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_field.cycle.harvested', label: 'Cosecha completada',          entity: 'cycle',    category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_field.cycle.failed',    label: 'Ciclo de cultivo fallido',    entity: 'cycle',    category: 'custom',     clientBroadcast: true },
  ],
} as const)

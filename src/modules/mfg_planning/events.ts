import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'mfg_planning',
  events: [
    { id: 'mfg_planning.schedule.confirmed',    label: 'MPS confirmado por el planificador',   entity: 'schedule', category: 'lifecycle', clientBroadcast: true },
    { id: 'mfg_planning.capacity.overloaded',   label: 'Centro de trabajo sobrecargado en MPS', entity: 'capacity', category: 'custom',     clientBroadcast: true },
  ],
} as const)

import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'school_calendar',
  events: [
    { id: 'school_calendar.event.created', label: 'Evento creado', entity: 'event', category: 'crud' },
    { id: 'school_calendar.event.updated', label: 'Evento actualizado', entity: 'event', category: 'crud' },
    { id: 'school_calendar.event.deleted', label: 'Evento eliminado', entity: 'event', category: 'crud' },
  ],
} as const)

import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'academy_attendance',
  events: [
    { id: 'academy_attendance.session.recorded', label: 'Asistencia registrada', entity: 'attendance', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)

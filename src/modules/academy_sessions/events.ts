import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'academy_sessions',
  events: [
    { id: 'academy_sessions.session.completed', label: 'Sesión completada', entity: 'session', category: 'lifecycle', clientBroadcast: true },
    { id: 'academy_sessions.session.cancelled', label: 'Sesión cancelada', entity: 'session', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)

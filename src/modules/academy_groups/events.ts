import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'academy_groups',
  events: [
    { id: 'academy_groups.group.created', label: 'Grupo creado', entity: 'group', category: 'crud' },
    { id: 'academy_groups.group.started', label: 'Grupo iniciado', entity: 'group', category: 'lifecycle', clientBroadcast: true },
    { id: 'academy_groups.group.completed', label: 'Grupo completado', entity: 'group', category: 'lifecycle', clientBroadcast: true },
    { id: 'academy_groups.sessions.generated', label: 'Sesiones generadas', entity: 'session', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
